/**
 * Cliente HTTP de la API. Todos los modelos lo usan para hablar con el
 * servidor; agrega el token de sesión y convierte los errores en ApiError.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
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

  get codigo() {
    return this.detalles && !Array.isArray(this.detalles) ? this.detalles.codigo : undefined;
  }
}

let alExpirarSesion = () => {};

export const tokenStore = {
  leer: () => {
    try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
  },
  guardar: (token) => {
    try { localStorage.setItem(CLAVE_TOKEN, token); } catch { /* sin almacenamiento */ }
  },
  borrar: () => {
    try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* sin almacenamiento */ }
  },
};

/** Permite al controlador de sesión reaccionar a un 401 (sesión vencida). */
export function onSesionExpirada(callback) {
  alExpirarSesion = callback;
}

function construirUrl(ruta, params) {
  const url = `${BASE_URL}${ruta}`;
  if (!params) return url;
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return query ? `${url}?${query}` : url;
}

async function solicitar(metodo, ruta, { body, params, comoBlob = false } = {}) {
  const token = tokenStore.leer();
  let respuesta;
  try {
    respuesta = await fetch(construirUrl(ruta, params), {
      method: metodo,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (respuesta.status === 401 && token && ruta !== '/auth/login') {
    alExpirarSesion();
  }
  if (!respuesta.ok) {
    let datos = {};
    try { datos = await respuesta.json(); } catch { /* sin cuerpo */ }
    throw new ApiError(respuesta.status, datos.error || 'Ocurrió un error inesperado.', datos.detalles);
  }
  if (comoBlob) return respuesta.blob();
  if (respuesta.status === 204) return null;
  return respuesta.json();
}

export const api = {
  get: (ruta, params) => solicitar('GET', ruta, { params }),
  getBlob: (ruta, params) => solicitar('GET', ruta, { params, comoBlob: true }),
  post: (ruta, body = {}) => solicitar('POST', ruta, { body }),
  put: (ruta, body = {}) => solicitar('PUT', ruta, { body }),
  patch: (ruta, body = {}) => solicitar('PATCH', ruta, { body }),
  delete: (ruta) => solicitar('DELETE', ruta),
};
