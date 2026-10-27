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
import { ModeloBitacora } from '../modelos/ModeloBitacora.js';
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
    const id_usuario = TieneFuncion(req, 'gestionar_compras') ? undefined : req.usuario.id_usuario;
    res.json(await ModeloOrdenCompra.Listar({ id_usuario, estatus, limit, offset }));
  },

  /*
   * Función: Solicitudes
   * Objetivo: GET /ordenes-compra/solicitudes — renglones abiertos ("Solicitudes pendientes").
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Solicitudes(_req, res)
  {
    res.json(await ModeloOrdenCompra.SolicitudesAbiertas());
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
    if (!TieneFuncion(req, 'gestionar_compras') && orden.id_usuario !== req.usuario.id_usuario)
    {
      throw ErrorHttp.Prohibido();
    }
    res.json(orden);
  },

  /*
   * Función: Crear
   * Objetivo: Atender POST /api/ordenes-compra.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Crear(req, res)
  {
    const orden = await ModeloOrdenCompra.Crear(req.body, req.usuario.id_usuario);
    const renglones = [...orden.libros_existentes, ...orden.libros_nuevos];
    const descripcion = renglones
      .map(
        (renglon) => `${renglon.Titulo} · ${renglon.Num_Ejemplares} ${renglon.Num_Ejemplares === 1 ? 'copia' : 'copias'}`,
      )
      .join('; ');
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'SOLICITUD_COMPRA',
      `Solicitud de compra: ${descripcion}`,
    );
    res.status(201).json(orden);
  },

  /*
   * Función: CambiarEstatus
   * Objetivo: Atender PATCH /api/ordenes-compra/:id/estatus.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async CambiarEstatus(req, res)
  {
    const orden = await ModeloOrdenCompra.CambiarEstatus(req.params.id, req.body.Estatus);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'ESTATUS_COMPRA',
      `Solicitud de compra #${orden.id_orden} → ${orden.Estatus}`,
    );
    res.json(orden);
  },
};

export { ControladorOrdenesCompra };
