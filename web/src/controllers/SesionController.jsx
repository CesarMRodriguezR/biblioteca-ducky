import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthModel } from '../models/AuthModel';
import { onSesionExpirada } from '../models/apiClient';

const SesionContext = createContext(null);

/**
 * Controlador de sesión: guarda el usuario autenticado y sus funciones
 * para que las vistas decidan qué mostrar y qué rutas permitir.
 */
export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(AuthModel.tieneSesion());

  const cerrarSesion = useCallback(() => {
    AuthModel.cerrarSesion();
    setUsuario(null);
  }, []);

  useEffect(() => {
    onSesionExpirada(cerrarSesion);
    if (!AuthModel.tieneSesion()) return;
    AuthModel.obtenerSesion()
      .then(setUsuario)
      .catch(cerrarSesion)
      .finally(() => setCargando(false));
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (nombreUsuario, contrasena) => {
    const sesion = await AuthModel.iniciarSesion(nombreUsuario, contrasena);
    setUsuario(sesion);
    return sesion;
  }, []);

  const valor = useMemo(() => ({
    usuario,
    cargando,
    iniciarSesion,
    cerrarSesion,
    puede: (...funciones) => funciones.some((f) => usuario?.funciones?.includes(f)),
  }), [usuario, cargando, iniciarSesion, cerrarSesion]);

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return contexto;
}
