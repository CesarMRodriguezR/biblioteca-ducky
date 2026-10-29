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
 *     FUNCIONES_POR_SECCION Funciones que pide cada sección de la aplicación
 *     PuedeVisitar          Indicar si el perfil puede entrar a una ruta
 *     RutaTrasIniciarSesion A dónde llevar al usuario después de iniciar sesión
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

/*
 * Constante: FUNCIONES_POR_SECCION
 * Objetivo: Funciones que pide cada sección de la aplicación (las mismas que exige
 *           rutas/RutasAplicacion.jsx). Basta con tener una de ellas.
 */
export const FUNCIONES_POR_SECCION = {
  panel: ['gestionar_usuarios'],
  usuarios: ['gestionar_usuarios'],
  libros: ['gestionar_libros'],
  catalogo: ['buscar_libros', 'gestionar_libros'],
};

/*
 * Función: PuedeVisitar
 * Objetivo: Indicar si el perfil del usuario puede entrar a una ruta según su sección.
 * Entrada: ruta (p. ej. /usuarios/2/editar), usuario
 * Salida: true o false (false si la sección no existe)
 */
export function PuedeVisitar(ruta, usuario)
{
  const seccion = String(ruta).split(/[/?#]/)[1];
  const requeridas = FUNCIONES_POR_SECCION[seccion];
  return Boolean(requeridas?.some((funcion) => usuario?.funciones?.includes(funcion)));
}

/*
 * Función: RutaTrasIniciarSesion
 * Objetivo: A dónde llevar al usuario después de iniciar sesión: a la pantalla que intentaba
 *           abrir (desde) solo si su perfil puede verla; si no, a su ruta de inicio.
 * Entrada: usuario, desde (opcional)
 * Salida: Ruta
 */
export function RutaTrasIniciarSesion(usuario, desde)
{
  return desde && PuedeVisitar(desde, usuario) ? desde : RutaInicial(usuario);
}
