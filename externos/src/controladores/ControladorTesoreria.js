/*
 * ******************************************************************
 * Nombre del programa: TESORERIA · ControladorTesoreria.js
 * Función: Atender la API de Tesorería: recibir solicitudes de compra, consultarlas y
 *          aceptarlas o rechazarlas (la respuesta se avisa a Biblio).
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Peticiones HTTP de /tesoreria/api
 * Salida: Respuestas HTTP en formato JSON
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                 Objetivo
 *     ValidarSolicitud       Revisar los datos de una solicitud recibida
 *     ControladorTesoreria   Manejadores de la API de Tesorería
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se registra en rutas/RutasTesoreria.js envuelto en ManejarAsincrono.
 * (2) Aceptar y Rechazar son la "señal" de Tesorería: se llaman a mano (curl, Postman o
 *     npm run tesoreria); no hay interfaz.
 * ******************************************************************
 */

import { ModeloSolicitud } from '../modelos/ModeloSolicitud.js';
import { NotificarBiblio } from '../utilidades/NotificarBiblio.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Función: ValidarSolicitud
 * Objetivo: Revisar los datos de una solicitud recibida.
 * Entrada: cuerpo
 * Salida: Datos normalizados; lanza ErrorHttp 400 si falta algo
 */
function ValidarSolicitud(cuerpo = {})
{
  const { referencia, solicitante, fecha, total, renglones } = cuerpo;
  if (!referencia || !solicitante || !/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? ''))
  {
    throw new ErrorHttp(400, 'La solicitud debe traer referencia, solicitante y fecha');
  }
  if (!Array.isArray(renglones) || !renglones.length)
  {
    throw new ErrorHttp(400, 'La solicitud debe traer al menos un renglón');
  }
  if (renglones.some((renglon) => !renglon.Titulo || !(Number(renglon.Cantidad) > 0)))
  {
    throw new ErrorHttp(400, 'Cada renglón necesita título y una cantidad mayor a cero');
  }
  return {
    sistema_origen: cuerpo.sistema_origen || 'Biblio',
    referencia,
    solicitante,
    fecha,
    total: Number(total) || 0,
    renglones,
  };
}

/*
 * Módulo: ControladorTesoreria
 * Objetivo: Manejadores de la API de Tesorería.
 */
const ControladorTesoreria = {
  /*
   * Función: Recibir
   * Objetivo: POST /solicitudes — registrar una solicitud de compra enviada por Biblio.
   * Entrada: req, res
   * Salida: 201 con la solicitud (200 si ya se había recibido)
   */
  async Recibir(req, res)
  {
    const { solicitud, nueva } = await ModeloSolicitud.Recibir(ValidarSolicitud(req.body));
    res.status(nueva ? 201 : 200).json(solicitud);
  },

  /*
   * Función: Listar
   * Objetivo: GET /solicitudes?estatus=&sistema=&referencias=1,2 — solicitudes filtradas. Biblio
   *           consulta sus órdenes por referencia (su número de orden), no guarda el folio.
   * Entrada: req, res
   * Salida: Respuesta JSON { total, datos }
   */
  async Listar(req, res)
  {
    const { estatus, sistema, referencias } = req.query;
    const datos = await ModeloSolicitud.Listar({
      estatus,
      sistema,
      referencias: referencias ? String(referencias).split(',').filter(Boolean) : undefined,
    });
    res.json({ total: datos.length, datos });
  },

  /*
   * Función: Obtener
   * Objetivo: GET /solicitudes/:folio — una solicitud con renglones y presupuesto.
   * Entrada: req, res
   * Salida: Respuesta JSON con la solicitud
   */
  async Obtener(req, res)
  {
    const solicitud = await ModeloSolicitud.BuscarPorFolio(req.params.folio);
    if (!solicitud)
    {
      throw new ErrorHttp(404, `No existe la solicitud ${req.params.folio}`);
    }
    res.json(solicitud);
  },

  /*
   * Función: Aceptar
   * Objetivo: POST /solicitudes/:folio/aceptar — aceptar la solicitud y avisar a Biblio.
   * Entrada: req, res
   * Salida: Respuesta JSON con la solicitud y si Biblio recibió el aviso
   */
  async Aceptar(req, res)
  {
    const solicitud = await ModeloSolicitud.Responder(
      req.params.folio,
      'Aceptada',
      req.body?.motivo,
    );
    res.json(await ControladorTesoreria.Avisar(solicitud));
  },

  /*
   * Función: Rechazar
   * Objetivo: POST /solicitudes/:folio/rechazar — rechazar la solicitud con un motivo y
   *           avisar a Biblio.
   * Entrada: req, res
   * Salida: Respuesta JSON con la solicitud y si Biblio recibió el aviso
   */
  async Rechazar(req, res)
  {
    const motivo = String(req.body?.motivo ?? '').trim();
    if (!motivo)
    {
      throw new ErrorHttp(400, 'Indica el motivo del rechazo');
    }
    const solicitud = await ModeloSolicitud.Responder(req.params.folio, 'Rechazada', motivo);
    res.json(await ControladorTesoreria.Avisar(solicitud));
  },

  /*
   * Función: Avisar
   * Objetivo: Avisar a Biblio y marcar la solicitud como notificada si lo recibió.
   * Entrada: solicitud
   * Salida: Promesa con { ...solicitud, notificada }
   */
  async Avisar(solicitud)
  {
    const notificada = await NotificarBiblio(solicitud);
    if (notificada)
    {
      await ModeloSolicitud.MarcarNotificada(solicitud.Folio);
    }
    return { ...solicitud, Notificada: notificada };
  },
};

export { ControladorTesoreria };
