/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 · ModeloAsistente.js
 * Función: Preguntas y respuestas del Asistente Biblio.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Pregunta elegida
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
 * (2) La API solo entrega las preguntas de las funciones del perfil de la sesión.
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
   * Objetivo: Pedir las preguntas disponibles para el perfil.
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
};
