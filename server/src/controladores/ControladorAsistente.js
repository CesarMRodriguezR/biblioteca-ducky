/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 · ControladorAsistente.js
 * Función: Asistente Biblio: preguntas disponibles para el perfil y su respuesta con fuente.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
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
 *     Módulo                Objetivo
 *     ControladorAsistente  Manejadores del Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no contiene SQL; usa ModeloAsistente.
 * (2) Las preguntas dependen de las funciones de la sesión (req.usuario.funciones).
 * ******************************************************************
 */

import { ModeloAsistente } from '../modelos/ModeloAsistente.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Módulo: ControladorAsistente
 * Objetivo: Manejadores del Asistente Biblio.
 */
const ControladorAsistente = {
  /*
   * Función: Preguntas
   * Objetivo: GET /asistente/preguntas — preguntas que puede hacer el usuario.
   * Entrada: req: petición HTTP (ya autenticada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Preguntas(req, res)
  {
    res.json(await ModeloAsistente.Preguntas(req.usuario.funciones));
  },

  /*
   * Función: Responder
   * Objetivo: GET /asistente/preguntas/:id — respuesta y fuente de una pregunta del perfil.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Responder(req, res)
  {
    const respuesta = await ModeloAsistente.Responder(req.params.id, req.usuario.funciones);
    if (!respuesta)
    {
      throw ErrorHttp.NoEncontrado('Esa pregunta no está disponible para tu perfil.');
    }
    res.json(respuesta);
  },
};

export { ControladorAsistente };
