/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU01 · ModeloAutenticacion.js
 * Función: Inicio y cierre de sesión, y ruta inicial según las funciones del perfil.
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
 *     ModeloAutenticacion   Sesión del usuario: inicio, cierre y datos del perfil
 *     RutaInicial           Ruta de inicio según las funciones del perfil
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

import { ClienteApi, AlmacenToken } from './ClienteApi.js';

/*
 * Módulo: ModeloAutenticacion
 * Objetivo: Sesión del usuario: inicio, cierre y datos del perfil.
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
    AlmacenToken.Guardar(token);
    return sesion;
  },

  /*
   * Función: CerrarSesion
   * Objetivo: Borrar el token de sesión.
   * Entrada: Ninguna
   * Salida: Ninguna
   */
  CerrarSesion()
  {
    AlmacenToken.Borrar();
  },

  /*
   * Función: TieneSesion
   * Objetivo: Indicar si hay un token guardado.
   * Entrada: Ninguna
   * Salida: true o false
   */
  TieneSesion()
  {
    return Boolean(AlmacenToken.Leer());
  },

  /*
   * Función: ObtenerSesion
   * Objetivo: Pedir los datos de la sesión actual.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  ObtenerSesion()
  {
    return ClienteApi.Obtener('/auth/me');
  },
};

/*
 * Función: RutaInicial
 * Objetivo: Ruta de inicio según las funciones del perfil.
 * Entrada: usuario
 * Salida: Ruta (/panel, /libros o /catalogo)
 */
export function RutaInicial(usuario)
{
  const fila = usuario?.funciones ?? [];
  if (fila.includes('gestionar_usuarios'))
  {
    return '/panel';
  }
  if (fila.includes('gestionar_libros'))
  {
    return '/libros';
  }
  return '/catalogo';
}
