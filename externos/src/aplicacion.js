/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-APLICACION · aplicacion.js
 * Función: Montar en una sola aplicación Express las APIs de los tres sistemas externos
 *          simulados: CIAA, Empleados y Tesorería.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Variables de entorno (configuracion/entorno.js)
 * Salida: Aplicación Express lista para escuchar
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Cada sistema tiene su prefijo, su clave y su base de datos; Biblio los trata como tres
 *     servicios distintos (sus URLs se configuran por separado en server/.env).
 * ******************************************************************
 */

import express from 'express';
import { RutasCiaa } from './rutas/RutasCiaa.js';
import { RutasEmpleados } from './rutas/RutasEmpleados.js';
import { RutasTesoreria } from './rutas/RutasTesoreria.js';
import { RutaNoEncontrada, ManejarErrores } from './intermediarios/errores.js';

const aplicacion = express();

aplicacion.use(express.json({ limit: '1mb' }));
aplicacion.get('/salud', (_req, res) => res.json({ ok: true }));
aplicacion.use('/ciaa/api', RutasCiaa);
aplicacion.use('/empleados/api', RutasEmpleados);
aplicacion.use('/tesoreria/api', RutasTesoreria);
aplicacion.use(RutaNoEncontrada);
aplicacion.use(ManejarErrores);

export { aplicacion };
