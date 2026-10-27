/*
 * ******************************************************************
 * Nombre del programa: API-PRESTAMOS · ModeloPrestamo.js
 * Función: Préstamos, renovaciones y devoluciones con sus reglas de negocio.
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
 *     Módulo            Objetivo
 *     SELECT_PRESTAMO   Consulta base de los préstamos con usuario, libro y copia
 *     ModeloPrestamo    Acceso a los préstamos y sus reglas
 *     ElegirEjemplar    Selecciona el ejemplar a prestar: 1. el apartado para el…
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
import { ENTORNO } from '../configuracion/entorno.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy, SumarDias, DiferenciaDias } from '../utilidades/fechas.js';
import { ModeloEjemplar } from './ModeloEjemplar.js';

const { DIAS_PRESTAMO, MAX_RENOVACIONES, MAX_PRESTAMOS_ACTIVOS, MULTA_POR_DIA } = ENTORNO.REGLAS;

/*
 * Constante: SELECT_PRESTAMO
 * Objetivo: Consulta base de los préstamos con usuario, libro y copia.
 */
const SELECT_PRESTAMO = `
  SELECT p.*, l.Titulo, l.ISBN, u.Nombre_Usuario, u.Matricula_Nomina,
         d.id_devolucion, d.Fecha_Devolucion,
         (SELECT COUNT(*) FROM Renovaciones r WHERE r.id_prestamo = p.id_prestamo) AS Num_Renovaciones
    FROM Prestamos p
    JOIN Libros l   ON l.id_libro = p.id_libro
    JOIN Usuarios u ON u.id_usuario = p.id_usuario
    LEFT JOIN Devoluciones d ON d.id_prestamo = p.id_prestamo`;

/*
 * Módulo: ModeloPrestamo
 * Objetivo: Acceso a los préstamos y sus reglas.
 */
