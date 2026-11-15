/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 · ControladorAsistente.js
 * Función: Controlador del Asistente Biblio: saludo según el perfil, preguntas disponibles y
 *          conversación con las respuestas y su fuente.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Pregunta elegida por el usuario
 * Salida: Estado y acciones para la vista
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Hook                      Objetivo
 *     TemasDelPerfil            Temas que el asistente puede resolver según las funciones
 *     useControladorAsistente   BD-SP04-CB01 Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no devuelve JSX; la vista es PaginaAsistente.
 * (2) Las preguntas las entrega la API según las funciones del perfil; las que ya se hicieron
 *     dejan de mostrarse como opción.
 * ******************************************************************
 */

import { useState } from 'react';
import { useSesion } from './ControladorSesion.jsx';
import { useCarga } from './HooksAsincronos.js';
import { ModeloAsistente } from '../modelos/ModeloAsistente.js';

/*
 * Función: TemasDelPerfil
 * Objetivo: Temas que el asistente puede resolver según las funciones del perfil.
 * Entrada: Puede (función de la sesión)
 * Salida: Texto como «el objetivo, el alcance y las plataformas de Biblio y la búsqueda de
 *         libros»
 */
function TemasDelPerfil(Puede)
{
  const temas = ['la búsqueda de libros'];
  if (Puede('prestar_libros'))
  {
    temas.push('los préstamos');
  }
  if (Puede('devolver_libros'))
  {
    temas.push('las devoluciones');
  }
  if (Puede('gestionar_usuarios') || Puede('gestionar_libros'))
  {
    temas.push('la gestión de usuarios y libros');
  }
  const ultimo = temas.pop();
  const lista = temas.length ? `${temas.join(', ')} y ${ultimo}` : ultimo;
  return `el objetivo, el alcance y las plataformas de Biblio, ${lista}`;
}

/*
 * Hook: useControladorAsistente
 * Objetivo: BD-SP04-CB01 Asistente Biblio: saludo, preguntas por perfil y respuestas con su
 *           fuente.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorAsistente()
{
  const { usuario, Puede } = useSesion();
  const { datos: preguntas, error, cargando } = useCarga(() => ModeloAsistente.Preguntas(), []);
  const [conversacion, SetConversacion] = useState([]);
  const [respondiendo, SetRespondiendo] = useState(false);
  const [error_respuesta, SetErrorRespuesta] = useState(null);

  async function Preguntar(pregunta)
  {
    SetRespondiendo(true);
    SetErrorRespuesta(null);
    try
    {
      const respuesta = await ModeloAsistente.Responder(pregunta.id_pregunta);
      SetConversacion((previa) => [...previa, respuesta]);
    }
    catch (excepcion)
    {
      SetErrorRespuesta(excepcion);
    }
    finally
    {
      SetRespondiendo(false);
    }
  }

  const hechas = new Set(conversacion.map((respuesta) => respuesta.id_pregunta));
  return {
    saludo:
      `¡Hola, ${usuario.Nombre_Completo.split(' ')[0]}! Soy el Asistente Biblio. Puedo resolver ` +
      `tus dudas sobre ${TemasDelPerfil(Puede)}. Elige una de las preguntas de abajo.`,
    disponibles: (preguntas ?? []).filter((pregunta) => !hechas.has(pregunta.id_pregunta)),
    conversacion,
    error: error ?? error_respuesta,
    cargando,
    respondiendo,
    Preguntar,
  };
}
