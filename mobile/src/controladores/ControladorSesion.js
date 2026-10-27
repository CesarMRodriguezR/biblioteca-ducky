/*
 * ******************************************************************
 * Nombre del programa: MOVIL-SESION · ControladorSesion.js
 * Función: Sesión del usuario compartida por la aplicación: restauración, inicio, cierre y
 *          permisos.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Parámetros de la ruta y acciones del usuario en la pantalla
 * Salida: Estado y acciones que consume la vista
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Hook              Objetivo
 *     ProveedorSesion   Restaurar la sesión guardada al abrir la aplicación y…
 *     useSesion         Obtener la sesión actual: usuario, carga, inicio y cierre…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado y llama al modelo.
 * (2) No devuelve JSX y no llama a la API directamente; usa los modelos de src/modelos.
 * (3) Los hooks solo se llaman en el nivel superior del componente, nunca dentro de condiciones
 *     o ciclos.
 * (4) Toda pantalla que lo use debe estar dentro de ProveedorSesion.
 * ******************************************************************
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ModeloAutenticacion } from '../modelos/ModeloAutenticacion';
import { RegistrarAlExpirarSesion } from '../modelos/ClienteApi';

const ContextoSesion = createContext(null);

/*
 * Función: ProveedorSesion
 * Objetivo: Restaurar la sesión guardada al abrir la aplicación y compartirla con las
 *           pantallas.
 * Entrada: { children }
 * Salida: Elemento de React que comparte la sesión con sus hijos
 */
export function ProveedorSesion({ children })
{
  const [usuario, SetUsuario] = useState(null);
  const [cargando, SetCargando] = useState(true);

  const CerrarSesion = useCallback(async () =>
  {
    await ModeloAutenticacion.CerrarSesion();
    SetUsuario(null);
  }, []);

  useEffect(() =>
  {
    RegistrarAlExpirarSesion(CerrarSesion);
    ModeloAutenticacion.RestaurarSesion()
      .then(SetUsuario)
      .finally(() => SetCargando(false));
  }, [CerrarSesion]);

  const IniciarSesion = useCallback(async (nombre_usuario, contrasena) =>
  {
    const sesion = await ModeloAutenticacion.IniciarSesion(nombre_usuario, contrasena);
    SetUsuario(sesion);
    return sesion;
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      IniciarSesion,
      CerrarSesion,
      Puede: (...funciones) => funciones.some((funcion) => usuario?.funciones?.includes(funcion)),
    }),
    [usuario, cargando, IniciarSesion, CerrarSesion],
  );

  return createElement(ContextoSesion.Provider, { value: valor }, children);
}

/*
 * Hook: useSesion
 * Objetivo: Obtener la sesión actual: usuario, carga, inicio y cierre de sesión y permisos.
 * Entrada: Ninguna
 * Salida: Objeto { usuario, cargando, IniciarSesion, CerrarSesion, Puede }
 */
export function useSesion()
{
  const contexto = useContext(ContextoSesion);
  if (!contexto)
  {
    throw new Error('useSesion debe usarse dentro de SesionProvider');
  }
  return contexto;
}
