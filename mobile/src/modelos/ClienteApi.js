/*
 * ******************************************************************
 * Nombre del programa: MOVIL-CLIENTE-API · ClienteApi.js
 * Función: Cliente HTTP de la API: guarda el token en SecureStore y convierte los errores en
 *          ErrorApi.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Ruta, parámetros y cuerpo de cada petición
 * Salida: Respuesta JSON
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                     Objetivo
 *     ErrorApi                   Error de la API con su código HTTP, mensaje y detalles
 *     AlExpirarSesion            Acción a ejecutar cuando la API responde 401 con una…
 *     AlmacenToken               Leer, guardar y borrar el token de sesión en SecureStore…
 *     RegistrarAlExpirarSesion   Registrar la acción que se ejecuta cuando la sesión vence
 *     ConstruirUrl               Armar la URL con los parámetros de consulta que tengan valor
 *     Solicitar                  Hacer la petición HTTP con el token y convertir los…
 *     ClienteApi                 Métodos HTTP que usan los modelos
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

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cliente HTTP de la API (la misma que usa la versión web). Guarda el
 * token en el almacenamiento seguro del teléfono y convierte los errores
 * en ApiError con el mensaje que devuelve el servidor.
 */
const URL_POR_DEFECTO =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || URL_POR_DEFECTO;
const CLAVE_TOKEN = 'biblio.token';

/*
 * Clase: ErrorApi
 * Objetivo: Error de la API con su código HTTP, mensaje y detalles.
 */
export class ErrorApi extends Error
{
  /*
   * Función: ErrorApi.constructor
   * Objetivo: Crear el error con el código y los detalles de la respuesta.
   * Entrada: estado_http, mensaje, detalles
   * Salida: Instancia de ErrorApi
   */
  constructor(estado_http, mensaje, detalles)
  {
    super(mensaje);
    this.name = 'ApiError';
    this.status = estado_http;
    this.detalles = detalles;
  }

  /*
   * Función: errores
   * Objetivo: Errores de validación como { campo: mensaje }.
   * Entrada: Ninguna
   * Salida: Objeto con los errores por campo
   */
  get errores()
  {
    if (!Array.isArray(this.detalles))
    {
      return {};
    }
    return Object.fromEntries(this.detalles.map((detalle) => [detalle.campo, detalle.mensaje]));
  }
}

/** En web (expo start --web) SecureStore no existe; se usa localStorage. */
const almacen =
  Platform.OS === 'web'
    ? {
      getItemAsync: async (clave) =>
      {
        try
        {
          return localStorage.getItem(clave);
        }
        catch
        {
          return null;
        }
      },
      setItemAsync: async (clave, valor) =>
      {
        try
        {
          localStorage.setItem(clave, valor);
        }
        catch
        {
          /* sin almacenamiento */
        }
      },
      deleteItemAsync: async (clave) =>
      {
        try
        {
          localStorage.removeItem(clave);
        }
        catch
        {
          /* sin almacenamiento */
        }
      },
    }
    : SecureStore;

let token_en_memoria = null;
/*
 * Función: AlExpirarSesion
 * Objetivo: Acción a ejecutar cuando la API responde 401 con una sesión vencida.
 * Entrada: Ninguna
 * Salida: Ninguna
 */
let AlExpirarSesion = () =>
{};

/*
 * Módulo: AlmacenToken
 * Objetivo: Leer, guardar y borrar el token de sesión en SecureStore (localStorage en web).
 */
export const AlmacenToken = {
  /*
   * Función: Cargar
   * Objetivo: Leer el token guardado al abrir la aplicación.
   * Entrada: Ninguna
   * Salida: Promesa con el token o null
   */
  async Cargar()
  {
    token_en_memoria = await almacen.getItemAsync(CLAVE_TOKEN);
    return token_en_memoria;
  },
  /*
   * Función: Guardar
   * Objetivo: Guardar el token de sesión.
   * Entrada: token
   * Salida: Promesa sin valor
   */
  async Guardar(token)
  {
    token_en_memoria = token;
    await almacen.setItemAsync(CLAVE_TOKEN, token);
  },
  /*
   * Función: Borrar
   * Objetivo: Borrar el token de sesión.
   * Entrada: Ninguna
   * Salida: Promesa sin valor
   */
  async Borrar()
  {
    token_en_memoria = null;
    await almacen.deleteItemAsync(CLAVE_TOKEN);
  },
  /*
   * Función: Leer
   * Objetivo: Leer el token que está en memoria.
   * Entrada: Ninguna
   * Salida: Token o null
   */
  Leer: () => token_en_memoria,
};

/*
 * Función: RegistrarAlExpirarSesion
 * Objetivo: Registrar la acción que se ejecuta cuando la sesión vence.
 * Entrada: callback
 * Salida: Ninguna
 */
export function RegistrarAlExpirarSesion(callback)
{
  AlExpirarSesion = callback;
}

/*
 * Función: ConstruirUrl
 * Objetivo: Armar la URL con los parámetros de consulta que tengan valor.
 * Entrada: ruta, parametros
 * Salida: Texto con la URL
 */
function ConstruirUrl(ruta, parametros)
{
  const direccion = `${BASE_URL}${ruta}`;
  if (!parametros)
  {
    return direccion;
  }
  const query = Object.entries(parametros)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}`)
    .join('&');
  return query ? `${direccion}?${query}` : direccion;
}

/*
 * Función: Solicitar
 * Objetivo: Hacer la petición HTTP con el token y convertir los errores en ErrorApi.
 * Entrada: metodo, ruta, { body, params } (opcional)
 * Salida: Promesa con el JSON o null (204)
 */
async function Solicitar(metodo, ruta, { body: cuerpo, params: parametros } = {})
{
  const token = AlmacenToken.Leer();
  let respuesta;
  try
  {
    respuesta = await fetch(ConstruirUrl(ruta, parametros), {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  }
  catch
  {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (respuesta.status === 401 && token && ruta !== '/auth/login')
  {
    AlExpirarSesion();
  }
  if (!respuesta.ok)
  {
    let datos = {};
    try
    {
      datos = await respuesta.json();
    }
    catch
    {
      /* sin cuerpo */
    }
    throw new ErrorApi(
      respuesta.status,
      datos.error || 'Ocurrió un error inesperado.',
      datos.detalles,
    );
  }
  if (respuesta.status === 204)
  {
    return null;
  }
  return respuesta.json();
}

/*
 * Módulo: ClienteApi
 * Objetivo: Métodos HTTP que usan los modelos.
 */
export const ClienteApi = {
  /*
   * Función: Obtener
   * Objetivo: Petición GET.
   * Entrada: ruta, parametros
   * Salida: Promesa con la respuesta de la API
   */
  Obtener: (ruta, parametros) => Solicitar('GET', ruta, { params: parametros }),
  /*
   * Función: Enviar
   * Objetivo: Petición POST.
   * Entrada: ruta, cuerpo (opcional)
   * Salida: Promesa con la respuesta de la API
   */
  Enviar: (ruta, cuerpo = {}) => Solicitar('POST', ruta, { body: cuerpo }),
};
