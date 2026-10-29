/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-ERRORES · errores.js
 * Función: Responder 404 a rutas inexistentes y convertir los errores en JSON.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Errores lanzados por las rutas
 * Salida: Respuestas HTTP { error }
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo             Objetivo
 *     RutaNoEncontrada   Responder 404 a las rutas que no existen
 *     ManejarErrores     Convertir cualquier error en una respuesta JSON
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Registrar al final de aplicacion.js, después de todas las rutas.
 * ******************************************************************
 */

/*
 * Función: RutaNoEncontrada
 * Objetivo: Responder 404 a las rutas que no existen.
 * Entrada: req, res
 * Salida: Respuesta HTTP 404
 */
function RutaNoEncontrada(req, res)
{
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/*
 * Función: ManejarErrores
 * Objetivo: Convertir cualquier error en una respuesta JSON con el código HTTP correcto.
 * Entrada: error, _req, res, _next
 * Salida: Respuesta HTTP con { error }
 */
function ManejarErrores(error, _req, res, _next)
{
  if (error.name === 'HttpError')
  {
    return res.status(error.status).json({ error: error.message });
  }
  if (error.type === 'entity.parse.failed')
  {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  if (error.code === 'ER_DUP_ENTRY')
  {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Error interno del sistema externo' });
}

export { RutaNoEncontrada, ManejarErrores };
