/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-BL01 · ModeloLibro.js
 * Función: Búsqueda, novedades y ficha de los libros del catálogo.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos de las pantallas
 * Salida: Respuestas de la API o datos con formato para mostrar
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo        Objetivo
 *     ModeloLibro   Catálogo de libros (solo lectura en la app móvil)
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: acceso a la API y reglas del dominio. No contiene JSX.
 * (2) Las peticiones pasan por ClienteApi, que agrega el token guardado en SecureStore y
 *     convierte los errores en ErrorApi.
 * (3) La dirección de la API se toma de EXPO_PUBLIC_API_URL (archivo .env); en el teléfono debe
 *     ser la IP de la computadora.
 * ******************************************************************
 */

import { ClienteApi } from './ClienteApi';

/*
 * Módulo: ModeloLibro
 * Objetivo: Catálogo de libros (solo lectura en la app móvil).
 */
export const ModeloLibro = {
  /*
   * Función: Buscar
   * Objetivo: Buscar libros por campo y página; la API ordena por el campo del filtro.
   * Entrada: { q, campo?, pagina?, por_pagina? } (opcional)
   * Salida: Promesa con { total, datos }
   */
  Buscar({
    q: texto_busqueda,
    campo = 'todos',
    pagina = 1,
    por_pagina = 6,
  } = {})
  {
    return ClienteApi.Obtener('/libros', {
      q: texto_busqueda,
      campo,
      limit: por_pagina,
      offset: (pagina - 1) * por_pagina,
    });
  },

  /*
   * Función: Recomendados
   * Objetivo: "Recomendados" de la pantalla de inicio: los títulos con más copias disponibles.
   * Entrada: cantidad (opcional)
   * Salida: Promesa con la respuesta de la API
   */
  Recomendados(cantidad = 5)
  {
    return ClienteApi.Obtener('/libros', { orden: 'disponibles', limit: cantidad, offset: 0 });
  },

  /*
   * Función: Obtener
   * Objetivo: Pedir la ficha de un libro con sus copias.
   * Entrada: id
   * Salida: Promesa con la respuesta de la API
   */
  Obtener(id)
  {
    return ClienteApi.Obtener(`/libros/${id}`);
  },
};
