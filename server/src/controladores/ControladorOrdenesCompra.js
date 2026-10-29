/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL01 · ControladorOrdenesCompra.js
 * Función: Solicitudes de compra de libros y su flujo de autorización.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Peticiones HTTP enrutadas desde rutas/rutas.js
 * Salida: Respuestas HTTP en formato JSON
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                     Objetivo
 *     ControladorOrdenesCompra   Manejadores de las órdenes de compra
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no contiene SQL; usa los modelos de src/modelos.
 * (2) Cada método se registra en rutas/rutas.js envuelto en ManejarAsincrono, que envía los
 *     errores a ManejarErrores.
 * (3) Los permisos se revisan antes (RequiereFuncion) y los datos llegan validados por los
 *     esquemas zod.
 * (4) Los errores de regla de negocio se lanzan como ErrorHttp con el código HTTP
 *     correspondiente.
 * ******************************************************************
 */

import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloOrdenCompra } from '../modelos/ModeloOrdenCompra.js';
import { ModeloTesoreria } from '../modelos/ModeloTesoreria.js';
import { TieneFuncion } from '../intermediarios/autenticacion.js';

/*
 * Módulo: ControladorOrdenesCompra
 * Objetivo: Manejadores de las órdenes de compra.
 */
const ControladorOrdenesCompra = {
  /*
   * Función: Listar
   * Objetivo: Quien gestiona compras ve todas las órdenes; los demás, solo las suyas.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Listar(req, res)
  {
    const { estatus, limit, offset } = req.consulta_valida;
    const id_usuario = TieneFuncion(req, 'gestionar_libros') ? undefined : req.usuario.id_usuario;
    res.json(await ModeloOrdenCompra.Listar({ id_usuario, estatus, limit, offset }));
  },

  /*
   * Función: Solicitudes
   * Objetivo: GET /ordenes-compra/solicitudes — renglones abiertos ("Solicitudes pendientes").
   *           Antes de responder envía a Tesorería lo pendiente, trae sus respuestas y agrega
   *           a cada renglón el folio y el motivo que tiene Tesorería (si responde).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Solicitudes(_req, res)
  {
    const ids = (await ModeloOrdenCompra.SolicitudesAbiertas()).map((fila) => fila.id_orden);
    const { solicitudes } = await ModeloTesoreria.Sincronizar([...new Set(ids)]);
    const renglones = await ModeloOrdenCompra.SolicitudesAbiertas();
    res.json(
      renglones.map((fila) => ({
        ...fila,
        ...ModeloTesoreria.DatosTesoreria(solicitudes.get(fila.id_orden)),
      })),
    );
  },

  /*
   * Función: Obtener
   * Objetivo: Atender GET /api/ordenes-compra/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Obtener(req, res)
  {
    const orden = await ModeloOrdenCompra.BuscarPorId(req.params.id);
    if (!orden)
    {
      throw ErrorHttp.NoEncontrado('Orden no encontrada');
    }
    if (!TieneFuncion(req, 'gestionar_libros') && orden.id_usuario !== req.usuario.id_usuario)
    {
      throw ErrorHttp.Prohibido();
    }
    res.json(orden);
  },

  /*
   * Función: Crear
   * Objetivo: POST /ordenes-compra — registra la orden y la envía a Tesorería. Si Tesorería
   *           no responde, la orden queda Pendiente y se reenvía después (envio_tesoreria).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Crear(req, res)
  {
    const orden = await ModeloOrdenCompra.Crear(req.body, req.usuario.id_usuario);
    try
    {
      const enviada = await ModeloTesoreria.EnviarOrden(orden.id_orden);
      res.status(201).json({ ...enviada, envio_tesoreria: { enviada: true } });
    }
    catch (error)
    {
      if (error.details?.codigo !== 'SISTEMA_EXTERNO')
      {
        throw error;
      }
      res.status(201).json({
        ...orden,
        envio_tesoreria: { enviada: false, mensaje: error.message },
      });
    }
  },

  /*
   * Función: RecibirRespuestaTesoreria
   * Objetivo: POST /tesoreria/notificaciones — aviso de Tesorería: aceptó o rechazó una
   *           solicitud. Lo llama el sistema externo, no un usuario.
   * Entrada: req: petición HTTP (con clave de integración y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async RecibirRespuestaTesoreria(req, res)
  {
    const { orden, cambio } = await ModeloTesoreria.AplicarRespuesta(req.body);
    res.json({ id_orden: orden.id_orden, Estatus: orden.Estatus, cambio });
  },

  /*
   * Función: CambiarEstatus
   * Objetivo: PATCH /ordenes-compra/:id/estatus — marcar como Recibida una orden que
   *           Tesorería aprobó (llegaron los libros); agrega las copias al inventario.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async CambiarEstatus(req, res)
  {
    const orden = await ModeloOrdenCompra.CambiarEstatus(req.params.id, req.body.Estatus);
    res.json(orden);
  },
};

export { ControladorOrdenesCompra };
