/**
 * Solicitudes de compra (módulo "Solicitar libros" del prototipo).
 * Una orden puede incluir títulos nuevos (NuevosLibros) y/o más copias de
 * libros que ya están en el catálogo (OrdenLibrosExistentes).
 * Flujo: Pendiente → En revision → Aprobada → Recibida, o Rechazada.
 */
import { query, withTransaction } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';
import { hoy } from '../utils/fechas.js';
import { EjemplarModel } from './EjemplarModel.js';

const TRANSICIONES = {
  Pendiente: ['En revision', 'Aprobada', 'Rechazada'],
  'En revision': ['Aprobada', 'Rechazada'],
  Aprobada: ['Recibida', 'Rechazada'],
  Rechazada: [],
  Recibida: [],
};

const OrdenCompraModel = {
  TRANSICIONES,

  listar({ idUsuario, estatus, limit = 100, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (idUsuario) { where.push('o.id_usuario = ?'); params.push(idUsuario); }
    if (estatus) { where.push('o.Estatus = ?'); params.push(estatus); }
    params.push(Number(limit), Number(offset));
    return query(
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
  solicitudesAbiertas() {
    return query(
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

  async contarPendientes() {
    const [{ n }] = await query(
      `SELECT COUNT(*) AS n FROM OrdenesCompra WHERE Estatus IN ('Pendiente','En revision')`,
    );
    return n;
  },

  async findById(id, conn) {
    const rows = await query(
      `SELECT o.*, u.Nombre_Completo
         FROM OrdenesCompra o JOIN Usuarios u ON u.id_usuario = o.id_usuario
        WHERE o.id_orden = ?`,
      [id],
      conn,
    );
    const orden = rows[0];
    if (!orden) return null;
    const [nuevos, existentes] = await Promise.all([
      query(
        `SELECT oln.*, nl.ISBN, nl.Titulo, nl.Autor, nl.Editorial, nl.Precio, nl.Anio, nl.Tema, nl.Sinopsis
           FROM OrdenLibrosNuevos oln
           JOIN NuevosLibros nl ON nl.id_libro_nuevo = oln.id_libro_nuevo
          WHERE oln.id_orden = ?`,
        [id], conn,
      ),
      query(
        `SELECT ole.*, l.ISBN, l.Titulo, l.Precio
           FROM OrdenLibrosExistentes ole
           JOIN Libros l ON l.id_libro = ole.id_libro
          WHERE ole.id_orden = ?`,
        [id], conn,
      ),
    ]);
    return { ...orden, librosNuevos: nuevos, librosExistentes: existentes };
  },

  /**
   * Crea una orden. Un libro nuevo puede referenciarse por id_libro_nuevo
   * o darse de alta en la misma orden con `nuevo: {...}`; si el ISBN ya
   * está en el catálogo se rechaza (debe pedirse como "más copias").
   */
  crear({ librosNuevos = [], librosExistentes = [] }, idUsuario) {
    if (!librosNuevos.length && !librosExistentes.length) {
      throw HttpError.badRequest('La orden debe incluir al menos un libro');
    }
    return withTransaction(async (conn) => {
      const r = await query(
        `INSERT INTO OrdenesCompra (id_usuario, Fecha_Orden, Estatus, CantidadTotal)
         VALUES (?, ?, 'Pendiente', 0)`,
        [idUsuario, hoy()],
        conn,
      );
      const idOrden = r.insertId;
      let total = 0;

      for (const item of librosNuevos) {
        let idLibroNuevo = item.id_libro_nuevo;
        if (!idLibroNuevo && item.nuevo) {
          const n = item.nuevo;
          const [enCatalogo] = await query('SELECT id_libro FROM Libros WHERE ISBN = ?', [n.ISBN], conn);
          if (enCatalogo) {
            throw HttpError.conflict('Ese ISBN ya está en el catálogo; solicita más copias desde Libros.', {
              codigo: 'ISBN_EN_CATALOGO', id_libro: enCatalogo.id_libro,
            });
          }
          let editorial = n.Editorial ?? null;
          if (n.id_editorial) {
            const [ed] = await query('SELECT Nombre_Editorial FROM Editoriales WHERE id_editorial = ?', [n.id_editorial], conn);
            if (!ed) throw HttpError.badRequest('La editorial no existe');
            editorial = ed.Nombre_Editorial;
          }
          const alta = await query(
            `INSERT INTO NuevosLibros (ISBN, Titulo, Autor, Editorial, Precio, Anio, Tema, Sinopsis)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id_libro_nuevo = LAST_INSERT_ID(id_libro_nuevo)`,
            [n.ISBN, n.Titulo, n.Autor ?? null, editorial, n.Precio ?? 0, n.Anio ?? null, n.Tema ?? null, n.Sinopsis ?? null],
            conn,
          );
          idLibroNuevo = alta.insertId;
        }
        const [libro] = await query('SELECT Precio FROM NuevosLibros WHERE id_libro_nuevo = ?', [idLibroNuevo], conn);
        if (!libro) throw HttpError.badRequest(`Libro nuevo ${idLibroNuevo} no existe`);
        await query(
          `INSERT INTO OrdenLibrosNuevos (id_orden, id_libro_nuevo, Justificacion, Num_Ejemplares)
           VALUES (?, ?, ?, ?)`,
          [idOrden, idLibroNuevo, item.Justificacion ?? null, item.Num_Ejemplares],
          conn,
        );
        total += libro.Precio * item.Num_Ejemplares;
      }

      for (const item of librosExistentes) {
        const [libro] = await query('SELECT Precio, Estatus FROM Libros WHERE id_libro = ?', [item.id_libro], conn);
        if (!libro) throw HttpError.badRequest(`Libro ${item.id_libro} no existe`);
        await query(
          `INSERT INTO OrdenLibrosExistentes (id_orden, id_libro, Justificacion, Num_Ejemplares)
           VALUES (?, ?, ?, ?)`,
          [idOrden, item.id_libro, item.Justificacion ?? null, item.Num_Ejemplares],
          conn,
        );
        total += libro.Precio * item.Num_Ejemplares;
      }

      await query(
        'UPDATE OrdenesCompra SET CantidadTotal = ? WHERE id_orden = ?',
        [Number(total.toFixed(2)), idOrden],
        conn,
      );
      return OrdenCompraModel.findById(idOrden, conn);
    });
  },

  /**
   * Cambia el estatus respetando el flujo. Al recibir, agrega al
   * inventario las copias pedidas de libros existentes.
   */
  cambiarEstatus(id, nuevoEstatus) {
    return withTransaction(async (conn) => {
      const [orden] = await query('SELECT * FROM OrdenesCompra WHERE id_orden = ? FOR UPDATE', [id], conn);
      if (!orden) throw HttpError.notFound('Orden no encontrada');
      if (!TRANSICIONES[orden.Estatus].includes(nuevoEstatus)) {
        throw HttpError.conflict(`No se puede pasar de ${orden.Estatus} a ${nuevoEstatus}`);
      }

      await query('UPDATE OrdenesCompra SET Estatus = ? WHERE id_orden = ?', [nuevoEstatus, id], conn);

      if (nuevoEstatus === 'Recibida') {
        const existentes = await query(
          'SELECT id_libro, Num_Ejemplares FROM OrdenLibrosExistentes WHERE id_orden = ?',
          [id],
          conn,
        );
        for (const item of existentes) {
          await EjemplarModel.agregar(item.id_libro, item.Num_Ejemplares, {}, conn);
        }
      }
      return OrdenCompraModel.findById(id, conn);
    });
  },
};

export { OrdenCompraModel };
