/*
 * ******************************************************************
 * Nombre del programa: TESORERIA · ModeloMulta.js
 * Función: Multas que la biblioteca envía a Tesorería y pagos que Tesorería registra en caja.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Multas enviadas por Biblio y pagos capturados en Tesorería
 * Salida: Multas y pagos guardados en tesoreria_ducky
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo           Objetivo
 *     CONSULTA_PAGOS   SELECT de los pagos con los datos de su multa
 *     ModeloMulta      Acceso a las multas y pagos de Tesorería
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Biblio identifica cada multa por su referencia (el id de la multa en Biblio); Tesorería
 *     no usa los ids de Biblio para nada más.
 * (2) Un pago liquida una multa completa; el folio del pago es TES-AAAA-MM-NNNN.
 * ******************************************************************
 */

import { bd_tesoreria } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Constante: CONSULTA_PAGOS
 * Objetivo: SELECT de los pagos con los datos de su multa.
 */
const CONSULTA_PAGOS = `
  SELECT p.Folio, p.Monto, p.Fecha_Pago, p.Notificado, m.Sistema_Origen, m.Referencia,
         m.Matricula, m.Lector, m.Motivo
    FROM Pagos p
    JOIN Multas m ON m.id_multa = p.id_multa`;

/*
 * Módulo: ModeloMulta
 * Objetivo: Acceso a las multas y pagos de Tesorería.
 */
const ModeloMulta = {
  /*
   * Función: BuscarPorReferencia
   * Objetivo: Obtener una multa por su referencia en el sistema de origen.
   * Entrada: referencia, sistema (opcional, Biblio)
   * Salida: Promesa con la multa o null
   */
  async BuscarPorReferencia(referencia, sistema = 'Biblio')
  {
    const [multa] = await bd_tesoreria.Consultar(
      'SELECT * FROM Multas WHERE Sistema_Origen = ? AND Referencia = ?',
      [sistema, String(referencia)],
    );
    return multa ?? null;
  },

  /*
   * Función: Recibir
   * Objetivo: Registrar una multa enviada por un sistema. Si ya se había recibido la misma
   *           referencia, devuelve la existente (reenvío).
   * Entrada: { sistema_origen, referencia, matricula, lector, motivo, monto, fecha }
   * Salida: Promesa con { multa, nueva }
   */
  async Recibir({ sistema_origen, referencia, matricula, lector, motivo, monto, fecha })
  {
    const existente = await ModeloMulta.BuscarPorReferencia(referencia, sistema_origen);
    if (existente)
    {
      return { multa: existente, nueva: false };
    }
    await bd_tesoreria.Consultar(
      `INSERT INTO Multas
         (Sistema_Origen, Referencia, Matricula, Lector, Motivo, Monto, Fecha_Multa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sistema_origen, String(referencia), matricula, lector, motivo, monto, fecha],
    );
    const multa = await ModeloMulta.BuscarPorReferencia(referencia, sistema_origen);
    return { multa, nueva: true };
  },

  /*
   * Función: Listar
   * Objetivo: Listar las multas, opcionalmente por estatus y sistema de origen.
   * Entrada: { estatus, sistema } (opcional)
   * Salida: Promesa con las multas
   */
  Listar({ estatus, sistema } = {})
  {
    const condicion = [];
    const parametros = [];
    if (estatus)
    {
      condicion.push('Estatus = ?');
      parametros.push(estatus);
    }
    if (sistema)
    {
      condicion.push('Sistema_Origen = ?');
      parametros.push(sistema);
    }
    return bd_tesoreria.Consultar(
      `SELECT * FROM Multas ${condicion.length ? `WHERE ${condicion.join(' AND ')}` : ''}
        ORDER BY Fecha_Recepcion DESC, id_multa DESC`,
      parametros,
    );
  },

  /*
   * Función: ListarPagos
   * Objetivo: Listar los pagos registrados, del más reciente al más antiguo.
   * Entrada: { sistema } (opcional)
   * Salida: Promesa con los pagos
   */
  ListarPagos({ sistema } = {})
  {
    return bd_tesoreria.Consultar(
      `${CONSULTA_PAGOS} ${sistema ? 'WHERE m.Sistema_Origen = ?' : ''}
        ORDER BY p.Fecha_Pago DESC, p.id_pago DESC`,
      sistema ? [sistema] : [],
    );
  },

  /*
   * Función: Pagar
   * Objetivo: Registrar el pago completo de una multa pendiente.
   * Entrada: referencia, sistema (opcional, Biblio)
   * Salida: Promesa con el pago (folio, monto, fecha y datos de la multa)
   */
  async Pagar(referencia, sistema = 'Biblio')
  {
    const multa = await ModeloMulta.BuscarPorReferencia(referencia, sistema);
    if (!multa)
    {
      throw new ErrorHttp(404, `No existe la multa ${referencia} de ${sistema}`);
    }
    if (multa.Estatus === 'Pagada')
    {
      throw new ErrorHttp(409, `La multa ${referencia} ya está pagada`);
    }
    const folio = await bd_tesoreria.Transaccion(async (conexion) =>
    {
      const alta = await bd_tesoreria.Consultar(
        'INSERT INTO Pagos (Folio, id_multa, Monto) VALUES (UUID(), ?, ?)',
        [multa.id_multa, multa.Monto],
        conexion,
      );
      const [{ periodo }] = await bd_tesoreria.Consultar(
        'SELECT DATE_FORMAT(Fecha_Pago, \'%Y-%m\') AS periodo FROM Pagos WHERE id_pago = ?',
        [alta.insertId],
        conexion,
      );
      const folio_nuevo = `TES-${periodo}-${String(alta.insertId).padStart(4, '0')}`;
      await bd_tesoreria.Consultar(
        'UPDATE Pagos SET Folio = ? WHERE id_pago = ?',
        [folio_nuevo, alta.insertId],
        conexion,
      );
      await bd_tesoreria.Consultar(
        'UPDATE Multas SET Estatus = \'Pagada\' WHERE id_multa = ?',
        [multa.id_multa],
        conexion,
      );
      return folio_nuevo;
    });
    const [pago] = await bd_tesoreria.Consultar(`${CONSULTA_PAGOS} WHERE p.Folio = ?`, [folio]);
    return pago;
  },

  /*
   * Función: MarcarNotificado
   * Objetivo: Registrar que el sistema de origen ya recibió el aviso del pago.
   * Entrada: folio
   * Salida: Promesa con el resultado de la actualización
   */
  MarcarNotificado(folio)
  {
    return bd_tesoreria.Consultar('UPDATE Pagos SET Notificado = TRUE WHERE Folio = ?', [folio]);
  },
};

export { ModeloMulta };
