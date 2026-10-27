/**
 * Modelo de circulación: préstamos, devoluciones y renovaciones.
 * Contiene las reglas de negocio (modelo "rico") y las ejecuta en
 * transacciones para que ejemplares, lista de espera y multas queden
 * siempre consistentes.
 */
import { query, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { hoy, sumarDias, diferenciaDias } from '../utils/fechas.js';
import { EjemplarModel } from './EjemplarModel.js';

const { diasPrestamo, maxRenovaciones, maxPrestamosActivos, multaPorDia } = env.reglas;

const SELECT_PRESTAMO = `
  SELECT p.*, l.Titulo, l.ISBN, u.Nombre_Usuario, u.Matricula_Nomina,
         d.id_devolucion, d.Fecha_Devolucion,
         (SELECT COUNT(*) FROM Renovaciones r WHERE r.id_prestamo = p.id_prestamo) AS Num_Renovaciones
    FROM Prestamos p
    JOIN Libros l   ON l.id_libro = p.id_libro
    JOIN Usuarios u ON u.id_usuario = p.id_usuario
    LEFT JOIN Devoluciones d ON d.id_prestamo = p.id_prestamo`;

const PrestamoModel = {
  /** Marca como vencidos los préstamos activos cuya fecha ya pasó. */
  marcarVencidos(conn) {
    return query(
      `UPDATE Prestamos SET Estado = 'Vencido'
        WHERE Estado = 'Activo' AND Fecha_Entrega_Programada < CURDATE()`,
      [],
      conn,
    );
  },

  async listar({ idUsuario, estado, limit = 100, offset = 0 } = {}) {
    await PrestamoModel.marcarVencidos();
    const where = [];
    const params = [];
    if (idUsuario) { where.push('p.id_usuario = ?'); params.push(idUsuario); }
    if (estado) { where.push('p.Estado = ?'); params.push(estado); }
    params.push(Number(limit), Number(offset));
    return query(
      `${SELECT_PRESTAMO}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY p.Fecha_Prestamo DESC, p.id_prestamo DESC
       LIMIT ? OFFSET ?`,
      params,
    );
  },

  async findById(id, conn) {
    const rows = await query(`${SELECT_PRESTAMO} WHERE p.id_prestamo = ?`, [id], conn);
    const prestamo = rows[0];
    if (!prestamo) return null;
    prestamo.renovaciones = await query(
      'SELECT * FROM Renovaciones WHERE id_prestamo = ? ORDER BY num_prestamo',
      [id],
      conn,
    );
    return prestamo;
  },

  /**
   * Registra un préstamo. Si el usuario tenía un apartado notificado
   * para el libro, se le entrega el ejemplar apartado.
   */
  prestar({ idUsuario, idLibro, numCopia }) {
    return withTransaction(async (conn) => {
      await PrestamoModel.marcarVencidos(conn);

      const [usuario] = await query(
        'SELECT id_usuario, Estatus FROM Usuarios WHERE id_usuario = ? FOR UPDATE',
        [idUsuario],
        conn,
      );
      if (!usuario) throw HttpError.notFound('Usuario no encontrado');
      if (usuario.Estatus !== 'Activo') throw HttpError.conflict('El usuario no está activo');

      const [{ pendientes }] = await query(
        'SELECT COUNT(*) AS pendientes FROM Multas WHERE id_usuario = ? AND Fecha_Pagado IS NULL',
        [idUsuario],
        conn,
      );
      if (pendientes > 0) {
        throw HttpError.conflict('El usuario tiene multas pendientes de pago', { codigo: 'MULTAS_PENDIENTES' });
      }

      const activos = await query(
        `SELECT id_libro, Estado FROM Prestamos
          WHERE id_usuario = ? AND Estado IN ('Activo','Vencido')`,
        [idUsuario],
        conn,
      );
      if (activos.some((p) => p.Estado === 'Vencido')) {
        throw HttpError.conflict('El usuario tiene préstamos vencidos', { codigo: 'PRESTAMOS_VENCIDOS' });
      }
      if (activos.length >= maxPrestamosActivos) {
        throw HttpError.conflict(
          `Se alcanzó el máximo de ${maxPrestamosActivos} préstamos activos`,
          { codigo: 'MAXIMO_PRESTAMOS' },
        );
      }
      if (activos.some((p) => p.id_libro === Number(idLibro))) {
        throw HttpError.conflict('El usuario ya tiene un ejemplar de este libro');
      }

      const [libro] = await query('SELECT id_libro, Estatus FROM Libros WHERE id_libro = ?', [idLibro], conn);
      if (!libro || libro.Estatus !== 'Activo') throw HttpError.notFound('Libro no encontrado');

      const ejemplar = await elegirEjemplar(conn, idUsuario, idLibro, numCopia);

      const fechaPrestamo = hoy();
      const result = await query(
        `INSERT INTO Prestamos (Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro, num_copia)
         VALUES (?, ?, 'Activo', ?, ?, ?)`,
        [fechaPrestamo, sumarDias(fechaPrestamo, diasPrestamo), idUsuario, idLibro, ejemplar.num_copia],
        conn,
      );
      await EjemplarModel.setEstatus(idLibro, ejemplar.num_copia, 'En prestamo', conn);

      return PrestamoModel.findById(result.insertId, conn);
    });
  },

  /**
   * Registra la devolución, genera multa si hay retraso y libera el
   * ejemplar o lo aparta para el siguiente en la lista de espera.
   */
  devolver(idPrestamo, { fechaDevolucion = hoy() } = {}) {
    return withTransaction(async (conn) => {
      const [prestamo] = await query(
        'SELECT * FROM Prestamos WHERE id_prestamo = ? FOR UPDATE',
        [idPrestamo],
        conn,
      );
      if (!prestamo) throw HttpError.notFound('Préstamo no encontrado');
      if (prestamo.Estado === 'Devuelto') throw HttpError.conflict('El préstamo ya fue devuelto');

      await query(
        'INSERT INTO Devoluciones (id_prestamo, Fecha_Devolucion) VALUES (?, ?)',
        [idPrestamo, fechaDevolucion],
        conn,
      );
      await query(`UPDATE Prestamos SET Estado = 'Devuelto' WHERE id_prestamo = ?`, [idPrestamo], conn);

      let multa = null;
      const diasRetraso = diferenciaDias(prestamo.Fecha_Entrega_Programada, fechaDevolucion);
      if (diasRetraso > 0) {
        const cantidad = Number((diasRetraso * multaPorDia).toFixed(2));
        const r = await query(
          `INSERT INTO Multas (Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion)
           VALUES (?, ?, ?, ?)`,
          [cantidad, prestamo.id_usuario, idPrestamo, `Devolución con ${diasRetraso} día(s) de retraso`],
          conn,
        );
        [multa] = await query('SELECT * FROM Multas WHERE id_multa = ?', [r.insertId], conn);
      }

      const [siguiente] = await query(
        `SELECT * FROM ListaEspera
          WHERE id_libro = ? AND Estatus = 'En espera'
          ORDER BY Fecha_Peticion, id_lista_espera LIMIT 1 FOR UPDATE`,
        [prestamo.id_libro],
        conn,
      );
      if (siguiente) {
        await query(
          `UPDATE ListaEspera SET Estatus = 'Notificado' WHERE id_lista_espera = ?`,
          [siguiente.id_lista_espera],
          conn,
        );
      }
      // Solo las copias de "Consulta externa" se prestan, así que vuelve a ese estado.
      await EjemplarModel.setEstatus(
        prestamo.id_libro,
        prestamo.num_copia,
        siguiente ? 'Apartado' : 'Consulta externa',
        conn,
      );

      return {
        prestamo: await PrestamoModel.findById(idPrestamo, conn),
        multa,
        apartadoPara: siguiente ? siguiente.id_usuario : null,
      };
    });
  },

  /** Extiende la fecha de entrega si cumple las políticas de renovación. */
  renovar(idPrestamo) {
    return withTransaction(async (conn) => {
      await PrestamoModel.marcarVencidos(conn);
      const [prestamo] = await query(
        'SELECT * FROM Prestamos WHERE id_prestamo = ? FOR UPDATE',
        [idPrestamo],
        conn,
      );
      if (!prestamo) throw HttpError.notFound('Préstamo no encontrado');
      if (prestamo.Estado === 'Vencido') throw HttpError.conflict('Un préstamo vencido no puede renovarse');
      if (prestamo.Estado !== 'Activo') throw HttpError.conflict('El préstamo no está activo');

      const [{ n }] = await query(
        'SELECT COUNT(*) AS n FROM Renovaciones WHERE id_prestamo = ?',
        [idPrestamo],
        conn,
      );
      if (n >= maxRenovaciones) {
        throw HttpError.conflict(`Se alcanzó el máximo de ${maxRenovaciones} renovaciones`);
      }

      const [{ enEspera }] = await query(
        `SELECT COUNT(*) AS enEspera FROM ListaEspera
          WHERE id_libro = ? AND Estatus = 'En espera'`,
        [prestamo.id_libro],
        conn,
      );
      if (enEspera > 0) {
        throw HttpError.conflict('Hay usuarios en lista de espera para este libro');
      }

      const anterior = prestamo.Fecha_Entrega_Programada;
      await query(
        `INSERT INTO Renovaciones (id_prestamo, num_prestamo, Fecha_Renovacion, Fecha_Previamente_Programada)
         VALUES (?, ?, ?, ?)`,
        [idPrestamo, n + 1, hoy(), anterior],
        conn,
      );
      await query(
        'UPDATE Prestamos SET Fecha_Entrega_Programada = ? WHERE id_prestamo = ?',
        [sumarDias(anterior, diasPrestamo), idPrestamo],
        conn,
      );
      return PrestamoModel.findById(idPrestamo, conn);
    });
  },
};

/**
 * Selecciona el ejemplar a prestar:
 *  1. el apartado para el usuario (lista de espera notificada),
 *  2. la copia solicitada si es de Consulta externa,
 *  3. la primera copia de Consulta externa.
 */
async function elegirEjemplar(conn, idUsuario, idLibro, numCopia) {
  const [apartado] = await query(
    `SELECT id_lista_espera FROM ListaEspera
      WHERE id_usuario = ? AND id_libro = ? AND Estatus = 'Notificado'
      LIMIT 1 FOR UPDATE`,
    [idUsuario, idLibro],
    conn,
  );
  if (apartado) {
    const [copia] = await query(
      `SELECT * FROM Ejemplares WHERE id_libro = ? AND Estatus = 'Apartado'
        ORDER BY num_copia LIMIT 1 FOR UPDATE`,
      [idLibro],
      conn,
    );
    if (copia) {
      await query(
        `UPDATE ListaEspera SET Estatus = 'Atendido' WHERE id_lista_espera = ?`,
        [apartado.id_lista_espera],
        conn,
      );
      return copia;
    }
  }

  if (numCopia) {
    const copia = await EjemplarModel.findOne(idLibro, numCopia, conn);
    if (!copia) throw HttpError.notFound('Ejemplar no encontrado');
    if (copia.Estatus !== 'Consulta externa') {
      throw HttpError.conflict('Solo se prestan copias de «Consulta externa» que no estén prestadas');
    }
    return copia;
  }

  const copia = await EjemplarModel.findPrestable(idLibro, conn);
  if (!copia) {
    throw HttpError.conflict('No hay copias para llevar a casa; puedes unirte a la lista de espera', {
      codigo: 'SIN_EJEMPLARES',
    });
  }
  return copia;
}

export { PrestamoModel };
