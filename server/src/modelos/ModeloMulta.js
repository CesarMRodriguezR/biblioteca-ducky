import { Consultar } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy } from '../utilidades/fechas.js';

const SELECT_MULTA = `
  SELECT m.*, u.Nombre_Usuario, u.Matricula_Nomina, l.Titulo,
         CASE WHEN m.Fecha_Pagado IS NULL THEN 'Pendiente' ELSE 'Pagada' END AS Estado
    FROM Multas m
    JOIN Usuarios u ON u.id_usuario = m.id_usuario
    LEFT JOIN Prestamos p ON p.id_prestamo = m.id_prestamo
    LEFT JOIN Libros l ON l.id_libro = p.id_libro`;

const ModeloMulta = {
  Listar({ id_usuario, pendientes, limit = 100, offset = 0 } = {}) 
  {
    const where = [];
    const params = [];
    if (id_usuario) 
    {
      where.push('m.id_usuario = ?');
      params.push(id_usuario);
    }
    if (pendientes === true) 
    {
      where.push('m.Fecha_Pagado IS NULL');
    }
    if (pendientes === false) 
    {
      where.push('m.Fecha_Pagado IS NOT NULL');
    }
    params.push(Number(limit), Number(offset));
    return Consultar(
      `${SELECT_MULTA}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY m.Fecha_Pagado IS NULL DESC, m.id_multa DESC
       LIMIT ? OFFSET ?`,
      params,
    );
  },

  async BuscarPorId(id) 
  {
    const rows = await Consultar(`${SELECT_MULTA} WHERE m.id_multa = ?`, [id]);
    return rows[0] || null;
  },

  /** Multa manual (p. ej. por daño), sin préstamo obligatorio. */
  async Crear({ id_usuario, id_prestamo = null, Cantidad_a_Pagar, Justificacion }) 
  {
    const resultado = await Consultar(
      `INSERT INTO Multas (Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion)
       VALUES (?, ?, ?, ?)`,
      [Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion],
    );
    return ModeloMulta.BuscarPorId(resultado.insertId);
  },

  async Pagar(id, fecha = Hoy()) 
  {
    const multa = await ModeloMulta.BuscarPorId(id);
    if (!multa) 
    {
      throw ErrorHttp.NoEncontrado('Multa no encontrada');
    }
    if (multa.Fecha_Pagado) 
    {
      throw ErrorHttp.Conflicto('La multa ya está pagada');
    }
    await Consultar('UPDATE Multas SET Fecha_Pagado = ? WHERE id_multa = ?', [fecha, id]);
    return ModeloMulta.BuscarPorId(id);
  },
};

export { ModeloMulta };
