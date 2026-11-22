/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 y CB02 · ModeloAsistente.js
 * Función: Preguntas y respuestas del Asistente Biblio según las funciones del perfil, con la
 *          fuente (artefacto del proyecto) de cada respuesta.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Funciones del usuario, id de la pregunta o mensaje escrito
 * Salida: Preguntas disponibles y respuesta con su fuente
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     FUNCION_COMUN     Función que tienen todos los perfiles
 *     ModeloAsistente   Acceso a las preguntas y respuestas del Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Tablas del diagrama: PreguntasChatbot, ContenidosChatbot (respuesta) y FuentesChatbot.
 * (2) Cada pregunta pertenece a una función (PreguntasChatbot.id_funcion): un perfil solo ve
 *     las preguntas de sus funciones, igual que los menús.
 * (3) Las preguntas de usar_asistente (comunes a todos) se eligen con un clic; las demás solo
 *     se responden cuando el usuario las escribe y la IA (BuscadorSemantico) reconoce una
 *     parecida.
 * ******************************************************************
 */

import { Consultar } from '../configuracion/conexion.js';
import { BuscadorSemantico } from '../utilidades/BuscadorSemantico.js';

/*
 * Constante: FUNCION_COMUN
 * Objetivo: Función que tienen todos los perfiles; sus preguntas son las frecuentes.
 */
const FUNCION_COMUN = 'usar_asistente';

/*
 * Módulo: ModeloAsistente
 * Objetivo: Acceso a las preguntas y respuestas del Asistente Biblio.
 */
const ModeloAsistente = {
  /*
   * Función: PreguntasFrecuentes
   * Objetivo: Preguntas comunes a todos los perfiles (función usar_asistente), que se eligen
   *           con un clic, en el orden del prototipo.
   * Entrada: Ninguna
   * Salida: Promesa con [{ id_pregunta, Pregunta }]
   */
  PreguntasFrecuentes()
  {
    return Consultar(
      `SELECT pc.id_pregunta, pc.Pregunta
         FROM PreguntasChatbot pc
         JOIN Funciones f ON f.id_funcion = pc.id_funcion
        WHERE f.Nombre_Funcion = ? AND f.Estatus = 'Activo'
        ORDER BY CAST(pc.id_pregunta AS UNSIGNED)`,
      [FUNCION_COMUN],
    );
  },

  /*
   * Función: PreguntasDelPerfil
   * Objetivo: Todas las preguntas que puede hacer un usuario según sus funciones (las comunes y
   *           las de su perfil), con sus frases de ejemplo.
   * Entrada: funciones (códigos)
   * Salida: Promesa con [{ id_pregunta, Pregunta, Frases_Ejemplo }]
   */
  PreguntasDelPerfil(funciones)
  {
    if (!funciones.length)
    {
      return Promise.resolve([]);
    }
    return Consultar(
      `SELECT pc.id_pregunta, pc.Pregunta, pc.Frases_Ejemplo
         FROM PreguntasChatbot pc
         JOIN Funciones f ON f.id_funcion = pc.id_funcion
        WHERE f.Nombre_Funcion IN (?) AND f.Estatus = 'Activo'
        ORDER BY CAST(pc.id_pregunta AS UNSIGNED)`,
      [funciones],
    );
  },

  /*
   * Función: Interpretar
   * Objetivo: Buscar con IA (embeddings) la pregunta del perfil que corresponde a un mensaje
   *           escrito y devolver su respuesta y fuente.
   * Entrada: mensaje, funciones
   * Salida: Promesa con { id_pregunta, Pregunta, Respuesta, Fuente } o null si ninguna
   *         pregunta se parece
   */
  async Interpretar(mensaje, funciones)
  {
    const preguntas = await ModeloAsistente.PreguntasDelPerfil(funciones);
    const id_pregunta = await BuscadorSemantico.ElegirPregunta(mensaje, preguntas);
    return id_pregunta ? ModeloAsistente.Responder(id_pregunta, funciones) : null;
  },

  /*
   * Función: Responder
   * Objetivo: Respuesta y fuente de una pregunta, solo si pertenece a una de las funciones del
   *           usuario.
   * Entrada: id_pregunta, funciones
   * Salida: Promesa con { id_pregunta, Pregunta, Respuesta, Fuente } o null
   */
  async Responder(id_pregunta, funciones)
  {
    if (!funciones.length)
    {
      return null;
    }
    const [respuesta] = await Consultar(
      `SELECT pc.id_pregunta, pc.Pregunta, cc.Respuesta, fc.Fuente
         FROM PreguntasChatbot pc
         JOIN Funciones f ON f.id_funcion = pc.id_funcion
         JOIN ContenidosChatbot cc ON cc.id_pregunta = pc.id_pregunta
         JOIN FuentesChatbot fc ON fc.id_fuente = cc.id_fuente
        WHERE pc.id_pregunta = ? AND f.Nombre_Funcion IN (?)
        LIMIT 1`,
      [id_pregunta, funciones],
    );
    return respuesta ?? null;
  },
};

export { ModeloAsistente };
