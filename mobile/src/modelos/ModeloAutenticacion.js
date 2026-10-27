/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU01 · ModeloAutenticacion.js
 * Función: Inicio, restauración y cierre de sesión.
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
 *     Módulo                Objetivo
 *     ModeloAutenticacion   Sesión del usuario en el teléfono: inicio, restauración y…
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

import { ClienteApi, AlmacenToken } from './ClienteApi';

/*
 * Módulo: ModeloAutenticacion
 * Objetivo: Sesión del usuario en el teléfono: inicio, restauración y cierre.
 */
export const ModeloAutenticacion = {
  /*
   * Función: IniciarSesion
   * Objetivo: Iniciar sesión y guardar el token.
   * Entrada: usuario, contrasena
   * Salida: Promesa con los datos de la sesión
   */
  async IniciarSesion(usuario, contrasena)
  {
    const { token, usuario: sesion } = await ClienteApi.Enviar('/auth/login', {
      Nombre_Usuario: usuario.trim(),
      Contrasena_Usuario: contrasena,
    });
    await AlmacenToken.Guardar(token);
    return sesion;
  },

  /*
   * Función: RestaurarSesion
   * Objetivo: Recupera la sesión guardada al abrir la app (null si no hay o venció).
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  async RestaurarSesion()
  {
    const token = await AlmacenToken.Cargar();
    if (!token)
    {
      return null;
    }
    try
    {
      return await ClienteApi.Obtener('/auth/me');
    }
    catch
    {
      await AlmacenToken.Borrar();
      return null;
    }
  },

  /*
   * Función: CerrarSesion
   * Objetivo: Borrar el token de sesión.
   * Entrada: Ninguna
   * Salida: Promesa sin valor
   */
  CerrarSesion()
  {
    return AlmacenToken.Borrar();
  },
};
