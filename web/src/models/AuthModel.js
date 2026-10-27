import { api, tokenStore } from './apiClient';

/** Sesión del usuario: inicio, cierre y datos del perfil. */
export const AuthModel = {
  async iniciarSesion(usuario, contrasena) {
    const { token, usuario: sesion } = await api.post('/auth/login', {
      Nombre_Usuario: usuario.trim(),
      Contrasena_Usuario: contrasena,
    });
    tokenStore.guardar(token);
    return sesion;
  },

  cerrarSesion() {
    tokenStore.borrar();
  },

  tieneSesion() {
    return Boolean(tokenStore.leer());
  },

  obtenerSesion() {
    return api.get('/auth/me');
  },
};

/** Ruta de inicio según las funciones del perfil. */
export function rutaInicial(usuario) {
  const f = usuario?.funciones ?? [];
  if (f.includes('gestionar_usuarios')) return '/panel';
  if (f.includes('gestionar_libros')) return '/libros';
  return '/catalogo';
}
