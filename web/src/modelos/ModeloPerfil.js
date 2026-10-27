/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ModeloPerfil.js
 * Función: Perfiles (roles), funciones disponibles y su asignación.
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
 *     Módulo         Objetivo
 *     ModeloPerfil   Acceso a perfiles y funciones
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: acceso a la API y reglas del dominio. No contiene JSX.
 * (2) Las peticiones pasan por ClienteApi, que agrega el token de sesión y convierte los
 *     errores en ErrorApi.
 * (3) La API debe ejecutarse en el puerto 3000; Vite redirige /api en desarrollo.
 * ******************************************************************
 */

import { ClienteApi } from './ClienteApi.js';

/*
 * Módulo: ModeloPerfil
 * Objetivo: Acceso a perfiles y funciones.
 */
export const ModeloPerfil = {
  /*
   * Función: Listar
   * Objetivo: Pedir los perfiles con sus funciones.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  Listar()
  {
    return ClienteApi.Obtener('/perfiles');
  },

  /*
   * Función: ListarFunciones
   * Objetivo: Pedir las funciones disponibles.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  ListarFunciones()
  {
    return ClienteApi.Obtener('/funciones', { limit: 200 });
  },

  /*
   * Función: AsignarFunciones
   * Objetivo: Guardar las funciones de un perfil.
   * Entrada: id_perfil, funciones
   * Salida: Promesa con la respuesta de la API
   */
  AsignarFunciones(id_perfil, funciones)
  {
    return ClienteApi.Reemplazar(`/perfiles/${id_perfil}/funciones`, { funciones });
  },
};
