/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-ERROR · ErrorHttp.js
 * Función: Error con código HTTP para responder desde los sistemas externos.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Código HTTP y mensaje
 * Salida: Instancia de ErrorHttp
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Clase       Objetivo
 *     ErrorHttp   Error que ManejarErrores convierte en respuesta JSON
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Lanzar new ErrorHttp(404, 'mensaje') desde un modelo o controlador.
 * ******************************************************************
 */

/*
 * Clase: ErrorHttp
 * Objetivo: Error que ManejarErrores convierte en { error } con el código HTTP indicado.
 */
class ErrorHttp extends Error
{
  constructor(status, message)
  {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export { ErrorHttp };
