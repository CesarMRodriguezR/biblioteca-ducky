/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-CLAVE · VerificarClave.js
 * Función: Exigir la clave de acceso de cada sistema externo en el encabezado X-Clave-Api.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Encabezado X-Clave-Api de la petición
 * Salida: Middleware de Express (401 si la clave no coincide)
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo           Objetivo
 *     VerificarClave   Crear el middleware que revisa la clave de un sistema
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Cada sistema tiene su propia clave (ENTORNO.CLAVES); Biblio la envía en cada petición.
 * ******************************************************************
 */

/*
 * Función: VerificarClave
 * Objetivo: Crear el middleware que rechaza las peticiones sin la clave del sistema.
 * Entrada: clave, nombre_sistema
 * Salida: Middleware de Express
 */
function VerificarClave(clave, nombre_sistema)
{
  return (req, res, next) =>
  {
    if (req.get('X-Clave-Api') !== clave)
    {
      return res.status(401).json({ error: `Clave de acceso a ${nombre_sistema} inválida` });
    }
    return next();
  };
}

export { VerificarClave };
