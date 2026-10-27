import { api, tokenStore } from './apiClient';

/** Sesión del usuario en el teléfono: inicio, restauración y cierre. */
export const AuthModel = {
  async iniciarSesion(usuario, contrasena) {
    const { token, usuario: sesion } = await api.post('/auth/login', {
      Nombre_Usuario: usuario.trim(),
      Contrasena_Usuario: contrasena,
    });
    await tokenStore.guardar(token);
    return sesion;
  },

  /** Recupera la sesión guardada al abrir la app (null si no hay o venció). */
  async restaurarSesion() {
    const token = await tokenStore.cargar();
    if (!token) return null;
    try {
      return await api.get('/auth/me');
    } catch {
      await tokenStore.borrar();
      return null;
    }
  },

  cerrarSesion() {
    return tokenStore.borrar();
  },
};
