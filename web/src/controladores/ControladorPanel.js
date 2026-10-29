/*
 * ******************************************************************
 * Nombre del programa: WEB-PANEL · ControladorPanel.js
 * Función: Indicadores del panel del administrador.
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
 *     Hook                  Objetivo
 *     useControladorPanel   BD-SP01-GU01 Resultado: panel con indicadores y accesos…
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

import { ModeloPanel } from '../modelos/ModelosLibros.js';
import { useCarga } from './HooksAsincronos.js';

/*
 * Hook: useControladorPanel
 * Objetivo: BD-SP01-GU01 Resultado: panel con indicadores y accesos rápidos.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorPanel()
{
  const { datos, error, cargando } = useCarga(() => ModeloPanel.Resumen(), []);
  return { resumen: datos, error, cargando };
}
