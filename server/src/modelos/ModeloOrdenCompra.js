/**
 * Solicitudes de compra (módulo "Solicitar libros" del prototipo).
 * Una orden puede incluir títulos nuevos (NuevosLibros) y/o más copias de
 * libros que ya están en el catálogo (OrdenLibrosExistentes).
 * Flujo: Pendiente → En revision → Aprobada → Recibida, o Rechazada.
 */
import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy } from '../utilidades/fechas.js';
import { ModeloEjemplar } from './ModeloEjemplar.js';

const TRANSICIONES = {
  Pendiente: ['En revision', 'Aprobada', 'Rechazada'],
  'En revision': ['Aprobada', 'Rechazada'],
  Aprobada: ['Recibida', 'Rechazada'],
  Rechazada: [],
  Recibida: [],
};

const ModeloOrdenCompra = {
  TRANSICIONES,

  Listar({ id_usuario, estatus, limit = 100, offset = 0 } = {}) 
  {
    const where = [];
    const params = [];
    if (id_usuario) 
    {
      where.push('o.id_usuario = ?');
      params.push(id_usuario);
    }
    if (estatus) 
    {
      where.push('o.Estatus = ?');
      params.push(estatus);
    }
    params.push(Number(limit), Number(offset));
    return Consultar(
      `SELECT o.*, u.Nombre_Completo
         FROM OrdenesCompra o JOIN Usuarios u ON u.id_usuario = o.id_usuario
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY o.Fecha_Orden DESC, o.id_orden DESC
        LIMIT ? OFFSET ?`,
      params,
    );
  },

  /**
   * Renglones de todas las órdenes abiertas (tabla "Solicitudes
   * pendientes"): título, editorial, cantidad y estado.
   */
  SolicitudesAbiertas() 
  {
    return Consultar(
      `SELECT o.id_orden, o.Fecha_Orden, o.Estatus, 'existente' AS Tipo,
              l.id_libro AS id_referencia, l.Titulo, e.Nombre_Editorial AS Editorial, ole.Num_Ejemplares
         FROM OrdenLibrosExistentes ole
         JOIN OrdenesCompra o ON o.id_orden = ole.id_orden
         JOIN Libros l        ON l.id_libro = ole.id_libro
         JOIN Editoriales e   ON e.id_editorial = l.id_editorial
        WHERE o.Estatus IN ('Pendiente','En revision','Aprobada')
       UNION ALL
       SELECT o.id_orden, o.Fecha_Orden, o.Estatus, 'nuevo' AS Tipo,
              nl.id_libro_nuevo, nl.Titulo, nl.Editorial, oln.Num_Ejemplares
         FROM OrdenLibrosNuevos oln
         JOIN OrdenesCompra o ON o.id_orden = oln.id_orden
         JOIN NuevosLibros nl ON nl.id_libro_nuevo = oln.id_libro_nuevo
        WHERE o.Estatus IN ('Pendiente','En revision','Aprobada')
       ORDER BY Fecha_Orden DESC, id_orden DESC`,
    );
  },

  async ContarPendientes() 
  {
    const [{ n: total }] = await Consultar(
      'SELECT COUNT(*) AS n FROM OrdenesCompra WHERE Estatus IN (\'Pendiente\',\'En revision\')',
    );
    return total;
  },

  async BuscarPorId(id, conn) 
  {
    const rows = await Consultar(
      `SELECT o.*, u.Nombre_Completo
         FROM OrdenesCompra o JOIN Usuarios u ON u.id_usuario = o.id_usuario
        WHERE o.id_orden = ?`,
      [id],
      conn,
    );
    const orden = rows[0];
    if (!orden) 
    {
      return null;
    }
    const [nuevos, existentes] = await Promise.all([
      Consultar(
        `SELECT oln.*, nl.ISBN, nl.Titulo, nl.Autor, nl.Editorial, nl.Precio, nl.Anio, nl.Tema, nl.Sinopsis
           FROM OrdenLibrosNuevos oln
           JOIN NuevosLibros nl ON nl.id_libro_nuevo = oln.id_libro_nuevo
          WHERE oln.id_orden = ?`,
        [id],
        conn,
      ),
      Consultar(
        `SELECT ole.*, l.ISBN, l.Titulo, l.Precio
           FROM OrdenLibrosExistentes ole
           JOIN Libros l ON l.id_libro = ole.id_libro
          WHERE ole.id_orden = ?`,
        [id],
        conn,
      ),
    ]);
    return { ...orden, libros_nuevos: nuevos, libros_existentes: existentes };
  },

  /**
   * Crea una orden. Un libro nuevo puede referenciarse por id_libro_nuevo
   * o darse de alta en la misma orden con `nuevo: {...}`; si el ISBN ya
   * está en el catálogo se rechaza (debe pedirse como "más copias").
   */
  Crear(
    { libros_nuevos: libros_nuevos = [], libros_existentes: libros_existentes = [] },
    id_usuario,
  ) 
  {
    if (!libros_nuevos.length && !libros_existentes.length) 
    {
      throw ErrorHttp.SolicitudInvalida('La orden debe incluir al menos un libro');
    }
    return EjecutarEnTransaccion(async (conn) => 
    {
      const resultado = await Consultar(
        `INSERT INTO OrdenesCompra (id_usuario, Fecha_Orden, Estatus, CantidadTotal)
         VALUES (?, ?, 'Pendiente', 0)`,
        [id_usuario, Hoy()],
        conn,
      );
      const id_orden = resultado.insertId;
      let total = 0;

      for (const item of libros_nuevos) 
      {
        let id_libro_nuevo = item.id_libro_nuevo;
        if (!id_libro_nuevo && item.nuevo) 
        {
          const total_actual = item.nuevo;
          const [en_catalogo] = await Consultar(
            'SELECT id_libro FROM Libros WHERE ISBN = ?',
            [total_actual.ISBN],
            conn,
          );
          if (en_catalogo) 
          {
            throw ErrorHttp.Conflicto(
              'Ese ISBN ya está en el catálogo; solicita más copias desde Libros.',
              {
                codigo: 'ISBN_EN_CATALOGO',
                id_libro: en_catalogo.id_libro,
              },
            );
          }
          let editorial = total_actual.Editorial ?? null;
          if (total_actual.id_editorial) 
          {
            const [ed] = await Consultar(
              'SELECT Nombre_Editorial FROM Editoriales WHERE id_editorial = ?',
              [total_actual.id_editorial],
              conn,
            );
            if (!ed) 
            {
              throw ErrorHttp.SolicitudInvalida('La editorial no existe');
            }
            editorial = ed.Nombre_Editorial;
          }
          const alta = await Consultar(
            `INSERT INTO NuevosLibros (ISBN, Titulo, Autor, Editorial, Precio, Anio, Tema, Sinopsis)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id_libro_nuevo = LAST_INSERT_ID(id_libro_nuevo)`,
            [
              total_actual.ISBN,
              total_actual.Titulo,
              total_actual.Autor ?? null,
              editorial,
              total_actual.Precio ?? 0,
              total_actual.Anio ?? null,
              total_actual.Tema ?? null,
              total_actual.Sinopsis ?? null,
            ],
            conn,
          );
          id_libro_nuevo = alta.insertId;
        }
        const [libro] = await Consultar(
          'SELECT Precio FROM NuevosLibros WHERE id_libro_nuevo = ?',
          [id_libro_nuevo],
          conn,
        );
        if (!libro) 
        {
          throw ErrorHttp.SolicitudInvalida(`Libro nuevo ${id_libro_nuevo} no existe`);
        }
        await Consultar(
          `INSERT INTO OrdenLibrosNuevos (id_orden, id_libro_nuevo, Justificacion, Num_Ejemplares)
           VALUES (?, ?, ?, ?)`,
          [id_orden, id_libro_nuevo, item.Justificacion ?? null, item.Num_Ejemplares],
          conn,
        );
        total += libro.Precio * item.Num_Ejemplares;
      }

      for (const item of libros_existentes) 
      {
        const [libro] = await Consultar(
          'SELECT Precio, Estatus FROM Libros WHERE id_libro = ?',
          [item.id_libro],
          conn,
        );
        if (!libro) 
        {
          throw ErrorHttp.SolicitudInvalida(`Libro ${item.id_libro} no existe`);
        }
        await Consultar(
          `INSERT INTO OrdenLibrosExistentes (id_orden, id_libro, Justificacion, Num_Ejemplares)
           VALUES (?, ?, ?, ?)`,
          [id_orden, item.id_libro, item.Justificacion ?? null, item.Num_Ejemplares],
          conn,
        );
        total += libro.Precio * item.Num_Ejemplares;
      }

      await Consultar(
        'UPDATE OrdenesCompra SET CantidadTotal = ? WHERE id_orden = ?',
        [Number(total.toFixed(2)), id_orden],
        conn,
      );
      return ModeloOrdenCompra.BuscarPorId(id_orden, conn);
    });
  },

  /**
   * Cambia el estatus respetando el flujo. Al recibir, agrega al
   * inventario las copias pedidas de libros existentes.
   */
  CambiarEstatus(id, nuevo_estatus) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [orden] = await Consultar(
        'SELECT * FROM OrdenesCompra WHERE id_orden = ? FOR UPDATE',
        [id],
        conn,
      );
      if (!orden) 
      {
        throw ErrorHttp.NoEncontrado('Orden no encontrada');
      }
      if (!TRANSICIONES[orden.Estatus].includes(nuevo_estatus)) 
      {
        throw ErrorHttp.Conflicto(`No se puede pasar de ${orden.Estatus} a ${nuevo_estatus}`);
      }

      await Consultar(
        'UPDATE OrdenesCompra SET Estatus = ? WHERE id_orden = ?',
        [nuevo_estatus, id],
        conn,
      );

      if (nuevo_estatus === 'Recibida') 
      {
        const existentes = await Consultar(
          'SELECT id_libro, Num_Ejemplares FROM OrdenLibrosExistentes WHERE id_orden = ?',
          [id],
          conn,
        );
        for (const item of existentes) 
        {
          await ModeloEjemplar.Agregar(item.id_libro, item.Num_Ejemplares, {}, conn);
        }
      }
      return ModeloOrdenCompra.BuscarPorId(id, conn);
    });
  },
};

export { ModeloOrdenCompra };
