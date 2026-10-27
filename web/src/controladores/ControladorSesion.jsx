/*
 * ******************************************************************
 * Nombre del programa: WEB-SESION · ControladorSesion.jsx
 * Función: Sesión del usuario compartida por toda la aplicación: inicio, cierre y permisos.
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
 *     ContextoSesion    Contexto de React que comparte la sesión con las pantallas
 *     ProveedorSesion   Controlador de sesión: guarda el usuario autenticado y…
 *     useSesion         Obtener la sesión actual: usuario, carga, inicio y cierre…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado, valida y llama al
 *     modelo.
 * (2) No devuelve JSX y no llama a la API directamente; usa los modelos de src/modelos.
 * (3) Los hooks solo se llaman en el nivel superior del componente, nunca dentro de condiciones
 *     o ciclos.
 * (4) Todo componente que lo use debe estar dentro de ProveedorSesion.
 * ******************************************************************
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModeloAutenticacion } from '../modelos/ModeloAutenticacion.js';
import { RegistrarAlExpirarSesion } from '../modelos/ClienteApi.js';

/*
 * Variable: ContextoSesion
 * Objetivo: Contexto de React que comparte la sesión con las pantallas.
 */
const ContextoSesion = createContext(null);

/*
 * Componente: ProveedorSesion
 * Objetivo: Controlador de sesión: guarda el usuario autenticado y sus funciones para que las
 *           vistas decidan qué mostrar y qué rutas permitir.
 * Uso: <ProveedorSesion >…</ProveedorSesion>
 */
export function ProveedorSesion({ children })
{
  const [usuario, SetUsuario] = useState(null);
  const [cargando, SetCargando] = useState(ModeloAutenticacion.TieneSesion());

  const CerrarSesion = useCallback(() =>
  {
    ModeloAutenticacion.CerrarSesion();
    SetUsuario(null);
  }, []);

  useEffect(() =>
  {
    RegistrarAlExpirarSesion(CerrarSesion);
    if (!ModeloAutenticacion.TieneSesion())
    {
      return;
    }
    ModeloAutenticacion.ObtenerSesion()
      .then(SetUsuario)
      .catch(CerrarSesion)
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

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
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
