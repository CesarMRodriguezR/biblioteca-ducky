/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL01 · ModeloTesoreria.js
 * Función: Enviar las solicitudes de compra a Tesorería (sistema externo) y traer sus
 *          respuestas (aceptada o rechazada).
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Órdenes de compra de Biblio
 * Salida: Órdenes con su estatus actualizado y los datos que da Tesorería (folio, motivo)
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     SISTEMA_ORIGEN    Nombre con el que Biblio se identifica ante Tesorería
 *     DatosTesoreria    Tomar de una solicitud de Tesorería lo que Biblio muestra (folio…
 *     ModeloTesoreria   Envío de órdenes a Tesorería y consulta de sus respuestas
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Flujo: Biblio crea la orden (Pendiente) → la envía a Tesorería (En revisión)
 *     → Tesorería la acepta o rechaza y avisa a POST /api/tesoreria/notificaciones
 *     (Aprobada / Rechazada). Si Tesorería no estaba disponible o el aviso no llegó,
 *     Sincronizar reintenta el envío y consulta la respuesta.
 * (2) Biblio no decide la aprobación: solo Tesorería puede aprobar o rechazar.
 * (3) Biblio no guarda el folio ni el motivo: la orden se identifica en Tesorería por su
 *     referencia (id_orden) y esos datos se consultan a Tesorería cuando se muestran.
 * ******************************************************************
 */

import { ENTORNO } from '../configuracion/entorno.js';
import { LlamarSistemaExterno } from '../utilidades/LlamarSistemaExterno.js';
import { ModeloOrdenCompra } from './ModeloOrdenCompra.js';

/*
 * Constante: SISTEMA_ORIGEN
 * Objetivo: Nombre con el que Biblio se identifica ante Tesorería.
 */
const SISTEMA_ORIGEN = 'Biblio';

/*
 * Función: DatosTesoreria
 * Objetivo: Tomar de una solicitud de Tesorería lo que Biblio muestra (folio y motivo).
 * Entrada: solicitud (o undefined)
 * Salida: { Folio_Tesoreria, Motivo_Respuesta } o un objeto vacío
 */
function DatosTesoreria(solicitud)
{
  return solicitud
    ? { Folio_Tesoreria: solicitud.Folio, Motivo_Respuesta: solicitud.Motivo ?? null }
    : {};
}

/*
 * Módulo: ModeloTesoreria
 * Objetivo: Envío de órdenes a Tesorería y consulta de sus respuestas.
 */
const ModeloTesoreria = {
  DatosTesoreria,

  /*
   * Función: EnviarOrden
   * Objetivo: Enviar una orden a Tesorería con sus renglones (la referencia es el id_orden).
   * Entrada: id_orden
   * Salida: Promesa con la orden actualizada (En revisión) y el folio que asignó Tesorería;
   *         lanza ErrorHttp 502 si Tesorería no responde
   */
  async EnviarOrden(id_orden)
  {
    const orden = await ModeloOrdenCompra.BuscarPorId(id_orden);
    const renglones = [...orden.libros_existentes, ...orden.libros_nuevos].map((renglon) => ({
      Titulo: renglon.Titulo,
      ISBN: renglon.ISBN,
      Editorial: renglon.Editorial ?? null,
      Cantidad: renglon.Num_Ejemplares,
      Precio_Unitario: renglon.Precio ?? 0,
    }));
    const solicitud = await LlamarSistemaExterno(
      ENTORNO.EXTERNOS.TESORERIA,
      'POST',
      '/solicitudes',
      {
        sistema_origen: SISTEMA_ORIGEN,
        referencia: String(orden.id_orden),
        solicitante: orden.Nombre_Completo,
        fecha: orden.Fecha_Orden,
        total: orden.CantidadTotal,
        renglones,
      },
    );
    let enviada = await ModeloOrdenCompra.RegistrarEnvio(orden.id_orden);
    if (solicitud.Estatus === 'Aceptada' || solicitud.Estatus === 'Rechazada')
    {
      enviada = (await ModeloTesoreria.AplicarRespuesta(solicitud)).orden;
    }
    return { ...enviada, ...DatosTesoreria(solicitud) };
  },

  /*
   * Función: AplicarRespuesta
   * Objetivo: Reflejar en la orden la respuesta de Tesorería (la orden es su referencia).
   * Entrada: { Referencia | referencia, Estatus | estatus }
   * Salida: Promesa con { orden, cambio }
   */
  AplicarRespuesta(respuesta)
  {
    return ModeloOrdenCompra.RegistrarRespuesta({
      id_orden: String(respuesta.referencia ?? respuesta.Referencia),
      estatus: respuesta.estatus ?? respuesta.Estatus,
    });
  },

  /*
   * Función: ConsultarSolicitudes
   * Objetivo: Pedir a Tesorería las solicitudes de Biblio de varias órdenes.
   * Entrada: ids (id_orden)
   * Salida: Promesa con un Map id_orden → solicitud de Tesorería
   */
  async ConsultarSolicitudes(ids)
  {
    const solicitudes = new Map();
    if (!ids.length)
    {
      return solicitudes;
    }
    const { datos } = await LlamarSistemaExterno(
      ENTORNO.EXTERNOS.TESORERIA,
      'GET',
      `/solicitudes?sistema=${SISTEMA_ORIGEN}&referencias=${ids.join(',')}`,
    );
    datos.forEach((solicitud) => solicitudes.set(String(solicitud.Referencia), solicitud));
    return solicitudes;
  },

  /*
   * Función: Sincronizar
   * Objetivo: Enviar las órdenes que siguen Pendientes, traer la respuesta de las que están En
   *           revisión y devolver lo que Tesorería sabe de las órdenes indicadas. Si Tesorería no
   *           responde, se deja para la siguiente vez.
   * Entrada: ids_consulta (id_orden de las que se van a mostrar; opcional)
   * Salida: Promesa con { enviadas, respondidas, disponible, solicitudes (Map) }
   */
  async Sincronizar(ids_consulta = [])
  {
    const resumen = { enviadas: 0, respondidas: 0, disponible: true, solicitudes: new Map() };
    try
    {
      for (const { id_orden } of await ModeloOrdenCompra.PorEstatus('Pendiente'))
      {
        await ModeloTesoreria.EnviarOrden(id_orden);
        resumen.enviadas += 1;
      }
      const en_revision = (await ModeloOrdenCompra.PorEstatus('En revision')).map(
        (orden) => orden.id_orden,
      );
      resumen.solicitudes = await ModeloTesoreria.ConsultarSolicitudes([
        ...new Set([...en_revision, ...ids_consulta]),
      ]);
      for (const id_orden of en_revision)
      {
        const solicitud = resumen.solicitudes.get(id_orden);
        if (solicitud && solicitud.Estatus !== 'Recibida')
        {
          await ModeloTesoreria.AplicarRespuesta(solicitud);
          resumen.respondidas += 1;
        }
      }
    }
    catch (error)
    {
      if (error.details?.codigo !== 'SISTEMA_EXTERNO')
      {
        throw error;
      }
      resumen.disponible = false;
    }
    return resumen;
  },
};

export { ModeloTesoreria };
