/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 y CB02 · ModeloAsistente.js
 * Función: Preguntas y respuestas del Asistente Biblio.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Pregunta elegida o mensaje escrito
 * Salida: Respuestas de la API
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     ModeloAsistente   Acceso a las preguntas del Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: acceso a la API. No contiene JSX.
 * (2) Preguntas() entrega las preguntas frecuentes (comunes a todos); las de cada perfil se
 *     responden con Conversar() cuando el usuario las escribe.
 * ******************************************************************
 */

import { ClienteApi } from './ClienteApi.js';

/*
 * Módulo: ModeloAsistente
 * Objetivo: Acceso a las preguntas del Asistente Biblio.
 */
export const ModeloAsistente = {
  /*
   * Función: Preguntas
   * Objetivo: Pedir las preguntas frecuentes, comunes a todos los perfiles.
   * Entrada: Ninguna
   * Salida: Promesa con [{ id_pregunta, Pregunta }]
   */
  Preguntas()
  {
    return ClienteApi.Obtener('/asistente/preguntas');
  },

  /*
   * Función: Responder
   * Objetivo: Pedir la respuesta y la fuente de una pregunta.
   * Entrada: id_pregunta
   * Salida: Promesa con { id_pregunta, Pregunta, Respuesta, Fuente }
   */
  Responder(id_pregunta)
  {
    return ClienteApi.Obtener(`/asistente/preguntas/${id_pregunta}`);
  },

  /*
   * Función: Conversar
   * Objetivo: Enviar una pregunta escrita; la API busca con IA una pregunta parecida del perfil.
   * Entrada: mensaje
   * Salida: Promesa con { encontrada, id_pregunta, Pregunta, Respuesta, Fuente } o
   *         { encontrada: false, Respuesta }
   */
  Conversar(mensaje)
  {
    return ClienteApi.Enviar('/asistente/mensajes', { mensaje });
  },
};
