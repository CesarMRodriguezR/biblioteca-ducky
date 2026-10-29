/*
 * ******************************************************************
 * Nombre del programa: TESORERIA · RutasTesoreria.js
 * Función: Rutas de la API de Tesorería (sistema externo), bajo /tesoreria/api.
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
 *     Módulo           Objetivo
 *     RutasTesoreria   Recibir, consultar, aceptar y rechazar solicitudes de compra
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se monta en aplicacion.js; todas las rutas exigen la clave de Tesorería.
 * ******************************************************************
 */

import express from 'express';
import { ENTORNO } from '../configuracion/entorno.js';
import { VerificarClave } from '../intermediarios/VerificarClave.js';
import { ControladorTesoreria } from '../controladores/ControladorTesoreria.js';
import { ManejarAsincrono } from '../utilidades/ManejarAsincrono.js';

const RutasTesoreria = express.Router();

RutasTesoreria.use(VerificarClave(ENTORNO.CLAVES.TESORERIA, 'Tesorería'));
RutasTesoreria.post('/solicitudes', ManejarAsincrono(ControladorTesoreria.Recibir));
RutasTesoreria.get('/solicitudes', ManejarAsincrono(ControladorTesoreria.Listar));
RutasTesoreria.get('/solicitudes/:folio', ManejarAsincrono(ControladorTesoreria.Obtener));
RutasTesoreria.post('/solicitudes/:folio/aceptar', ManejarAsincrono(ControladorTesoreria.Aceptar));
RutasTesoreria.post(
  '/solicitudes/:folio/rechazar',
  ManejarAsincrono(ControladorTesoreria.Rechazar),
);

export { RutasTesoreria };
