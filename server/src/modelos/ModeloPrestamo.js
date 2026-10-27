/**
 * Modelo de circulación: préstamos, devoluciones y renovaciones.
 * Contiene las reglas de negocio (modelo "rico") y las ejecuta en
 * transacciones para que ejemplares, lista de espera y multas queden
 * siempre consistentes.
 */
import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ENTORNO } from '../configuracion/entorno.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy, SumarDias, DiferenciaDias } from '../utilidades/fechas.js';
import { ModeloEjemplar } from './ModeloEjemplar.js';

const { DIAS_PRESTAMO, MAX_RENOVACIONES, MAX_PRESTAMOS_ACTIVOS, MULTA_POR_DIA } = ENTORNO.REGLAS;

const SELECT_PRESTAMO = `
  SELECT p.*, l.Titulo, l.ISBN, u.Nombre_Usuario, u.Matricula_Nomina,
         d.id_devolucion, d.Fecha_Devolucion,
         (SELECT COUNT(*) FROM Renovaciones r WHERE r.id_prestamo = p.id_prestamo) AS Num_Renovaciones
    FROM Prestamos p
    JOIN Libros l   ON l.id_libro = p.id_libro
    JOIN Usuarios u ON u.id_usuario = p.id_usuario
    LEFT JOIN Devoluciones d ON d.id_prestamo = p.id_prestamo`;

