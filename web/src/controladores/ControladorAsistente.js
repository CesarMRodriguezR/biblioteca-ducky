/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 · ControladorAsistente.js
 * Función: Controlador del Asistente Biblio: saludo según el perfil, preguntas frecuentes,
 *          preguntas escritas y conversación con las respuestas y su fuente.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Pregunta elegida o escrita por el usuario
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
 * (2) Las preguntas frecuentes (comunes a todos) se eligen con un clic y, ya respondidas, dejan
 *     de mostrarse; las de cada perfil se escriben y la API las interpreta con IA.
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
 * Objetivo: BD-SP04-CB01 Asistente Biblio: saludo, preguntas frecuentes, preguntas escritas y
 *           respuestas con su fuente.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorAsistente()
{
  const { usuario, Puede } = useSesion();
  const { datos: preguntas, error, cargando } = useCarga(() => ModeloAsistente.Preguntas(), []);
  const [conversacion, SetConversacion] = useState([]);
  const [mensaje, SetMensaje] = useState('');
  const [respondiendo, SetRespondiendo] = useState(false);
  const [error_respuesta, SetErrorRespuesta] = useState(null);

  /*
   * Función: Responder
   * Objetivo: Pedir una respuesta y agregarla a la conversación con el texto del usuario.
   * Entrada: texto_usuario, pedir (función que devuelve la promesa de la respuesta)
   * Salida: Promesa con true si se respondió
   */
  async function Responder(texto_usuario, pedir)
  {
    SetRespondiendo(true);
    SetErrorRespuesta(null);
    try
    {
      const respuesta = await pedir();
      SetConversacion((previa) => [
        ...previa,
        { clave: previa.length, texto_usuario, ...respuesta },
      ]);
      return true;
    }
    catch (excepcion)
    {
      SetErrorRespuesta(excepcion);
      return false;
    }
    finally
    {
      SetRespondiendo(false);
    }
  }

  function Preguntar(pregunta)
  {
    return Responder(pregunta.Pregunta, () => ModeloAsistente.Responder(pregunta.id_pregunta));
  }

  async function EnviarMensaje(evento)
  {
    evento.preventDefault();
    const texto = mensaje.trim();
    if (!texto || respondiendo)
    {
      return;
    }
    if (await Responder(texto, () => ModeloAsistente.Conversar(texto)))
    {
      SetMensaje('');
    }
  }

  const hechas = new Set(conversacion.map((respuesta) => respuesta.id_pregunta));
  return {
    saludo:
      `¡Hola, ${usuario.Nombre_Completo.split(' ')[0]}! Soy el Asistente Biblio. Puedo resolver ` +
      `tus dudas sobre ${TemasDelPerfil(Puede)}. Elige una pregunta frecuente o escríbeme tu ` +
      'duda.',
    disponibles: (preguntas ?? []).filter((pregunta) => !hechas.has(pregunta.id_pregunta)),
    conversacion,
    mensaje,
    error: error ?? error_respuesta,
    cargando,
    respondiendo,
    SetMensaje,
    Preguntar,
    EnviarMensaje,
  };
}
