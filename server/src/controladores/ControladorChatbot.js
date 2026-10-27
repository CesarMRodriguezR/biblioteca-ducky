/*
 * ******************************************************************
 * Nombre del programa: API-CHATBOT · ControladorChatbot.js
 * Función: Respuestas del chatbot y administración de sus preguntas frecuentes.
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
 *     Módulo               Objetivo
 *     ControladorChatbot   Manejadores del chatbot y de sus preguntas frecuentes
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
import { ModeloChatbot } from '../modelos/ModeloChatbot.js';

/*
 * Módulo: ControladorChatbot
 * Objetivo: Manejadores del chatbot y de sus preguntas frecuentes.
 */
const ControladorChatbot = {
  /*
   * Función: Preguntar
   * Objetivo: POST /chatbot/preguntar — responde con la pregunta frecuente más parecida.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Preguntar(req, res)
  {
    res.json(await ModeloChatbot.Responder(req.body.texto));
  },

  /*
   * Función: Frecuentes
   * Objetivo: Atender GET /api/chatbot/frecuentes.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Frecuentes(_req, res)
  {
    res.json(await ModeloChatbot.PreguntasFrecuentes(10));
  },

  /*
   * Función: Listar
   * Objetivo: Atender GET /api/chatbot/preguntas.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Listar(_req, res)
  {
    res.json(await ModeloChatbot.Listar());
  },

  /*
   * Función: Obtener
   * Objetivo: Atender GET /api/chatbot/preguntas/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Obtener(req, res)
  {
    const pregunta = await ModeloChatbot.BuscarPregunta(req.params.id);
    if (!pregunta)
    {
      throw ErrorHttp.NoEncontrado('Pregunta no encontrada');
    }
    res.json(pregunta);
  },

  /*
   * Función: Crear
   * Objetivo: Atender POST /api/chatbot/preguntas.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Crear(req, res)
  {
    res.status(201).json(await ModeloChatbot.Crear(req.body));
  },

  /*
   * Función: Actualizar
   * Objetivo: Atender PUT /api/chatbot/preguntas/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Actualizar(req, res)
  {
    const existe = await ModeloChatbot.BuscarPregunta(req.params.id);
    if (!existe)
    {
      throw ErrorHttp.NoEncontrado('Pregunta no encontrada');
    }
    res.json(await ModeloChatbot.Actualizar(req.params.id, req.body));
  },

  /*
   * Función: Eliminar
   * Objetivo: Atender DELETE /api/chatbot/preguntas/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Eliminar(req, res)
  {
    const ok = await ModeloChatbot.Eliminar(req.params.id);
    if (!ok)
    {
      throw ErrorHttp.NoEncontrado('Pregunta no encontrada');
    }
    res.status(204).end();
  },
};

export { ControladorChatbot };
