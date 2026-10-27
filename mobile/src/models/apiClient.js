import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cliente HTTP de la API (la misma que usa la versión web). Guarda el
 * token en el almacenamiento seguro del teléfono y convierte los errores
 * en ApiError con el mensaje que devuelve el servidor.
 */
const URL_POR_DEFECTO = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || URL_POR_DEFECTO;
const CLAVE_TOKEN = 'biblio.token';

export class ApiError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }

  /** Errores de validación como { campo: mensaje }. */
  get errores() {
    if (!Array.isArray(this.detalles)) return {};
    return Object.fromEntries(this.detalles.map((d) => [d.campo, d.mensaje]));
  }
}

/** En web (expo start --web) SecureStore no existe; se usa localStorage. */
const almacen = Platform.OS === 'web'
  ? {
    getItemAsync: async (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    setItemAsync: async (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
    deleteItemAsync: async (k) => { try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ } },
  }
  : SecureStore;

let tokenEnMemoria = null;
let alExpirarSesion = () => {};

export const tokenStore = {
  async cargar() {
    tokenEnMemoria = await almacen.getItemAsync(CLAVE_TOKEN);
    return tokenEnMemoria;
  },
  async guardar(token) {
    tokenEnMemoria = token;
    await almacen.setItemAsync(CLAVE_TOKEN, token);
  },
  async borrar() {
    tokenEnMemoria = null;
    await almacen.deleteItemAsync(CLAVE_TOKEN);
  },
  leer: () => tokenEnMemoria,
};

export function onSesionExpirada(callback) {
  alExpirarSesion = callback;
}

function construirUrl(ruta, params) {
  const url = `${BASE_URL}${ruta}`;
  if (!params) return url;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `${url}?${query}` : url;
}

async function solicitar(metodo, ruta, { body, params } = {}) {
  const token = tokenStore.leer();
  let respuesta;
  try {
    respuesta = await fetch(construirUrl(ruta, params), {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (respuesta.status === 401 && token && ruta !== '/auth/login') alExpirarSesion();
  if (!respuesta.ok) {
    let datos = {};
    try { datos = await respuesta.json(); } catch { /* sin cuerpo */ }
    throw new ApiError(respuesta.status, datos.error || 'Ocurrió un error inesperado.', datos.detalles);
  }
  if (respuesta.status === 204) return null;
  return respuesta.json();
}

export const api = {
  get: (ruta, params) => solicitar('GET', ruta, { params }),
  post: (ruta, body = {}) => solicitar('POST', ruta, { body }),
};
