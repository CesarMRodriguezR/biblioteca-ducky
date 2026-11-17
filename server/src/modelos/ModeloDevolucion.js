/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL · ModeloDevolucion.js
 * Función: Devoluciones: registro de la devolución (con multa si hay retraso), reporte de
 *          libro perdido, multa generada a mano y resumen del menú Devoluciones.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Préstamo activo y condición del libro al recibirlo
 * Salida: Devolución registrada, multa generada y lista de espera del libro
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo             Objetivo
 *     CONDICIONES        Condición del libro al recibirlo
 *     PrestamoActivo     Obtener un préstamo y exigir que siga activo
 *     ModeloDevolucion   Acceso a las devoluciones
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Al devolverse, la copia regresa a «Consulta Externa» (solo esas se prestan). Si se
 *     pierde, queda «Inactivo» con Motivo_Baja «Perdido» y el préstamo queda «Perdido».
 * (2) La multa por daño no se genera aquí: si el libro llega dañado o incompleto, el
 *     bibliotecario la genera en Multas y adeudos con su justificación.
 * ******************************************************************
 */

import { Consultar, EjecutarEnTransaccion, SiguienteId } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy } from '../utilidades/fechas.js';
import { FolioPrestamo, REGLAS } from '../utilidades/ReglasCirculacion.js';
import { ModeloPrestamo } from './ModeloPrestamo.js';
import { ModeloMulta } from './ModeloMulta.js';

/*
 * Constante: CONDICIONES
 * Objetivo: Condición del libro al recibirlo.
 */
const CONDICIONES = ['Buen estado', 'Dañado', 'Incompleto'];

/*
 * Función: PrestamoActivo
 * Objetivo: Obtener un préstamo y exigir que siga activo.
 * Entrada: id_prestamo
 * Salida: Promesa con el préstamo; 404 si no existe o ya se cerró
 */
async function PrestamoActivo(id_prestamo)
{
  const prestamo = await ModeloPrestamo.BuscarPorId(id_prestamo);
  if (!prestamo || prestamo.Estado !== 'Activo')
  {
    throw ErrorHttp.NoEncontrado('Ese préstamo ya no está pendiente de devolución.');
  }
  return prestamo;
}

/*
 * Módulo: ModeloDevolucion
 * Objetivo: Acceso a las devoluciones.
 */
