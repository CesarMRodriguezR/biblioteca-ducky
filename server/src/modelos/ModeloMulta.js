/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL02 · ModeloMulta.js
 * Función: Multas por entrega extemporánea, daño o pérdida: alta, consulta, resumen del menú,
 *          lista de alumnos deudores y registro de pagos.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Préstamos, motivos y pagos de Tesorería
 * Salida: Multas con sus datos para mostrar
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo         Objetivo
 *     MOTIVOS        Motivos de multa del prototipo
 *     CONSULTA_BASE  SELECT de una multa con su lector y su libro
 *     ConFolio       Agregar el folio visible (M-0058) a una multa
 *     ModeloMulta    Acceso a las multas
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Toda consulta es parametrizada (?); las operaciones que se hacen junto con otras (una
 *     devolución, una renovación) reciben la conexión de la transacción.
 * (2) Un préstamo puede tener varias multas (cardinalidad 0..N): por ejemplo, una por retraso
 *     y otra por daño del mismo préstamo.
 * (3) Una multa se paga completa en Tesorería; Biblio solo registra la fecha de pago.
 * ******************************************************************
 */

import { Consultar, SiguienteId } from '../configuracion/conexion.js';
import { DiasRetraso, FolioMulta, FolioPrestamo, REGLAS } from '../utilidades/ReglasCirculacion.js';

/*
 * Constante: MOTIVOS
 * Objetivo: Motivos de multa del prototipo.
 */
const MOTIVOS = ['Entrega extemporánea', 'Daño del libro', 'Pérdida del libro'];

/*
 * Constante: CONSULTA_BASE
 * Objetivo: SELECT de una multa con su lector y, si tiene, su préstamo y libro.
 */
const CONSULTA_BASE = `
  SELECT m.id_multa, m.Cantidad_a_Pagar, m.Fecha_Pagado, m.id_usuario, m.id_prestamo,
         m.Justificacion, m.Motivo, m.Fecha_Multa, m.Enviada_Tesoreria,
         u.Nombre_Completo, u.Matricula_Nomina, u.Estatus AS Estatus_Usuario, p.Nombre_Rol,
         l.Titulo, l.ISBN, l.Precio, pr.num_copia
    FROM Multas m
    JOIN Usuarios u ON u.id_usuario = m.id_usuario
    JOIN Perfiles p ON p.id_perfil = u.id_perfil
    LEFT JOIN Prestamos pr ON pr.id_prestamo = m.id_prestamo
    LEFT JOIN Libros l ON l.id_libro = pr.id_libro`;

/*
 * Función: ConFolio
 * Objetivo: Agregar el folio visible de la multa y de su préstamo, y el estado de pago.
 * Entrada: multa
 * Salida: Multa con Folio, Folio_Prestamo y Estado
 */
function ConFolio(multa)
{
  return {
    ...multa,
    Enviada_Tesoreria: Boolean(multa.Enviada_Tesoreria),
    Folio: FolioMulta(multa.id_multa),
    Folio_Prestamo: multa.id_prestamo ? FolioPrestamo(multa.id_prestamo) : null,
    Estado: multa.Fecha_Pagado ? 'Pagada' : 'Pendiente',
  };
}

/*
 * Módulo: ModeloMulta
 * Objetivo: Acceso a las multas.
 */
