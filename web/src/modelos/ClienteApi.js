/*
 * ******************************************************************
 * Nombre del programa: WEB-CLIENTE-API · ClienteApi.js
 * Función: Cliente HTTP de la API: agrega el token de sesión y convierte los errores en
 *          ErrorApi.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Ruta, parámetros y cuerpo de cada petición
 * Salida: Respuesta JSON o archivo
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                     Objetivo
 *     BASE_URL                   Dirección base de la API
 *     CLAVE_TOKEN                Clave del token de sesión en localStorage
 *     ErrorApi                   Error de la API con su código HTTP, mensaje y detalles
 *     AlExpirarSesion            Acción a ejecutar cuando la API responde 401 con una…
 *     AlmacenToken               Leer, guardar y borrar el token de sesión en localStorage
 *     RegistrarAlExpirarSesion   Permite al controlador de sesión reaccionar a un 401…
 *     ConstruirUrl               Armar la URL con los parámetros de consulta que tengan valor
 *     Solicitar                  Hacer la petición HTTP con el token y convertir los…
 *     ClienteApi                 Métodos HTTP que usan los modelos
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

/*
 * Constante: BASE_URL
 * Objetivo: Dirección base de la API.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
/*
 * Constante: CLAVE_TOKEN
 * Objetivo: Clave del token de sesión en localStorage.
 */
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
    this.name = 'ErrorApi';
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

  /*
   * Función: codigo
   * Objetivo: Código de la regla de negocio que falló (p. ej. ISBN_DUPLICADO).
   * Entrada: Ninguna
   * Salida: Texto o undefined
   */
  get codigo()
  {
    return this.detalles && !Array.isArray(this.detalles) ? this.detalles.codigo : undefined;
  }
}

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
 * Objetivo: Leer, guardar y borrar el token de sesión en localStorage.
 */
export const AlmacenToken = {
  /*
   * Función: Leer
   * Objetivo: Leer el token guardado.
   * Entrada: Ninguna
   * Salida: Token o null
   */
  Leer: () =>
  {
    try
    {
      return localStorage.getItem(CLAVE_TOKEN);
    }
    catch
    {
      return null;
    }
  },
  /*
   * Función: Guardar
   * Objetivo: Guardar el token de sesión.
   * Entrada: token
   * Salida: Ninguna
   */
  Guardar: (token) =>
  {
    try
    {
      localStorage.setItem(CLAVE_TOKEN, token);
    }
    catch
    {
      /* sin almacenamiento */
    }
  },
  /*
   * Función: Borrar
   * Objetivo: Borrar el token de sesión.
   * Entrada: Ninguna
   * Salida: Ninguna
   */
  Borrar: () =>
  {
    try
    {
      localStorage.removeItem(CLAVE_TOKEN);
    }
    catch
    {
      /* sin almacenamiento */
    }
  },
};

/*
 * Función: RegistrarAlExpirarSesion
 * Objetivo: Permite al controlador de sesión reaccionar a un 401 (sesión vencida).
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
  const query = new URLSearchParams(
    Object.entries(parametros).filter(
      ([, valor]) => valor !== undefined && valor !== null && valor !== '',
    ),
  ).toString();
  return query ? `${direccion}?${query}` : direccion;
}

/*
 * Función: Solicitar
 * Objetivo: Hacer la petición HTTP con el token y convertir los errores en ErrorApi.
 * Entrada: metodo, ruta, { body, params, comoBlob? } (opcional)
 * Salida: Promesa con el JSON, el archivo o null (204)
 */
async function Solicitar(
  metodo,
  ruta,
  { body: cuerpo, params: parametros, comoBlob: como_blob = false } = {},
)
{
  const token = AlmacenToken.Leer();
  let respuesta;
  try
  {
    respuesta = await fetch(ConstruirUrl(ruta, parametros), {
      method: metodo,
      headers: {
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
  if (como_blob)
  {
    return respuesta.blob();
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
   * Función: ObtenerArchivo
   * Objetivo: Petición GET que devuelve un archivo.
   * Entrada: ruta, parametros
   * Salida: Promesa con el Blob
   */
  ObtenerArchivo: (ruta, parametros) =>
    Solicitar('GET', ruta, { params: parametros, comoBlob: true }),
  /*
   * Función: Enviar
   * Objetivo: Petición POST.
   * Entrada: ruta, cuerpo (opcional)
   * Salida: Promesa con la respuesta de la API
   */
  Enviar: (ruta, cuerpo = {}) => Solicitar('POST', ruta, { body: cuerpo }),
  /*
   * Función: Reemplazar
   * Objetivo: Petición PUT.
   * Entrada: ruta, cuerpo (opcional)
   * Salida: Promesa con la respuesta de la API
   */
  Reemplazar: (ruta, cuerpo = {}) => Solicitar('PUT', ruta, { body: cuerpo }),
  /*
   * Función: Modificar
   * Objetivo: Petición PATCH.
   * Entrada: ruta, cuerpo (opcional)
   * Salida: Promesa con la respuesta de la API
   */
  Modificar: (ruta, cuerpo = {}) => Solicitar('PATCH', ruta, { body: cuerpo }),
  /*
   * Función: Eliminar
   * Objetivo: Petición DELETE.
   * Entrada: ruta
   * Salida: Promesa con la respuesta de la API
   */
  Eliminar: (ruta) => Solicitar('DELETE', ruta),
};
