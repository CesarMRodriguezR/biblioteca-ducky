/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL01 · ModeloOrdenCompra.js
 * Función: Órdenes de compra de libros nuevos o de más copias y su flujo de estatus.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos validados por los controladores
 * Salida: Filas de la base de datos MariaDB o ErrorHttp si se rompe una regla
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     TRANSICIONES        Estatus a los que puede pasar una orden desde cada estatus
 *     ModeloOrdenCompra   Acceso a las órdenes de compra
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: contiene la lógica de negocio y el acceso a la base de datos.
 * (2) Toda consulta es parametrizada (?); nunca se concatenan datos del usuario en el SQL.
 * (3) Requiere la base de datos creada con database/01_schema.sql y la conexión de
 *     configuracion/conexion.js.
 * (4) Las operaciones que modifican varias tablas usan EjecutarEnTransaccion.
 * ******************************************************************
 */

import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy } from '../utilidades/fechas.js';
import { ModeloEjemplar } from './ModeloEjemplar.js';

/*
 * Constante: TRANSICIONES
 * Objetivo: Estatus a los que puede pasar una orden desde cada estatus.
 */
const TRANSICIONES = {
  Pendiente: ['En revision', 'Aprobada', 'Rechazada'],
  'En revision': ['Aprobada', 'Rechazada'],
  Aprobada: ['Recibida', 'Rechazada'],
  Rechazada: [],
  Recibida: [],
};

/*
 * Módulo: ModeloOrdenCompra
 * Objetivo: Acceso a las órdenes de compra.
 */
