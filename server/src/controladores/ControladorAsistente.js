/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 · ControladorAsistente.js
 * Función: Asistente Biblio: preguntas frecuentes, su respuesta con fuente y preguntas escritas
 *          que interpreta la IA.
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
 *     SIN_RESPUESTA         Respuesta cuando ninguna pregunta se parece
 *     ControladorAsistente  Manejadores del Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no contiene SQL; usa ModeloAsistente.
 * (2) Las preguntas dependen de las funciones de la sesión (req.usuario.funciones).
 * (3) Una pregunta escrita sin coincidencia no es error: responde encontrada: false con
 *     SIN_RESPUESTA.
 * ******************************************************************
 */

import { ModeloAsistente } from '../modelos/ModeloAsistente.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Constante: SIN_RESPUESTA
 * Objetivo: Respuesta cuando ninguna pregunta del perfil se parece a la que escribió el usuario.
 */
const SIN_RESPUESTA = 'No encontré información sobre eso. Intenta escribirlo de otra forma, ' +
  'elige una de las preguntas frecuentes o consulta con el personal de la biblioteca.';

/*
 * Módulo: ControladorAsistente
 * Objetivo: Manejadores del Asistente Biblio.
 */
const ControladorAsistente = {
  /*
   * Función: Preguntas
   * Objetivo: GET /asistente/preguntas — preguntas frecuentes (comunes a todos los perfiles).
   * Entrada: req: petición HTTP (ya autenticada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Preguntas(_req, res)
  {
    res.json(await ModeloAsistente.PreguntasFrecuentes());
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

  /*
   * Función: Conversar
   * Objetivo: POST /asistente/mensajes — responde una pregunta escrita si la IA reconoce una
   *           pregunta del perfil lo suficientemente parecida.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON: { encontrada, id_pregunta, Pregunta, Respuesta,
   *         Fuente } o { encontrada: false, Respuesta }
   */
  async Conversar(req, res)
  {
    const respuesta = await ModeloAsistente.Interpretar(req.body.mensaje, req.usuario.funciones);
    res.json(respuesta
      ? { encontrada: true, ...respuesta }
      : { encontrada: false, Respuesta: SIN_RESPUESTA });
  },
};

export { ControladorAsistente };
