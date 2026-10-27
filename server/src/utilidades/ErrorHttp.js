/*
 * ******************************************************************
 * Nombre del programa: API-ERROR-HTTP · ErrorHttp.js
 * Función: Error con código HTTP y detalles para responder al cliente.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Código, mensaje y detalles
 * Salida: Instancia de ErrorHttp
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo       Objetivo
 *     ErrorHttp    Error con código HTTP, mensaje y detalles para la respuesta
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Funciones de apoyo sin acceso a la base de datos; se pueden usar en cualquier capa.
 * ******************************************************************
 */

/*
 * Clase: ErrorHttp
 * Objetivo: Error con código HTTP, mensaje y detalles para la respuesta.
 */
class ErrorHttp extends Error
{
  /*
   * Función: ErrorHttp.constructor
   * Objetivo: Crear el error con su código y detalles.
   * Entrada: estado_http, mensaje, detalles (opcional)
   * Salida: Instancia de ErrorHttp
   */
  constructor(estado_http, mensaje, detalles = undefined)
  {
    super(mensaje);
    this.name = 'HttpError';
    this.status = estado_http;
    this.details = detalles;
  }

  /*
   * Función: SolicitudInvalida
   * Objetivo: Crear un error 400 (datos inválidos).
   * Entrada: mensaje, detalles
   * Salida: ErrorHttp
   */
  static SolicitudInvalida(mensaje, detalles)
  {
    return new ErrorHttp(400, mensaje, detalles);
  }
  /*
   * Función: NoAutenticado
   * Objetivo: Crear un error 401 (sin sesión).
   * Entrada: mensaje (opcional)
   * Salida: ErrorHttp
   */
  static NoAutenticado(mensaje = 'No autenticado')
  {
    return new ErrorHttp(401, mensaje);
  }
  /*
   * Función: Prohibido
   * Objetivo: Crear un error 403 (sin permiso).
   * Entrada: mensaje (opcional)
   * Salida: ErrorHttp
   */
  static Prohibido(mensaje = 'No tienes permiso para esta acción')
  {
    return new ErrorHttp(403, mensaje);
  }
  /*
   * Función: NoEncontrado
   * Objetivo: Crear un error 404 (no existe).
   * Entrada: mensaje (opcional)
   * Salida: ErrorHttp
   */
  static NoEncontrado(mensaje = 'Recurso no encontrado')
  {
    return new ErrorHttp(404, mensaje);
  }
  /*
   * Función: Conflicto
   * Objetivo: Crear un error 409 (regla de negocio).
   * Entrada: mensaje, detalles
   * Salida: ErrorHttp
   */
  static Conflicto(mensaje, detalles)
  {
    return new ErrorHttp(409, mensaje, detalles);
  }
}

export { ErrorHttp };
