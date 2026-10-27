/*
 * ******************************************************************
 * Nombre del programa: WEB-ASINCRONO · HooksAsincronos.js
 * Función: Hooks reutilizables para cargar datos y enviar acciones a la API con su estado de
 *          carga y error.
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
 *     Hook         Objetivo
 *     useCarga     Carga datos de un modelo y expone { datos, error,…
 *     useAccion    Envía una acción (guardar, eliminar…) y expone {…
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

import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Hook: useCarga
 * Objetivo: Carga datos de un modelo y expone { datos, error, cargando, recargar }. Ignora
 *           respuestas que llegan después de desmontar o de una carga nueva.
 * Entrada: cargar, dependencias (opcional)
 * Salida: Objeto { datos, error, cargando, Recargar, SetDatos }
 */
export function useCarga(cargar, dependencias = [])
{
  const [estado, SetEstado] = useState({ datos: null, error: null, cargando: true });
  const ultima = useRef(0);

  const Recargar = useCallback(async () =>
  {
    const id = ++ultima.current;
    SetEstado((estado_previo) => ({ ...estado_previo, cargando: true, error: null }));
    try
    {
      const datos = await cargar();
      if (id === ultima.current)
      {
        SetEstado({ datos, error: null, cargando: false });
      }
      return datos;
    }
    catch (error)
    {
      if (id === ultima.current)
      {
        SetEstado((estado_previo) => ({ ...estado_previo, error, cargando: false }));
      }
      return null;
    }

  }, dependencias);

  useEffect(() =>
  {
    Recargar();
    return () =>
    {
      ultima.current += 1;
    };
  }, [Recargar]);

  return {
    ...estado,
    Recargar,
    SetDatos: (datos) => SetEstado((estado_previo) => ({ ...estado_previo, datos })),
  };
}

/*
 * Hook: useAccion
 * Objetivo: Envía una acción (guardar, eliminar…) y expone { ejecutar, enviando, error, errores
 *           }. `errores` son los mensajes por campo devueltos por la API.
 * Entrada: accion
 * Salida: Objeto { Ejecutar, enviando, error, errores, LimpiarError }
 */
export function useAccion(accion)
{
  const [enviando, SetEnviando] = useState(false);
  const [error, SetError] = useState(null);

  const Ejecutar = useCallback(
    async (...args) =>
    {
      SetEnviando(true);
      SetError(null);
      try
      {
        return await accion(...args);
      }
      catch (excepcion)
      {
        SetError(excepcion);
        throw excepcion;
      }
      finally
      {
        SetEnviando(false);
      }
    },
    [accion],
  );

  return {
    Ejecutar,
    enviando,
    error,
    errores: error?.errores ?? {},
    LimpiarError: () => SetError(null),
  };
}
