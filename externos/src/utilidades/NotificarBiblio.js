/*
 * ******************************************************************
 * Nombre del programa: TESORERIA · NotificarBiblio.js
 * Función: Avisar a Biblio cuando Tesorería responde una solicitud de compra o registra el pago
 *          de una multa.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Solicitud respondida o pago registrado
 * Salida: true si Biblio recibió el aviso
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     EnviarAviso       Enviar un aviso a una ruta de la API de Biblio
 *     NotificarBiblio   Avisar la respuesta de una solicitud de compra
 *     NotificarPago     Avisar el pago de una multa
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Si Biblio no está disponible, el registro queda sin notificar y Biblio lo consulta por su
 *     cuenta la próxima vez que revise sus solicitudes o sus pagos.
 * ******************************************************************
 */

import { ENTORNO } from '../configuracion/entorno.js';

/*
 * Función: EnviarAviso
 * Objetivo: Enviar un aviso a una ruta de la API de Biblio con la clave de integración.
 * Entrada: ruta, cuerpo
 * Salida: Promesa con true si Biblio respondió 2xx
 */
async function EnviarAviso(ruta, cuerpo)
{
  try
  {
    const respuesta = await fetch(`${ENTORNO.BIBLIO.URL}${ruta}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Clave-Integracion': ENTORNO.BIBLIO.CLAVE_NOTIFICACION,
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(5000),
    });
    return respuesta.ok;
  }
  catch
  {
    return false;
  }
}

/*
 * Función: NotificarBiblio
 * Objetivo: Enviar a Biblio el folio, la referencia y la respuesta de una solicitud.
 * Entrada: solicitud
 * Salida: Promesa con true si Biblio respondió 2xx
 */
function NotificarBiblio(solicitud)
{
  return EnviarAviso('/tesoreria/notificaciones', {
    folio: solicitud.Folio,
    referencia: solicitud.Referencia,
    estatus: solicitud.Estatus,
    motivo: solicitud.Motivo,
  });
}

/*
 * Función: NotificarPago
 * Objetivo: Enviar a Biblio el folio del pago, la multa pagada (referencia), el monto y la
 *           fecha.
 * Entrada: pago
 * Salida: Promesa con true si Biblio respondió 2xx
 */
function NotificarPago(pago)
{
  return EnviarAviso('/tesoreria/pagos', {
    folio: pago.Folio,
    referencia: pago.Referencia,
    monto: pago.Monto,
    fecha: pago.Fecha_Pago.slice(0, 10),
  });
}

export { NotificarBiblio, NotificarPago };
