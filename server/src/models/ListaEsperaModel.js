import { query, withTransaction } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';

const SELECT_LISTA = `
  SELECT le.*, l.Titulo, l.ISBN, u.Nombre_Usuario, u.Matricula_Nomina,
         (SELECT COUNT(*) FROM ListaEspera x
           WHERE x.id_libro = le.id_libro AND x.Estatus = 'En espera'
             AND (x.Fecha_Peticion < le.Fecha_Peticion
                  OR (x.Fecha_Peticion = le.Fecha_Peticion AND x.id_lista_espera < le.id_lista_espera))
         ) + 1 AS Posicion
    FROM ListaEspera le
    JOIN Libros l   ON l.id_libro = le.id_libro
    JOIN Usuarios u ON u.id_usuario = le.id_usuario`;

const ListaEsperaModel = {
  listar({ idUsuario, idLibro, estatus, limit = 100, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (idUsuario) { where.push('le.id_usuario = ?'); params.push(idUsuario); }
    if (idLibro) { where.push('le.id_libro = ?'); params.push(idLibro); }
    if (estatus) { where.push('le.Estatus = ?'); params.push(estatus); }
    params.push(Number(limit), Number(offset));
    return query(
      `${SELECT_LISTA}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY le.Fecha_Peticion, le.id_lista_espera
       LIMIT ? OFFSET ?`,
      params,
    );
  },

  async findById(id, conn) {
    const rows = await query(`${SELECT_LISTA} WHERE le.id_lista_espera = ?`, [id], conn);
    return rows[0] || null;
  },

  /** Solo se puede apartar un libro sin copias de Consulta externa libres. */
  inscribir(idUsuario, idLibro) {
    return withTransaction(async (conn) => {
      const [libro] = await query(
        'SELECT id_libro, Estatus FROM Libros WHERE id_libro = ?',
        [idLibro],
        conn,
      );
      if (!libro || libro.Estatus !== 'Activo') throw HttpError.notFound('Libro no encontrado');

      const [{ prestables }] = await query(
        `SELECT COUNT(*) AS prestables FROM Ejemplares
          WHERE id_libro = ? AND Estatus = 'Consulta externa'`,
        [idLibro],
        conn,
      );
      if (prestables > 0) {
        throw HttpError.conflict('Hay copias para llevar a casa; solicita el préstamo directamente');
      }

      const [duplicado] = await query(
        `SELECT 1 FROM ListaEspera
          WHERE id_usuario = ? AND id_libro = ? AND Estatus IN ('En espera','Notificado')`,
        [idUsuario, idLibro],
        conn,
      );
      if (duplicado) throw HttpError.conflict('Ya estás en la lista de espera de este libro');

      const [prestado] = await query(
        `SELECT 1 FROM Prestamos
          WHERE id_usuario = ? AND id_libro = ? AND Estado IN ('Activo','Vencido')`,
        [idUsuario, idLibro],
        conn,
      );
      if (prestado) throw HttpError.conflict('Ya tienes este libro en préstamo');

      const r = await query(
        'INSERT INTO ListaEspera (id_usuario, id_libro) VALUES (?, ?)',
        [idUsuario, idLibro],
        conn,
      );
      return ListaEsperaModel.findById(r.insertId, conn);
    });
  },

  /**
   * Cancela un apartado. Si estaba notificado, el ejemplar apartado pasa
   * al siguiente en espera o vuelve a quedar disponible.
   */
  cancelar(id) {
    return withTransaction(async (conn) => {
      const [registro] = await query(
        'SELECT * FROM ListaEspera WHERE id_lista_espera = ? FOR UPDATE',
        [id],
        conn,
      );
      if (!registro) throw HttpError.notFound('Registro de lista de espera no encontrado');
      if (!['En espera', 'Notificado'].includes(registro.Estatus)) {
        throw HttpError.conflict('El registro ya no está activo');
      }

      await query(`UPDATE ListaEspera SET Estatus = 'Cancelado' WHERE id_lista_espera = ?`, [id], conn);

      if (registro.Estatus === 'Notificado') {
        const [siguiente] = await query(
          `SELECT id_lista_espera FROM ListaEspera
            WHERE id_libro = ? AND Estatus = 'En espera'
            ORDER BY Fecha_Peticion, id_lista_espera LIMIT 1 FOR UPDATE`,
          [registro.id_libro],
          conn,
        );
        if (siguiente) {
          await query(
            `UPDATE ListaEspera SET Estatus = 'Notificado' WHERE id_lista_espera = ?`,
            [siguiente.id_lista_espera],
            conn,
          );
        } else {
          await query(
            `UPDATE Ejemplares SET Estatus = 'Consulta externa'
              WHERE id_libro = ? AND Estatus = 'Apartado' LIMIT 1`,
            [registro.id_libro],
            conn,
          );
        }
      }
      return ListaEsperaModel.findById(id, conn);
    });
  },
};

export { ListaEsperaModel };