const ModeloDevolucion = {
  CONDICIONES,

  /*
   * Función: Registrar
   * Objetivo: Registrar la devolución de un préstamo activo. Si se entrega tarde, genera la
   *           multa por los días de retraso. Avisa cuántos lectores esperan el libro.
   * Entrada: { id_prestamo, condicion }
   * Salida: Promesa con { prestamo, dias_retraso, multa, condicion, lista_espera }
   */
  async Registrar({ id_prestamo, condicion })
  {
    const prestamo = await PrestamoActivo(id_prestamo);
    const hoy = Hoy();
    const dias_retraso = prestamo.Dias_Retraso;
    const multa = await EjecutarEnTransaccion(async (conexion) =>
    {
      const id_devolucion = await SiguienteId('Devoluciones', 'id_devolucion', conexion);
      await Consultar(
        'INSERT INTO Devoluciones (id_devolucion, id_prestamo, Fecha_Devolucion) VALUES (?, ?, ?)',
        [id_devolucion, id_prestamo, hoy],
        conexion,
      );
      await Consultar(
        'UPDATE Prestamos SET Estado = \'Devuelto\' WHERE id_prestamo = ?',
        [id_prestamo],
        conexion,
      );
      await Consultar(
        `UPDATE Ejemplares SET Estatus = 'Consulta Externa'
          WHERE id_libro = ? AND num_copia = ?`,
        [prestamo.id_libro, prestamo.num_copia],
        conexion,
      );
      if (dias_retraso === 0)
      {
        return null;
      }
      return ModeloMulta.Crear(
        {
          id_usuario: prestamo.id_usuario,
          id_prestamo,
          monto: dias_retraso * REGLAS.MULTA_POR_DIA,
          motivo: 'Entrega extemporánea',
          justificacion: `Devolución con ${dias_retraso} días de retraso.`,
          fecha: hoy,
        },
        conexion,
      );
    });
    const lista = await Consultar(
      `SELECT u.Nombre_Completo FROM ListaDeEspera le
         JOIN Usuarios u ON u.id_usuario = le.id_usuario
        WHERE le.id_libro = ? AND le.Estatus = 'Pendiente'
        ORDER BY le.Fecha_Peticion, CAST(le.id_lista_espera AS UNSIGNED)`,
      [prestamo.id_libro],
    );
    return {
      prestamo: await ModeloPrestamo.BuscarPorId(id_prestamo),
      dias_retraso,
      multa,
      condicion,
      lista_espera: { total: lista.length, primero: lista[0]?.Nombre_Completo ?? null },
    };
  },

  /*
   * Función: ReportarPerdido
   * Objetivo: Marcar un préstamo como perdido, retirar la copia y generar la multa por
   *           reposición (precio de la última compra del libro).
   * Entrada: id_prestamo, justificacion (opcional)
   * Salida: Promesa con { prestamo, multa }
   */
  async ReportarPerdido(id_prestamo, justificacion)
  {
    const prestamo = await PrestamoActivo(id_prestamo);
    const hoy = Hoy();
    const multa = await EjecutarEnTransaccion(async (conexion) =>
    {
      await Consultar(
        'UPDATE Prestamos SET Estado = \'Perdido\' WHERE id_prestamo = ?',
        [id_prestamo],
        conexion,
      );
      await Consultar(
        `UPDATE Ejemplares SET Estatus = 'Inactivo', Motivo_Baja = 'Perdido'
          WHERE id_libro = ? AND num_copia = ?`,
        [prestamo.id_libro, prestamo.num_copia],
        conexion,
      );
      return ModeloMulta.Crear(
        {
          id_usuario: prestamo.id_usuario,
          id_prestamo,
          monto: Number(prestamo.Precio),
          motivo: 'Pérdida del libro',
          justificacion: (
            justificacion || `Reposición de «${prestamo.Titulo}» (copia ${prestamo.num_copia}).`
          ).slice(0, 150),
          fecha: hoy,
        },
        conexion,
      );
    });
    return { prestamo: await ModeloPrestamo.BuscarPorId(id_prestamo), multa };
  },

  /*
   * Función: GenerarMulta
   * Objetivo: Generar a mano la multa de un préstamo: por entrega extemporánea (solo si tiene
   *           días de retraso), por daño o por pérdida (en ese caso también se reporta el libro
   *           como perdido si el préstamo sigue activo).
   * Entrada: { id_prestamo, motivo, justificacion }
   * Salida: Promesa con { prestamo, multa }
   */
  async GenerarMulta({ id_prestamo, motivo, justificacion })
  {
    const prestamo = await ModeloPrestamo.BuscarPorId(id_prestamo);
    if (!prestamo || prestamo.Estado === 'Perdido')
    {
      throw ErrorHttp.NoEncontrado('No hay un préstamo pendiente con ese folio.');
    }
    if (motivo === 'Pérdida del libro' && prestamo.Estado === 'Activo')
    {
      return ModeloDevolucion.ReportarPerdido(id_prestamo, justificacion);
    }
    if (motivo === 'Entrega extemporánea' && prestamo.Estado === 'Devuelto')
    {
      throw ErrorHttp.Conflicto('El préstamo ya se devolvió', {
        codigo: 'YA_DEVUELTO',
        mensaje: 'La multa por retraso se genera sola al registrar la devolución.',
      });
    }
    const hoy = Hoy();
    const { monto, dias_retraso } = ModeloMulta.CalcularMonto(prestamo, motivo, hoy);
    if (motivo === 'Entrega extemporánea' && dias_retraso === 0)
    {
      throw ErrorHttp.Conflicto('El préstamo no tiene días de retraso', {
        codigo: 'SIN_RETRASO',
        mensaje: 'Solo se cobra entrega extemporánea cuando ya pasó la fecha de devolución.',
      });
    }
    const multa = await ModeloMulta.Crear({
      id_usuario: prestamo.id_usuario,
      id_prestamo,
      monto,
      motivo,
      justificacion,
      fecha: hoy,
    });
    return { prestamo, multa };
  },

  /*
   * Función: Resumen
   * Objetivo: Indicadores y últimas devoluciones (incluidos los libros perdidos) del menú
   *           Devoluciones.
   * Entrada: Ninguna
   * Salida: Promesa con { hoy, a_tiempo, con_retraso, perdidos_mes, ultimas }
   */
  async Resumen()
  {
    const hoy = Hoy();
    const [[totales], [perdidos], ultimas] = await Promise.all([
      Consultar(
        `SELECT COUNT(*) AS hoy,
                SUM(d.Fecha_Devolucion <= pr.Fecha_Entrega_Programada) AS a_tiempo,
                SUM(d.Fecha_Devolucion > pr.Fecha_Entrega_Programada) AS con_retraso
           FROM Devoluciones d JOIN Prestamos pr ON pr.id_prestamo = d.id_prestamo
          WHERE d.Fecha_Devolucion = ?`,
        [hoy],
      ),
      Consultar(
        `SELECT COUNT(*) AS n FROM Multas
          WHERE Motivo = 'Pérdida del libro' AND DATE_FORMAT(Fecha_Multa, '%Y-%m') = ?`,
        [hoy.slice(0, 7)],
      ),
      Consultar(
        `SELECT * FROM (
           SELECT pr.id_prestamo, u.Nombre_Completo, l.Titulo, pr.num_copia,
                  d.Fecha_Devolucion AS Fecha,
                  IF(d.Fecha_Devolucion > pr.Fecha_Entrega_Programada, 'Con multa', 'A tiempo')
                    AS Resultado
             FROM Devoluciones d
             JOIN Prestamos pr ON pr.id_prestamo = d.id_prestamo
             JOIN Usuarios u ON u.id_usuario = pr.id_usuario
             JOIN Libros l ON l.id_libro = pr.id_libro
           UNION ALL
           SELECT pr.id_prestamo, u.Nombre_Completo, l.Titulo, pr.num_copia,
                  m.Fecha_Multa AS Fecha, 'Perdido' AS Resultado
             FROM Prestamos pr
             JOIN Multas m ON m.id_prestamo = pr.id_prestamo AND m.Motivo = 'Pérdida del libro'
             JOIN Usuarios u ON u.id_usuario = pr.id_usuario
             JOIN Libros l ON l.id_libro = pr.id_libro
            WHERE pr.Estado = 'Perdido'
         ) movimientos
         ORDER BY Fecha DESC, CAST(id_prestamo AS UNSIGNED) DESC
         LIMIT 5`,
      ),
    ]);
    return {
      hoy: totales.hoy,
      a_tiempo: Number(totales.a_tiempo ?? 0),
      con_retraso: Number(totales.con_retraso ?? 0),
      perdidos_mes: perdidos.n,
      ultimas: ultimas.map((fila) => ({ ...fila, Folio: FolioPrestamo(fila.id_prestamo) })),
    };
  },
};

export { ModeloDevolucion };
