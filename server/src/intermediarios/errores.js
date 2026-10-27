/*
 * ******************************************************************
 * Nombre del programa: API-ERRORES · errores.js
 * Función: Responder rutas inexistentes y convertir los errores en respuestas JSON con el
 *          código HTTP correcto.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Petición HTTP de Express (req, res, next)
 * Salida: Llama a next() o responde con un error HTTP
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo             Objetivo
 *     ERRORES_SQL        Traducción de los errores de MariaDB a código HTTP y mensaje
 *     RutaNoEncontrada   Responder 404 a las rutas que no existen
 *     ManejarErrores     Convertir cualquier error en una respuesta JSON con el…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se registran en rutas/rutas.js o aplicacion.js antes del controlador.
 * ******************************************************************
 */

import { ENTORNO } from '../configuracion/entorno.js';

/*
 * Constante: ERRORES_SQL
 * Objetivo: Traducción de los errores de MariaDB a código HTTP y mensaje.
 */
const ERRORES_SQL = {
  ER_DUP_ENTRY: { status: 409, message: 'Ya existe un registro con esos datos' },
  ER_ROW_IS_REFERENCED_2: { status: 409, message: 'El registro está en uso y no puede eliminarse' },
  ER_NO_REFERENCED_ROW_2: { status: 400, message: 'Una referencia no existe' },
  ER_CONSTRAINT_FAILED: {
    status: 400,
    message: 'Los datos no cumplen las reglas de la base de datos',
  },
};

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
 * Salida: Respuesta HTTP con { error, detalles }
 */
function ManejarErrores(error, _req, res, _next)
{
  if (error.name === 'HttpError')
  {
    return res.status(error.status).json({ error: error.message, detalles: error.details });
  }

  const sql = ERRORES_SQL[error.code];
  if (sql)
  {
    return res.status(sql.status).json({ error: sql.message });
  }

  if (error.type === 'entity.parse.failed')
  {
    return res.status(400).json({ error: 'JSON mal formado' });
  }

  console.error(error);
  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(ENTORNO.MODO !== 'production' && { detalle: error.message }),
  });
}

export { RutaNoEncontrada, ManejarErrores };
