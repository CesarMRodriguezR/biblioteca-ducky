/*
 * ******************************************************************
 * Nombre del programa: TESORERIA-CLI · tesoreria.js
 * Función: Operar Tesorería desde la terminal: ver las solicitudes recibidas y mandar la señal
 *          de aceptación o rechazo (que Tesorería avisa a Biblio).
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Argumentos de la terminal
 * Salida: Resultado en la terminal
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     AYUDA               Texto de uso del comando
 *     LlamarTesoreria     Hacer una petición a la API de Tesorería
 *     MostrarSolicitud    Imprimir una solicitud con sus renglones y presupuesto
 *     Principal           Ejecutar el comando indicado
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Con el servicio externo encendido (npm run dev):
 *       npm run tesoreria -- listar [Recibida|Aceptada|Rechazada]
 *       npm run tesoreria -- ver TES-2026-0003
 *       npm run tesoreria -- aceptar TES-2026-0003
 *       npm run tesoreria -- rechazar TES-2026-0003 "Sin presupuesto este mes"
 * (2) Usa la API (no la base de datos), igual que lo haría el personal de Tesorería.
 * ******************************************************************
 */

import { ENTORNO } from '../src/configuracion/entorno.js';

/*
 * Constante: AYUDA
 * Objetivo: Texto de uso del comando.
 */
const AYUDA = `Uso:
  npm run tesoreria -- listar [Recibida|Aceptada|Rechazada]
  npm run tesoreria -- ver <folio>
  npm run tesoreria -- aceptar <folio> [comentario]
  npm run tesoreria -- rechazar <folio> "<motivo>"`;

/*
 * Función: LlamarTesoreria
 * Objetivo: Hacer una petición a la API de Tesorería con su clave.
 * Entrada: metodo, ruta, cuerpo (opcional)
 * Salida: Promesa con el JSON de la respuesta; lanza un Error si no es 2xx
 */
async function LlamarTesoreria(metodo, ruta, cuerpo)
{
  const respuesta = await fetch(
    `http://localhost:${ENTORNO.PUERTO}/tesoreria/api${ruta}`,
    {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'X-Clave-Api': ENTORNO.CLAVES.TESORERIA },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    },
  );
  const datos = await respuesta.json();
  if (!respuesta.ok)
  {
    throw new Error(datos.error ?? `Error ${respuesta.status}`);
  }
  return datos;
}

/*
 * Función: MostrarSolicitud
 * Objetivo: Imprimir una solicitud con sus renglones y el presupuesto del periodo.
 * Entrada: solicitud
 * Salida: Ninguna (escribe en la terminal)
 */
function MostrarSolicitud(solicitud)
{
  console.log(`${solicitud.Folio} · ${solicitud.Estatus} · ${solicitud.Sistema_Origen} orden ` +
    `#${solicitud.Referencia} · ${solicitud.Solicitante} · ${solicitud.Fecha_Solicitud}`);
  solicitud.renglones?.forEach((renglon) =>
    console.log(`  ${renglon.Cantidad} × ${renglon.Titulo}` +
      `${renglon.ISBN ? ` (${renglon.ISBN})` : ''} · $${renglon.Precio_Unitario.toFixed(2)}`));
  console.log(`  Total: $${solicitud.Total.toFixed(2)}`);
  if (solicitud.presupuesto)
  {
    const { periodo, monto, comprometido, disponible } = solicitud.presupuesto;
    console.log(`  Presupuesto ${periodo}: $${monto.toFixed(2)} · comprometido ` +
      `$${comprometido.toFixed(2)} · disponible $${disponible.toFixed(2)}`);
  }
  if (solicitud.Motivo)
  {
    console.log(`  Motivo: ${solicitud.Motivo}`);
  }
}

/*
 * Función: Principal
 * Objetivo: Ejecutar el comando indicado en la terminal.
 * Entrada: Argumentos de process.argv
 * Salida: Promesa que termina al imprimir el resultado
 */
async function Principal()
{
  const [comando, folio, ...resto] = process.argv.slice(2);
  const texto = resto.join(' ').trim();
  if (comando === 'listar')
  {
    const { datos } = await LlamarTesoreria('GET', `/solicitudes${folio ? `?estatus=${folio}` : ''}`);
    if (!datos.length)
    {
      console.log('No hay solicitudes.');
    }
    datos.forEach(MostrarSolicitud);
    return;
  }
  if (!folio || !['ver', 'aceptar', 'rechazar'].includes(comando))
  {
    console.log(AYUDA);
    process.exitCode = 1;
    return;
  }
  if (comando === 'ver')
  {
    MostrarSolicitud(await LlamarTesoreria('GET', `/solicitudes/${folio}`));
    return;
  }
  const solicitud = await LlamarTesoreria('POST', `/solicitudes/${folio}/${comando}`, {
    motivo: texto || undefined,
  });
  MostrarSolicitud(solicitud);
  console.log(solicitud.Notificada
    ? 'Biblio recibió la respuesta.'
    : 'Biblio no respondió; verá la respuesta cuando consulte sus solicitudes.');
}

Principal().catch((error) =>
{
  console.error(`Tesorería: ${error.cause?.code === 'ECONNREFUSED' ? 'el servicio externo no está encendido' : error.message}`);
  process.exitCode = 1;
});