const ModeloMulta = {
  MOTIVOS,

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener una multa con su lector y su libro.
   * Entrada: id_multa, conexion (opcional)
   * Salida: Promesa con la multa o null
   */
  async BuscarPorId(id_multa, conexion)
  {
    const [multa] = await Consultar(`${CONSULTA_BASE} WHERE m.id_multa = ?`, [id_multa], conexion);
    return multa ? ConFolio(multa) : null;
  },

  /*
   * Función: DelUsuario
   * Objetivo: Multas de un usuario, primero las pendientes y luego las más recientes.
   * Entrada: id_usuario
   * Salida: Promesa con las multas
   */
  async DelUsuario(id_usuario)
  {
    const filas = await Consultar(
      `${CONSULTA_BASE} WHERE m.id_usuario = ?
        ORDER BY m.Fecha_Pagado IS NULL DESC, m.Fecha_Multa DESC, CAST(m.id_multa AS UNSIGNED) DESC`,
      [id_usuario],
    );
    return filas.map(ConFolio);
  },

  /*
   * Función: CalcularMonto
   * Objetivo: Monto de una multa según su motivo: $10.00 por día de retraso, $250.00 por daño o
   *           el precio de la última compra del libro si se perdió.
   * Entrada: prestamo ({ Fecha_Entrega_Programada, Precio }), motivo, hoy
   * Salida: { monto, dias_retraso }
   */
  CalcularMonto(prestamo, motivo, hoy)
  {
    const dias_retraso = DiasRetraso(prestamo.Fecha_Entrega_Programada, hoy);
    if (motivo === 'Entrega extemporánea')
    {
      return { monto: dias_retraso * REGLAS.MULTA_POR_DIA, dias_retraso };
    }
    if (motivo === 'Daño del libro')
    {
      return { monto: REGLAS.MULTA_POR_DANO, dias_retraso };
    }
    return { monto: Number(prestamo.Precio), dias_retraso };
  },

  /*
   * Función: Crear
   * Objetivo: Registrar una multa pendiente de pago, ligada a su préstamo si lo tiene.
   * Entrada: { id_usuario, id_prestamo, monto, motivo, justificacion, fecha }, conexion
   * Salida: Promesa con la multa creada
   */
  async Crear({ id_usuario, id_prestamo, monto, motivo, justificacion, fecha }, conexion)
  {
    const id_multa = await SiguienteId('Multas', 'id_multa', conexion);
    await Consultar(
      `INSERT INTO Multas
         (id_multa, Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion, Motivo, Fecha_Multa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_multa, monto, id_usuario, id_prestamo ?? null, justificacion, motivo, fecha],
      conexion,
    );
    return ModeloMulta.BuscarPorId(id_multa, conexion);
  },

  /*
   * Función: Pendientes
   * Objetivo: Multas sin pagar, opcionalmente solo las que aún no se envían a Tesorería.
   * Entrada: { sin_enviar } (opcional)
   * Salida: Promesa con las multas
   */
  async Pendientes({ sin_enviar } = {})
  {
    const filas = await Consultar(
      `${CONSULTA_BASE} WHERE m.Fecha_Pagado IS NULL ${sin_enviar ? 'AND NOT m.Enviada_Tesoreria' : ''}
        ORDER BY CAST(m.id_multa AS UNSIGNED) DESC`,
    );
    return filas.map(ConFolio);
  },

  /*
   * Función: MarcarEnviada
   * Objetivo: Registrar que Tesorería ya tiene la multa.
   * Entrada: id_multa
   * Salida: Promesa con el resultado de la actualización
   */
  MarcarEnviada(id_multa)
  {
    return Consultar('UPDATE Multas SET Enviada_Tesoreria = TRUE WHERE id_multa = ?', [id_multa]);
  },

  /*
   * Función: MarcarPagada
   * Objetivo: Registrar el pago de una multa que avisó Tesorería (si no estaba pagada).
   * Entrada: id_multa, fecha
   * Salida: Promesa con { multa, cambio }; multa es null si no existe
   */
  async MarcarPagada(id_multa, fecha)
  {
    const resultado = await Consultar(
      `UPDATE Multas SET Fecha_Pagado = ?, Enviada_Tesoreria = TRUE
        WHERE id_multa = ? AND Fecha_Pagado IS NULL`,
      [fecha, id_multa],
    );
    return {
      multa: await ModeloMulta.BuscarPorId(id_multa),
      cambio: resultado.affectedRows > 0,
    };
  },

  /*
   * Función: PendientePorMatricula
   * Objetivo: Total pendiente de pago de cada lector (para el estado de los pagos).
   * Entrada: matriculas
   * Salida: Promesa con un Map matrícula → { total, Nombre_Rol }
   */
  async PendientePorMatricula(matriculas)
  {
    const mapa = new Map();
    if (!matriculas.length)
    {
      return mapa;
    }
    const filas = await Consultar(
      `SELECT u.Matricula_Nomina, p.Nombre_Rol,
              COALESCE(SUM(CASE WHEN m.Fecha_Pagado IS NULL THEN m.Cantidad_a_Pagar END), 0) AS total
         FROM Usuarios u
         JOIN Perfiles p ON p.id_perfil = u.id_perfil
         LEFT JOIN Multas m ON m.id_usuario = u.id_usuario
        WHERE u.Matricula_Nomina IN (?)
        GROUP BY u.id_usuario`,
      [matriculas],
    );
    filas.forEach((fila) => mapa.set(fila.Matricula_Nomina, fila));
    return mapa;
  },

  /*
   * Función: Resumen
   * Objetivo: Indicadores y multas recientes del menú Multas y adeudos.
   * Entrada: hoy
   * Salida: Promesa con { pendientes, monto_pendiente, este_mes, pagos_mes, deudores,
   *         recientes }
   */
  async Resumen(hoy)
  {
    const mes = hoy.slice(0, 7);
    const [[totales], recientes, deudores] = await Promise.all([
      Consultar(
        `SELECT SUM(Fecha_Pagado IS NULL) AS pendientes,
                COALESCE(SUM(CASE WHEN Fecha_Pagado IS NULL THEN Cantidad_a_Pagar END), 0)
                  AS monto_pendiente,
                SUM(DATE_FORMAT(Fecha_Multa, '%Y-%m') = ?) AS este_mes,
                SUM(DATE_FORMAT(Fecha_Pagado, '%Y-%m') = ?) AS pagos_mes
           FROM Multas`,
        [mes, mes],
      ),
      Consultar(
        `${CONSULTA_BASE} ORDER BY m.Fecha_Multa DESC, CAST(m.id_multa AS UNSIGNED) DESC LIMIT 5`,
      ),
      ModeloMulta.Deudores(hoy),
    ]);
    return {
      pendientes: Number(totales.pendientes ?? 0),
      monto_pendiente: totales.monto_pendiente,
      este_mes: Number(totales.este_mes ?? 0),
      pagos_mes: Number(totales.pagos_mes ?? 0),
      deudores: deudores.length,
      recientes: recientes.map(ConFolio),
    };
  },

  /*
   * Función: Deudores
   * Objetivo: Alumnos activos con libros vencidos sin devolver o multas pendientes. El total
   *           suma las multas pendientes y la multa que llevan acumulada los libros vencidos.
   * Entrada: hoy
   * Salida: Promesa con [{ Matricula_Nomina, Nombre_Completo, Libros_Sin_Devolver,
   *         Multas_Pendientes, Total_Adeudo }]
   */
  async Deudores(hoy)
  {
    const filas = await Consultar(
      `SELECT u.id_usuario, u.Matricula_Nomina, u.Nombre_Completo,
              (SELECT COUNT(*) FROM Prestamos pr
                WHERE pr.id_usuario = u.id_usuario AND pr.Estado = 'Activo'
                  AND pr.Fecha_Entrega_Programada < ?) AS Libros_Sin_Devolver,
              (SELECT COALESCE(SUM(DATEDIFF(?, pr.Fecha_Entrega_Programada)), 0) FROM Prestamos pr
                WHERE pr.id_usuario = u.id_usuario AND pr.Estado = 'Activo'
                  AND pr.Fecha_Entrega_Programada < ?) AS Dias_Retraso,
              (SELECT COUNT(*) FROM Multas m
                WHERE m.id_usuario = u.id_usuario AND m.Fecha_Pagado IS NULL) AS Multas_Pendientes,
              (SELECT COALESCE(SUM(m.Cantidad_a_Pagar), 0) FROM Multas m
                WHERE m.id_usuario = u.id_usuario AND m.Fecha_Pagado IS NULL) AS Monto_Multas
         FROM Usuarios u
         JOIN Perfiles p ON p.id_perfil = u.id_perfil
        WHERE p.Nombre_Rol = 'Alumno' AND u.Estatus = 'Activo'
       HAVING Libros_Sin_Devolver > 0 OR Multas_Pendientes > 0
        ORDER BY u.Nombre_Completo`,
      [hoy, hoy, hoy],
    );
    return filas.map((fila) => ({
      Matricula_Nomina: fila.Matricula_Nomina,
      Nombre_Completo: fila.Nombre_Completo,
      Libros_Sin_Devolver: fila.Libros_Sin_Devolver,
      Multas_Pendientes: fila.Multas_Pendientes,
      Total_Adeudo: fila.Monto_Multas + Number(fila.Dias_Retraso) * REGLAS.MULTA_POR_DIA,
    }));
  },
};

export { ModeloMulta };
