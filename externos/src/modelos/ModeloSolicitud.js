/*
 * ******************************************************************
 * Nombre del programa: TESORERIA · ModeloSolicitud.js
 * Función: Recibir las solicitudes de compra de Biblio y registrar la respuesta de Tesorería
 *          (aceptada o rechazada).
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Datos validados por el controlador
 * Salida: Filas de la base de datos tesoreria_ducky
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     ModeloSolicitud   Acceso a las solicitudes de compra de Tesorería
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Solo usa la base de datos de Tesorería (bd_tesoreria).
 * (2) Una solicitud solo se responde una vez: de Recibida pasa a Aceptada o Rechazada.
 * ******************************************************************
 */

import { bd_tesoreria } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Módulo: ModeloSolicitud
 * Objetivo: Acceso a las solicitudes de compra de Tesorería.
 */
const ModeloSolicitud = {
  /*
   * Función: Listar
   * Objetivo: Listar las solicitudes, opcionalmente por estatus, por sistema de origen y por
   *           referencias (el número de orden en el sistema que la envió).
   * Entrada: { estatus, sistema, referencias } (opcional)
   * Salida: Promesa con las solicitudes
   */
  Listar({ estatus, sistema, referencias } = {})
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
    if (referencias?.length)
    {
      condicion.push(`Referencia IN (${referencias.map(() => '?').join(', ')})`);
      parametros.push(...referencias);
    }
    return bd_tesoreria.Consultar(
      `SELECT * FROM Solicitudes ${condicion.length ? `WHERE ${condicion.join(' AND ')}` : ''}
        ORDER BY Fecha_Recepcion DESC`,
      parametros,
    );
  },

  /*
   * Función: BuscarPorFolio
   * Objetivo: Obtener una solicitud con sus renglones y el presupuesto de su periodo.
   * Entrada: folio, conexion (opcional)
   * Salida: Promesa con la solicitud o null
   */
  async BuscarPorFolio(folio, conexion)
  {
    const [solicitud] = await bd_tesoreria.Consultar(
      'SELECT * FROM Solicitudes WHERE Folio = ?',
      [folio],
      conexion,
    );
    if (!solicitud)
    {
      return null;
    }
    const periodo = solicitud.Fecha_Solicitud.slice(0, 7);
    const [renglones, [presupuesto], [comprometido]] = await Promise.all([
      bd_tesoreria.Consultar(
        'SELECT * FROM Renglones WHERE id_solicitud = ? ORDER BY Numero',
        [solicitud.id_solicitud],
        conexion,
      ),
      bd_tesoreria.Consultar(
        'SELECT Monto FROM Presupuestos WHERE Periodo = ? AND Area = \'Biblioteca\'',
        [periodo],
        conexion,
      ),
      bd_tesoreria.Consultar(
        `SELECT COALESCE(SUM(Total), 0) AS total FROM Solicitudes
          WHERE Estatus = 'Aceptada' AND DATE_FORMAT(Fecha_Solicitud, '%Y-%m') = ?`,
        [periodo],
        conexion,
      ),
    ]);
    const monto = presupuesto?.Monto ?? 0;
    return {
      ...solicitud,
      renglones,
      presupuesto: {
        periodo,
        monto,
        comprometido: comprometido.total,
        disponible: monto - comprometido.total,
      },
    };
  },

  /*
   * Función: Recibir
   * Objetivo: Registrar una solicitud de compra enviada por un sistema. Si ese sistema ya
   *           había enviado la misma referencia, devuelve la solicitud existente (reenvío).
   * Entrada: { sistema_origen, referencia, solicitante, fecha, total, renglones }
   * Salida: Promesa con { solicitud, nueva }
   */
  async Recibir({ sistema_origen, referencia, solicitante, fecha, total, renglones })
  {
    const [existente] = await bd_tesoreria.Consultar(
      'SELECT Folio FROM Solicitudes WHERE Sistema_Origen = ? AND Referencia = ?',
      [sistema_origen, String(referencia)],
    );
    if (existente)
    {
      return { solicitud: await ModeloSolicitud.BuscarPorFolio(existente.Folio), nueva: false };
    }
    const folio = await bd_tesoreria.Transaccion(async (conexion) =>
    {
      const alta = await bd_tesoreria.Consultar(
        `INSERT INTO Solicitudes
           (Folio, Sistema_Origen, Referencia, Solicitante, Fecha_Solicitud, Total)
         VALUES (UUID(), ?, ?, ?, ?, ?)`,
        [sistema_origen, String(referencia), solicitante, fecha, total],
        conexion,
      );
      const folio_nuevo = `TES-${fecha.slice(0, 4)}-${String(alta.insertId).padStart(4, '0')}`;
      await bd_tesoreria.Consultar(
        'UPDATE Solicitudes SET Folio = ? WHERE id_solicitud = ?',
        [folio_nuevo, alta.insertId],
        conexion,
      );
      for (const [indice, renglon] of renglones.entries())
      {
        await bd_tesoreria.Consultar(
          `INSERT INTO Renglones
             (id_solicitud, Numero, Titulo, ISBN, Editorial, Cantidad, Precio_Unitario)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            alta.insertId,
            indice + 1,
            renglon.Titulo,
            renglon.ISBN ?? null,
            renglon.Editorial ?? null,
            renglon.Cantidad,
            renglon.Precio_Unitario ?? 0,
          ],
          conexion,
        );
      }
      return folio_nuevo;
    });
    return { solicitud: await ModeloSolicitud.BuscarPorFolio(folio), nueva: true };
  },

  /*
   * Función: Responder
   * Objetivo: Aceptar o rechazar una solicitud que sigue en estatus Recibida.
   * Entrada: folio, estatus ('Aceptada' | 'Rechazada'), motivo (opcional)
   * Salida: Promesa con la solicitud actualizada
   */
  async Responder(folio, estatus, motivo)
  {
    const solicitud = await ModeloSolicitud.BuscarPorFolio(folio);
    if (!solicitud)
    {
      throw new ErrorHttp(404, `No existe la solicitud ${folio}`);
    }
    if (solicitud.Estatus !== 'Recibida')
    {
      throw new ErrorHttp(409, `La solicitud ${folio} ya fue ${solicitud.Estatus.toLowerCase()}`);
    }
    await bd_tesoreria.Consultar(
      `UPDATE Solicitudes
          SET Estatus = ?, Motivo = ?, Fecha_Respuesta = NOW(), Notificada = FALSE
        WHERE Folio = ?`,
      [estatus, motivo ?? null, folio],
    );
    return ModeloSolicitud.BuscarPorFolio(folio);
  },

  /*
   * Función: MarcarNotificada
   * Objetivo: Registrar que el sistema de origen ya recibió la respuesta.
   * Entrada: folio
   * Salida: Promesa con el resultado de la actualización
   */
  MarcarNotificada(folio)
  {
    return bd_tesoreria.Consultar('UPDATE Solicitudes SET Notificada = TRUE WHERE Folio = ?', [
      folio,
    ]);
  },
};

export { ModeloSolicitud };