const ModeloPrestamo = {
  /** Marca como vencidos los préstamos activos cuya fecha ya pasó. */
  MarcarVencidos(conn) 
  {
    return Consultar(
      `UPDATE Prestamos SET Estado = 'Vencido'
        WHERE Estado = 'Activo' AND Fecha_Entrega_Programada < CURDATE()`,
      [],
      conn,
    );
  },

  async Listar({ id_usuario, estado, limit = 100, offset = 0 } = {}) 
  {
    await ModeloPrestamo.MarcarVencidos();
    const where = [];
    const params = [];
    if (id_usuario) 
    {
      where.push('p.id_usuario = ?');
      params.push(id_usuario);
    }
    if (estado) 
    {
      where.push('p.Estado = ?');
      params.push(estado);
    }
    params.push(Number(limit), Number(offset));
    return Consultar(
      `${SELECT_PRESTAMO}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY p.Fecha_Prestamo DESC, p.id_prestamo DESC
       LIMIT ? OFFSET ?`,
      params,
    );
  },

  async BuscarPorId(id, conn) 
  {
    const rows = await Consultar(`${SELECT_PRESTAMO} WHERE p.id_prestamo = ?`, [id], conn);
    const prestamo = rows[0];
    if (!prestamo) 
    {
      return null;
    }
    prestamo.renovaciones = await Consultar(
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
  Prestar({ id_usuario, id_libro, num_copia }) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      await ModeloPrestamo.MarcarVencidos(conn);

      const [usuario] = await Consultar(
        'SELECT id_usuario, Estatus FROM Usuarios WHERE id_usuario = ? FOR UPDATE',
        [id_usuario],
        conn,
      );
      if (!usuario) 
      {
        throw ErrorHttp.NoEncontrado('Usuario no encontrado');
      }
      if (usuario.Estatus !== 'Activo') 
      {
        throw ErrorHttp.Conflicto('El usuario no está activo');
      }

      const [{ pendientes }] = await Consultar(
        'SELECT COUNT(*) AS pendientes FROM Multas WHERE id_usuario = ? AND Fecha_Pagado IS NULL',
        [id_usuario],
        conn,
      );
      if (pendientes > 0) 
      {
        throw ErrorHttp.Conflicto('El usuario tiene multas pendientes de pago', {
          codigo: 'MULTAS_PENDIENTES',
        });
      }

      const activos = await Consultar(
        `SELECT id_libro, Estado FROM Prestamos
          WHERE id_usuario = ? AND Estado IN ('Activo','Vencido')`,
        [id_usuario],
        conn,
      );
      if (activos.some((activo) => activo.Estado === 'Vencido')) 
      {
        throw ErrorHttp.Conflicto('El usuario tiene préstamos vencidos', {
          codigo: 'PRESTAMOS_VENCIDOS',
        });
      }
      if (activos.length >= MAX_PRESTAMOS_ACTIVOS) 
      {
        throw ErrorHttp.Conflicto(
          `Se alcanzó el máximo de ${MAX_PRESTAMOS_ACTIVOS} préstamos activos`,
          { codigo: 'MAXIMO_PRESTAMOS' },
        );
      }
      if (activos.some((activo) => activo.id_libro === Number(id_libro))) 
      {
        throw ErrorHttp.Conflicto('El usuario ya tiene un ejemplar de este libro');
      }

      const [libro] = await Consultar(
        'SELECT id_libro, Estatus FROM Libros WHERE id_libro = ?',
        [id_libro],
        conn,
      );
      if (!libro || libro.Estatus !== 'Activo') 
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }

      const ejemplar = await ElegirEjemplar(conn, id_usuario, id_libro, num_copia);

      const fecha_prestamo = Hoy();
      const result = await Consultar(
        `INSERT INTO Prestamos (Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro, num_copia)
         VALUES (?, ?, 'Activo', ?, ?, ?)`,
        [
          fecha_prestamo,
          SumarDias(fecha_prestamo, DIAS_PRESTAMO),
          id_usuario,
          id_libro,
          ejemplar.num_copia,
        ],
        conn,
      );
      await ModeloEjemplar.AsignarEstatus(id_libro, ejemplar.num_copia, 'En prestamo', conn);

      return ModeloPrestamo.BuscarPorId(result.insertId, conn);
    });
  },

  /**
   * Registra la devolución, genera multa si hay retraso y libera el
   * ejemplar o lo aparta para el siguiente en la lista de espera.
   */
  Devolver(id_prestamo, { fecha_devolucion: fecha_devolucion = Hoy() } = {}) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [prestamo] = await Consultar(
        'SELECT * FROM Prestamos WHERE id_prestamo = ? FOR UPDATE',
        [id_prestamo],
        conn,
      );
      if (!prestamo) 
      {
        throw ErrorHttp.NoEncontrado('Préstamo no encontrado');
      }
      if (prestamo.Estado === 'Devuelto') 
      {
        throw ErrorHttp.Conflicto('El préstamo ya fue devuelto');
      }

      await Consultar(
        'INSERT INTO Devoluciones (id_prestamo, Fecha_Devolucion) VALUES (?, ?)',
        [id_prestamo, fecha_devolucion],
        conn,
      );
      await Consultar(
        'UPDATE Prestamos SET Estado = \'Devuelto\' WHERE id_prestamo = ?',
        [id_prestamo],
        conn,
      );

      let multa = null;
      const dias_retraso = DiferenciaDias(prestamo.Fecha_Entrega_Programada, fecha_devolucion);
      if (dias_retraso > 0) 
      {
        const cantidad = Number((dias_retraso * MULTA_POR_DIA).toFixed(2));
        const resultado = await Consultar(
          `INSERT INTO Multas (Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion)
           VALUES (?, ?, ?, ?)`,
          [
            cantidad,
            prestamo.id_usuario,
            id_prestamo,
            `Devolución con ${dias_retraso} día(s) de retraso`,
          ],
          conn,
        );
        [multa] = await Consultar('SELECT * FROM Multas WHERE id_multa = ?', [resultado.insertId], conn);
      }

      const [siguiente] = await Consultar(
        `SELECT * FROM ListaEspera
          WHERE id_libro = ? AND Estatus = 'En espera'
          ORDER BY Fecha_Peticion, id_lista_espera LIMIT 1 FOR UPDATE`,
        [prestamo.id_libro],
        conn,
      );
      if (siguiente) 
      {
        await Consultar(
          'UPDATE ListaEspera SET Estatus = \'Notificado\' WHERE id_lista_espera = ?',
          [siguiente.id_lista_espera],
          conn,
        );
      }
      // Solo las copias de "Consulta externa" se prestan, así que vuelve a ese estado.
      await ModeloEjemplar.AsignarEstatus(
        prestamo.id_libro,
        prestamo.num_copia,
        siguiente ? 'Apartado' : 'Consulta externa',
        conn,
      );

      return {
        prestamo: await ModeloPrestamo.BuscarPorId(id_prestamo, conn),
        multa,
        apartado_para: siguiente ? siguiente.id_usuario : null,
      };
    });
  },

  /** Extiende la fecha de entrega si cumple las políticas de renovación. */
  Renovar(id_prestamo) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      await ModeloPrestamo.MarcarVencidos(conn);
      const [prestamo] = await Consultar(
        'SELECT * FROM Prestamos WHERE id_prestamo = ? FOR UPDATE',
        [id_prestamo],
        conn,
      );
      if (!prestamo) 
      {
        throw ErrorHttp.NoEncontrado('Préstamo no encontrado');
      }
      if (prestamo.Estado === 'Vencido')
      {
        throw ErrorHttp.Conflicto('Un préstamo vencido no puede renovarse');
      }
      if (prestamo.Estado !== 'Activo') 
      {
        throw ErrorHttp.Conflicto('El préstamo no está activo');
      }

      const [{ n: total }] = await Consultar(
        'SELECT COUNT(*) AS n FROM Renovaciones WHERE id_prestamo = ?',
        [id_prestamo],
        conn,
      );
      if (total >= MAX_RENOVACIONES) 
      {
        throw ErrorHttp.Conflicto(`Se alcanzó el máximo de ${MAX_RENOVACIONES} renovaciones`);
      }

      const [{ en_espera }] = await Consultar(
        `SELECT COUNT(*) AS en_espera FROM ListaEspera
          WHERE id_libro = ? AND Estatus = 'En espera'`,
        [prestamo.id_libro],
        conn,
      );
      if (en_espera > 0) 
      {
        throw ErrorHttp.Conflicto('Hay usuarios en lista de espera para este libro');
      }

      const anterior = prestamo.Fecha_Entrega_Programada;
      await Consultar(
        `INSERT INTO Renovaciones (id_prestamo, num_prestamo, Fecha_Renovacion, Fecha_Previamente_Programada)
         VALUES (?, ?, ?, ?)`,
        [id_prestamo, total + 1, Hoy(), anterior],
        conn,
      );
      await Consultar(
        'UPDATE Prestamos SET Fecha_Entrega_Programada = ? WHERE id_prestamo = ?',
        [SumarDias(anterior, DIAS_PRESTAMO), id_prestamo],
        conn,
      );
      return ModeloPrestamo.BuscarPorId(id_prestamo, conn);
    });
  },
};