const ModeloPrestamo = {
  /*
   * Función: MarcarVencidos
   * Objetivo: Marca como vencidos los préstamos activos cuya fecha ya pasó.
   * Entrada: conexion
   * Salida: Promesa con el resultado de la actualización
   */
  MarcarVencidos(conexion)
  {
    return Consultar(
      `UPDATE Prestamos SET Estado = 'Vencido'
        WHERE Estado = 'Activo' AND Fecha_Entrega_Programada < CURDATE()`,
      [],
      conexion,
    );
  },

  /*
   * Función: Listar
   * Objetivo: Listar los registros de préstamo con filtros y paginación.
   * Entrada: { id_usuario, estado, limit?, offset? } (opcional)
   * Salida: Promesa con las filas encontradas
   */
  async Listar({ id_usuario, estado, limit = 100, offset = 0 } = {})
  {
    await ModeloPrestamo.MarcarVencidos();
    const condicion = [];
    const parametros = [];
    if (id_usuario)
    {
      condicion.push('p.id_usuario = ?');
      parametros.push(id_usuario);
    }
    if (estado)
    {
      condicion.push('p.Estado = ?');
      parametros.push(estado);
    }
    parametros.push(Number(limit), Number(offset));
    return Consultar(
      `${SELECT_PRESTAMO}
       ${condicion.length ? `WHERE ${condicion.join(' AND ')}` : ''}
       ORDER BY p.Fecha_Prestamo DESC, p.id_prestamo DESC
       LIMIT ? OFFSET ?`,
      parametros,
    );
  },

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener un préstamo por su id.
   * Entrada: id, conexion
   * Salida: Promesa con el registro encontrado o null si no existe
   */
  async BuscarPorId(id, conexion)
  {
    const filas = await Consultar(`${SELECT_PRESTAMO} WHERE p.id_prestamo = ?`, [id], conexion);
    const prestamo = filas[0];
    if (!prestamo)
    {
      return null;
    }
    prestamo.renovaciones = await Consultar(
      'SELECT * FROM Renovaciones WHERE id_prestamo = ? ORDER BY num_prestamo',
      [id],
      conexion,
    );
    return prestamo;
  },

  /*
   * Función: Prestar
   * Objetivo: Registra un préstamo. Si el usuario tenía un apartado notificado para el libro,
   *           se le entrega el ejemplar apartado.
   * Entrada: { id_usuario, id_libro, num_copia }
   * Salida: Promesa con el préstamo creado
   */
  Prestar({ id_usuario, id_libro, num_copia })
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      await ModeloPrestamo.MarcarVencidos(conexion);

      const [usuario] = await Consultar(
        'SELECT id_usuario, Estatus FROM Usuarios WHERE id_usuario = ? FOR UPDATE',
        [id_usuario],
        conexion,
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
        conexion,
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
        conexion,
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
        conexion,
      );
      if (!libro || libro.Estatus !== 'Activo')
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }

      const ejemplar = await ElegirEjemplar(conexion, id_usuario, id_libro, num_copia);

      const fecha_prestamo = Hoy();
      const resultado = await Consultar(
        `INSERT INTO Prestamos (Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro, num_copia)
         VALUES (?, ?, 'Activo', ?, ?, ?)`,
        [
          fecha_prestamo,
          SumarDias(fecha_prestamo, DIAS_PRESTAMO),
          id_usuario,
          id_libro,
          ejemplar.num_copia,
        ],
        conexion,
      );
      await ModeloEjemplar.AsignarEstatus(id_libro, ejemplar.num_copia, 'En prestamo', conexion);

      return ModeloPrestamo.BuscarPorId(resultado.insertId, conexion);
    });
  },

  /*
   * Función: Devolver
   * Objetivo: Registra la devolución, genera multa si hay retraso y libera el ejemplar o lo
   *           aparta para el siguiente en la lista de espera.
   * Entrada: id_prestamo, { fecha_devolucion? } (opcional)
   * Salida: Promesa con { prestamo, multa }
   */
  Devolver(id_prestamo, { fecha_devolucion: fecha_devolucion = Hoy() } = {})
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [prestamo] = await Consultar(
        'SELECT * FROM Prestamos WHERE id_prestamo = ? FOR UPDATE',
        [id_prestamo],
        conexion,
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
        conexion,
      );
      await Consultar(
        'UPDATE Prestamos SET Estado = \'Devuelto\' WHERE id_prestamo = ?',
        [id_prestamo],
        conexion,
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
          conexion,
        );
        [multa] = await Consultar('SELECT * FROM Multas WHERE id_multa = ?', [resultado.insertId], conexion);
      }

      const [siguiente] = await Consultar(
        `SELECT * FROM ListaEspera
          WHERE id_libro = ? AND Estatus = 'En espera'
          ORDER BY Fecha_Peticion, id_lista_espera LIMIT 1 FOR UPDATE`,
        [prestamo.id_libro],
        conexion,
      );
      if (siguiente)
      {
        await Consultar(
          'UPDATE ListaEspera SET Estatus = \'Notificado\' WHERE id_lista_espera = ?',
          [siguiente.id_lista_espera],
          conexion,
        );
      }
      // Solo las copias de "Consulta externa" se prestan, así que vuelve a ese estado.
      await ModeloEjemplar.AsignarEstatus(
        prestamo.id_libro,
        prestamo.num_copia,
        siguiente ? 'Apartado' : 'Consulta externa',
        conexion,
      );

      return {
        prestamo: await ModeloPrestamo.BuscarPorId(id_prestamo, conexion),
        multa,
        apartado_para: siguiente ? siguiente.id_usuario : null,
      };
    });
  },

  /*
   * Función: Renovar
   * Objetivo: Extiende la fecha de entrega si cumple las políticas de renovación.
   * Entrada: id_prestamo
   * Salida: Promesa con el préstamo renovado
   */
  Renovar(id_prestamo)
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      await ModeloPrestamo.MarcarVencidos(conexion);
      const [prestamo] = await Consultar(
        'SELECT * FROM Prestamos WHERE id_prestamo = ? FOR UPDATE',
        [id_prestamo],
        conexion,
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
        conexion,
      );
      if (total >= MAX_RENOVACIONES)
      {
        throw ErrorHttp.Conflicto(`Se alcanzó el máximo de ${MAX_RENOVACIONES} renovaciones`);
      }

      const [{ en_espera }] = await Consultar(
        `SELECT COUNT(*) AS en_espera FROM ListaEspera
          WHERE id_libro = ? AND Estatus = 'En espera'`,
        [prestamo.id_libro],
        conexion,
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
        conexion,
      );
      await Consultar(
        'UPDATE Prestamos SET Fecha_Entrega_Programada = ? WHERE id_prestamo = ?',
        [SumarDias(anterior, DIAS_PRESTAMO), id_prestamo],
        conexion,
      );
      return ModeloPrestamo.BuscarPorId(id_prestamo, conexion);
    });
  },
};

/*
 * Función: ElegirEjemplar
 * Objetivo: Selecciona el ejemplar a prestar: 1. el apartado para el usuario (lista de espera
 *           notificada), 2. la copia solicitada si es de Consulta externa, 3. la primera copia
 *           de Consulta externa.
 * Entrada: conexion, id_usuario, id_libro, num_copia
 * Salida: Promesa con la copia elegida o null
 */
async function ElegirEjemplar(conexion, id_usuario, id_libro, num_copia)
{
  const [apartado] = await Consultar(
    `SELECT id_lista_espera FROM ListaEspera
      WHERE id_usuario = ? AND id_libro = ? AND Estatus = 'Notificado'
      LIMIT 1 FOR UPDATE`,
    [id_usuario, id_libro],
    conexion,
  );
  if (apartado)
  {
    const [copia] = await Consultar(
      `SELECT * FROM Ejemplares WHERE id_libro = ? AND Estatus = 'Apartado'
        ORDER BY num_copia LIMIT 1 FOR UPDATE`,
      [id_libro],
      conexion,
    );
    if (copia)
    {
      await Consultar(
        'UPDATE ListaEspera SET Estatus = \'Atendido\' WHERE id_lista_espera = ?',
        [apartado.id_lista_espera],
        conexion,
      );
      return copia;
    }
  }

  if (num_copia)
  {
    const copia = await ModeloEjemplar.BuscarUno(id_libro, num_copia, conexion);
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

  const copia = await ModeloEjemplar.BuscarPrestable(id_libro, conexion);
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
