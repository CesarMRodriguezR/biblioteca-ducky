/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-ASINCRONO · ManejarAsincrono.js
 * Función: Enviar al manejador de errores las excepciones de los controladores asíncronos.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Controlador async
 * Salida: Middleware de Express
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo             Objetivo
 *     ManejarAsincrono   Envuelve un controlador async para que los errores…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Envolver cada controlador al registrarlo en las rutas.
 * ******************************************************************
 */

/*
 * Función: ManejarAsincrono
 * Objetivo: Envuelve un controlador async para que los errores lleguen a ManejarErrores.
 * Entrada: funcion
 * Salida: Middleware de Express
 */
const ManejarAsincrono = (funcion) => (req, res, next) =>
  Promise.resolve(funcion(req, res, next)).catch(next);

export { ManejarAsincrono };