/**
 * Selecciona el ejemplar a prestar:
 *  1. el apartado para el usuario (lista de espera notificada),
 *  2. la copia solicitada si es de Consulta externa,
 *  3. la primera copia de Consulta externa.
 */
async function ElegirEjemplar(conn, id_usuario, id_libro, num_copia) 
{
  const [apartado] = await Consultar(
    `SELECT id_lista_espera FROM ListaEspera
      WHERE id_usuario = ? AND id_libro = ? AND Estatus = 'Notificado'
      LIMIT 1 FOR UPDATE`,
    [id_usuario, id_libro],
    conn,
  );
  if (apartado) 
  {
    const [copia] = await Consultar(
      `SELECT * FROM Ejemplares WHERE id_libro = ? AND Estatus = 'Apartado'
        ORDER BY num_copia LIMIT 1 FOR UPDATE`,
      [id_libro],
      conn,
    );
    if (copia) 
    {
      await Consultar(
        'UPDATE ListaEspera SET Estatus = \'Atendido\' WHERE id_lista_espera = ?',
        [apartado.id_lista_espera],
        conn,
      );
      return copia;
    }
  }

  if (num_copia) 
  {
    const copia = await ModeloEjemplar.BuscarUno(id_libro, num_copia, conn);
    if (!copia) 
    {
      throw ErrorHttp.NoEncontrado('Ejemplar no encontrado');
    }
    if (copia.Estatus !== 'Consulta externa') 
    {
      throw ErrorHttp.Conflicto(
        'Solo se prestan copias de «Consulta externa» que no estén prestadas',
      );
    }
    return copia;
  }

  const copia = await ModeloEjemplar.BuscarPrestable(id_libro, conn);
  if (!copia) 
  {
    throw ErrorHttp.Conflicto(
      'No hay copias para llevar a casa; puedes unirte a la lista de espera',
      {
        codigo: 'SIN_EJEMPLARES',
      },
    );
  }
  return copia;
}

export { ModeloPrestamo };
