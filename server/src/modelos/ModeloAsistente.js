/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 · ModeloAsistente.js
 * Función: Preguntas y respuestas del Asistente Biblio según las funciones del perfil, con la
 *          fuente (artefacto del proyecto) de cada respuesta.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Funciones del usuario e id de la pregunta
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
 *     ModeloAsistente   Acceso a las preguntas y respuestas del Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Tablas del diagrama: PreguntasChatbot, ContenidosChatbot (respuesta) y FuentesChatbot.
 * (2) Cada pregunta pertenece a una función (PreguntasChatbot.id_funcion): un perfil solo ve
 *     las preguntas de sus funciones, igual que los menús.
 * ******************************************************************
 */

import { Consultar } from '../configuracion/conexion.js';

/*
 * Módulo: ModeloAsistente
 * Objetivo: Acceso a las preguntas y respuestas del Asistente Biblio.
 */
const ModeloAsistente = {
  /*
   * Función: Preguntas
   * Objetivo: Preguntas que puede hacer un usuario según sus funciones, en el orden del
   *           prototipo.
   * Entrada: funciones (códigos)
   * Salida: Promesa con [{ id_pregunta, Pregunta }]
   */
  Preguntas(funciones)
  {
    if (!funciones.length)
    {
      return Promise.resolve([]);
    }
    return Consultar(
      `SELECT pc.id_pregunta, pc.Pregunta
         FROM PreguntasChatbot pc
         JOIN Funciones f ON f.id_funcion = pc.id_funcion
        WHERE f.Nombre_Funcion IN (?) AND f.Estatus = 'Activo'
        ORDER BY CAST(pc.id_pregunta AS UNSIGNED)`,
      [funciones],
    );
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