const ModeloOrdenCompra = {
  TRANSICIONES,

  /*
   * Función: Listar
   * Objetivo: Listar los registros de orden de compra con filtros y paginación.
   * Entrada: { id_usuario, estatus, limit?, offset? } (opcional)
   * Salida: Promesa con las filas encontradas
   */
  Listar({ id_usuario, estatus, limit = 100, offset = 0 } = {})
  {
    const condicion = [];
    const parametros = [];
    if (id_usuario)
    {
      condicion.push('o.id_usuario = ?');
      parametros.push(id_usuario);
    }
    if (estatus)
    {
      condicion.push('o.Estatus = ?');
      parametros.push(estatus);
    }
    parametros.push(Number(limit), Number(offset));
    return Consultar(
      `SELECT o.*, u.Nombre_Completo
         FROM OrdenesCompra o JOIN Usuarios u ON u.id_usuario = o.id_usuario
        ${condicion.length ? `WHERE ${condicion.join(' AND ')}` : ''}
        ORDER BY o.Fecha_Orden DESC, o.id_orden DESC
        LIMIT ? OFFSET ?`,
      parametros,
    );
  },

  /*
   * Función: SolicitudesAbiertas
   * Objetivo: Renglones de todas las órdenes abiertas (tabla "Solicitudes pendientes"): título,
   *           editorial, cantidad y estado.
   * Entrada: Ninguna
   * Salida: Promesa con los renglones abiertos
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

  /*
   * Función: ContarPendientes
   * Objetivo: Contar las órdenes pendientes o en revisión.
   * Entrada: Ninguna
   * Salida: Promesa con el número de órdenes
   */
  async ContarPendientes()
  {
    const [{ n: total }] = await Consultar(
      'SELECT COUNT(*) AS n FROM OrdenesCompra WHERE Estatus IN (\'Pendiente\',\'En revision\')',
    );
    return total;
  },

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener una orden con sus libros nuevos y copias pedidas.
   * Entrada: id, conexion
   * Salida: Promesa con el registro encontrado o null si no existe
   */
  async BuscarPorId(id, conexion)
  {
    const filas = await Consultar(
      `SELECT o.*, u.Nombre_Completo
         FROM OrdenesCompra o JOIN Usuarios u ON u.id_usuario = o.id_usuario
        WHERE o.id_orden = ?`,
      [id],
      conexion,
    );
    const orden = filas[0];
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
        conexion,
      ),
      Consultar(
        `SELECT ole.*, l.ISBN, l.Titulo, l.Precio
           FROM OrdenLibrosExistentes ole
           JOIN Libros l ON l.id_libro = ole.id_libro
          WHERE ole.id_orden = ?`,
        [id],
        conexion,
      ),
    ]);
    return { ...orden, libros_nuevos: nuevos, libros_existentes: existentes };
  },

  /*
   * Función: Crear
   * Objetivo: Crea una orden. Un libro nuevo puede referenciarse por id_libro_nuevo o darse de
   *           alta en la misma orden con `nuevo: {...}`; si el ISBN ya está en el catálogo se
   *           rechaza (debe pedirse como "más copias").
   * Entrada: { libros_nuevos?, libros_existentes? }, id_usuario
   * Salida: Promesa con la orden creada
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
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const resultado = await Consultar(
        `INSERT INTO OrdenesCompra (id_usuario, Fecha_Orden, Estatus, CantidadTotal)
         VALUES (?, ?, 'Pendiente', 0)`,
        [id_usuario, Hoy()],
        conexion,
      );
      const id_orden = resultado.insertId;
      let total = 0;

      for (const elemento of libros_nuevos)
      {
        let id_libro_nuevo = elemento.id_libro_nuevo;
        if (!id_libro_nuevo && elemento.nuevo)
        {
          const total_actual = elemento.nuevo;
          const [en_catalogo] = await Consultar(
            'SELECT id_libro FROM Libros WHERE ISBN = ?',
            [total_actual.ISBN],
            conexion,
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
              conexion,
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
            conexion,
          );
          id_libro_nuevo = alta.insertId;
        }
        const [libro] = await Consultar(
          'SELECT Precio FROM NuevosLibros WHERE id_libro_nuevo = ?',
          [id_libro_nuevo],
          conexion,
        );
        if (!libro)
        {
          throw ErrorHttp.SolicitudInvalida(`Libro nuevo ${id_libro_nuevo} no existe`);
        }
        await Consultar(
          `INSERT INTO OrdenLibrosNuevos (id_orden, id_libro_nuevo, Justificacion, Num_Ejemplares)
           VALUES (?, ?, ?, ?)`,
          [id_orden, id_libro_nuevo, elemento.Justificacion ?? null, elemento.Num_Ejemplares],
          conexion,
        );
        total += libro.Precio * elemento.Num_Ejemplares;
      }

      for (const elemento of libros_existentes)
      {
        const [libro] = await Consultar(
          'SELECT Precio, Estatus FROM Libros WHERE id_libro = ?',
          [elemento.id_libro],
          conexion,
        );
        if (!libro)
        {
          throw ErrorHttp.SolicitudInvalida(`Libro ${elemento.id_libro} no existe`);
        }
        await Consultar(
          `INSERT INTO OrdenLibrosExistentes (id_orden, id_libro, Justificacion, Num_Ejemplares)
           VALUES (?, ?, ?, ?)`,
          [id_orden, elemento.id_libro, elemento.Justificacion ?? null, elemento.Num_Ejemplares],
          conexion,
        );
        total += libro.Precio * elemento.Num_Ejemplares;
      }

      await Consultar(
        'UPDATE OrdenesCompra SET CantidadTotal = ? WHERE id_orden = ?',
        [Number(total.toFixed(2)), id_orden],
        conexion,
      );
      return ModeloOrdenCompra.BuscarPorId(id_orden, conexion);
    });
  },

  /*
   * Función: CambiarEstatus
   * Objetivo: Cambia el estatus respetando el flujo. Al recibir, agrega al inventario las
   *           copias pedidas de libros existentes.
   * Entrada: id, nuevo_estatus
   * Salida: Promesa con la orden actualizada
   */
  CambiarEstatus(id, nuevo_estatus)
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [orden] = await Consultar(
        'SELECT * FROM OrdenesCompra WHERE id_orden = ? FOR UPDATE',
        [id],
        conexion,
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
        conexion,
      );

      if (nuevo_estatus === 'Recibida')
      {
        const existentes = await Consultar(
          'SELECT id_libro, Num_Ejemplares FROM OrdenLibrosExistentes WHERE id_orden = ?',
          [id],
          conexion,
        );
        for (const elemento of existentes)
        {
          await ModeloEjemplar.Agregar(elemento.id_libro, elemento.Num_Ejemplares, {}, conexion);
        }
      }
      return ModeloOrdenCompra.BuscarPorId(id, conexion);
    });
  },
};

export { ModeloOrdenCompra };
