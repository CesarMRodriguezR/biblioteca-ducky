/*
 * ******************************************************************
 * Nombre del programa: API-PANEL · ControladorPanel.js
 * Función: Indicadores del panel del administrador.
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
 *     Módulo             Objetivo
 *     ControladorPanel   Manejador del panel del administrador
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

import { ModeloUsuario } from '../modelos/ModeloUsuario.js';
import { ModeloLibro } from '../modelos/ModeloLibro.js';
import { ModeloOrdenCompra } from '../modelos/ModeloOrdenCompra.js';

/*
 * Módulo: ControladorPanel
 * Objetivo: Manejador del panel del administrador.
 */
const ControladorPanel = {
  /*
   * Función: Resumen
   * Objetivo: GET /panel — indicadores de la pantalla "Panel".
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Resumen(_req, res)
  {
    const [usuarios_validos, solicitudes_pendientes, libros_activos] = await Promise.all([
      ModeloUsuario.ContarActivos(),
      ModeloOrdenCompra.ContarPendientes(),
      ModeloLibro.ContarActivos(),
    ]);
    res.json({ usuarios_validos, solicitudes_pendientes, libros_activos });
  },
};

export { ControladorPanel };
