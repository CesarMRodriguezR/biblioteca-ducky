/*
 * ******************************************************************
 * Nombre del programa: CIAA · RutasCiaa.js
 * Función: Rutas de la API del CIAA (sistema externo de alumnos), bajo /ciaa/api.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Peticiones HTTP con el encabezado X-Clave-Api
 * Salida: Router de Express
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo       Objetivo
 *     RutasCiaa    GET /alumnos · GET /alumnos/:matricula · PUT /alumnos/:matricula
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se monta en aplicacion.js; todas las rutas exigen la clave del CIAA.
 * ******************************************************************
 */

import express from 'express';
import { ENTORNO } from '../configuracion/entorno.js';
import { VerificarClave } from '../intermediarios/VerificarClave.js';
import { ControladorCiaa } from '../controladores/ControladorCiaa.js';
import { ManejarAsincrono } from '../utilidades/ManejarAsincrono.js';

const RutasCiaa = express.Router();

RutasCiaa.use(VerificarClave(ENTORNO.CLAVES.CIAA, 'CIAA'));
RutasCiaa.get('/alumnos', ManejarAsincrono(ControladorCiaa.Listar));
RutasCiaa.get('/alumnos/:matricula', ManejarAsincrono(ControladorCiaa.Obtener));
RutasCiaa.put('/alumnos/:matricula', ManejarAsincrono(ControladorCiaa.Actualizar));

export { RutasCiaa };
