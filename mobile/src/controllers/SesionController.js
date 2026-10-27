import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthModel } from '../models/AuthModel';
import { onSesionExpirada } from '../models/apiClient';

const SesionContext = createContext(null);

/**
 * Controlador de sesión: restaura la sesión guardada al abrir la app y
 * expone el usuario y sus funciones a las pantallas.
 */
export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesion = useCallback(async () => {
    await AuthModel.cerrarSesion();
    setUsuario(null);
  }, []);

  useEffect(() => {
    onSesionExpirada(cerrarSesion);
    AuthModel.restaurarSesion()
      .then(setUsuario)
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

  return createElement(SesionContext.Provider, { value: valor }, children);
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return contexto;
}
