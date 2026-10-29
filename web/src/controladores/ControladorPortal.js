/*
 * ******************************************************************
 * Nombre del programa: WEB-PORTAL · ControladorPortal.js
 * Función: Portal público de la biblioteca: búsqueda y acceso al inicio de sesión.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Acciones del visitante en el portal
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
 *     useControladorPortal  Inicio-Portal de biblioteca: buscar en el catálogo e iniciar sesión
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado y navega.
 * (2) El catálogo requiere sesión: si no hay, la búsqueda pasa por el inicio de sesión y al
 *     entrar se muestra el resultado.
 * ******************************************************************
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSesion } from './ControladorSesion.jsx';
import { RutaInicial } from '../modelos/ModeloAutenticacion.js';

/*
 * Hook: useControladorPortal
 * Objetivo: Inicio-Portal de biblioteca: buscar en el catálogo e iniciar sesión.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorPortal()
{
  const navegar = useNavigate();
  const { usuario } = useSesion();
  const [texto, SetTexto] = useState('');

  return {
    texto,
    SetTexto,
    con_sesion: Boolean(usuario),
    Buscar: (evento) =>
    {
      evento?.preventDefault();
      const busqueda = texto.trim();
      navegar(busqueda ? `/catalogo?q=${encodeURIComponent(busqueda)}` : '/catalogo');
    },
    IniciarSesion: () => navegar(usuario ? RutaInicial(usuario) : '/login'),
    IrAServicio: () => navegar(usuario ? RutaInicial(usuario) : '/login'),
  };
}
