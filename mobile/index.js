/*
 * ******************************************************************
 * Nombre del programa: MOVIL-INDEX · index.js
 * Función: Punto de entrada de Expo: registra el componente raíz de la aplicación.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Ninguna
 * Salida: Aplicación registrada en Expo
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Expo busca este archivo (campo main de package.json); no debe moverse ni renombrarse.
 * ******************************************************************
 */

import { registerRootComponent } from 'expo';
import Aplicacion from './src/Aplicacion';

registerRootComponent(Aplicacion);
