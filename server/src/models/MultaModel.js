import { query } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';
import { hoy } from '../utils/fechas.js';

const SELECT_MULTA = `
  SELECT m.*, u.Nombre_Usuario, u.Matricula_Nomina, l.Titulo,
         CASE WHEN m.Fecha_Pagado IS NULL THEN 'Pendiente' ELSE 'Pagada' END AS Estado
    FROM Multas m
    JOIN Usuarios u ON u.id_usuario = m.id_usuario
    LEFT JOIN Prestamos p ON p.id_prestamo = m.id_prestamo
    LEFT JOIN Libros l ON l.id_libro = p.id_libro`;

const MultaModel = {
  listar({ idUsuario, pendientes, limit = 100, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (idUsuario) { where.push('m.id_usuario = ?'); params.push(idUsuario); }
    if (pendientes === true) where.push('m.Fecha_Pagado IS NULL');
    if (pendientes === false) where.push('m.Fecha_Pagado IS NOT NULL');
    params.push(Number(limit), Number(offset));
    return query(
      `${SELECT_MULTA}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY m.Fecha_Pagado IS NULL DESC, m.id_multa DESC
       LIMIT ? OFFSET ?`,
      params,
    );
  },

  async findById(id) {
    const rows = await query(`${SELECT_MULTA} WHERE m.id_multa = ?`, [id]);
    return rows[0] || null;
  },

  /** Multa manual (p. ej. por daño), sin préstamo obligatorio. */
  async crear({ id_usuario, id_prestamo = null, Cantidad_a_Pagar, Justificacion }) {
    const r = await query(
      `INSERT INTO Multas (Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion)
       VALUES (?, ?, ?, ?)`,
      [Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion],
    );
    return MultaModel.findById(r.insertId);
  },

  async pagar(id, fecha = hoy()) {
    const multa = await MultaModel.findById(id);
    if (!multa) throw HttpError.notFound('Multa no encontrada');
    if (multa.Fecha_Pagado) throw HttpError.conflict('La multa ya está pagada');
    await query('UPDATE Multas SET Fecha_Pagado = ? WHERE id_multa = ?', [fecha, id]);
    return MultaModel.findById(id);
  },
};

export { MultaModel };
