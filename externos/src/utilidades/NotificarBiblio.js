/*
 * ******************************************************************
 * Nombre del programa: TESORERIA · NotificarBiblio.js
 * Función: Avisar a Biblio que Tesorería aceptó o rechazó una de sus solicitudes de compra.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Solicitud respondida
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
 *     NotificarBiblio   Enviar la respuesta de Tesorería a Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Si Biblio no está disponible, la solicitud queda con Notificada = FALSE y Biblio la
 *     consulta por su cuenta la próxima vez que revise sus solicitudes.
 * ******************************************************************
 */

import { ENTORNO } from '../configuracion/entorno.js';

/*
 * Función: NotificarBiblio
 * Objetivo: Enviar a Biblio el folio, la referencia y la respuesta de una solicitud.
 * Entrada: solicitud
 * Salida: Promesa con true si Biblio respondió 2xx
 */
async function NotificarBiblio(solicitud)
{
  try
  {
    const respuesta = await fetch(`${ENTORNO.BIBLIO.URL}/tesoreria/notificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Clave-Integracion': ENTORNO.BIBLIO.CLAVE_NOTIFICACION,
      },
      body: JSON.stringify({
        folio: solicitud.Folio,
        referencia: solicitud.Referencia,
        estatus: solicitud.Estatus,
        motivo: solicitud.Motivo,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return respuesta.ok;
  }
  catch
  {
    return false;
  }
}

export { NotificarBiblio };
