/*
 * ******************************************************************
 * Nombre del programa: EMPLEADOS · RutasEmpleados.js
 * Función: Rutas de la API de Empleados (sistema externo de nómina), bajo /empleados/api.
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
 *     RutasEmpleados   GET /empleados · GET /empleados/:nomina · PUT /empleados/:nomina
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se monta en aplicacion.js; todas las rutas exigen la clave de Empleados.
 * ******************************************************************
 */

import express from 'express';
import { ENTORNO } from '../configuracion/entorno.js';
import { VerificarClave } from '../intermediarios/VerificarClave.js';
import { ControladorEmpleados } from '../controladores/ControladorEmpleados.js';
import { ManejarAsincrono } from '../utilidades/ManejarAsincrono.js';

const RutasEmpleados = express.Router();

RutasEmpleados.use(VerificarClave(ENTORNO.CLAVES.EMPLEADOS, 'Empleados'));
RutasEmpleados.get('/empleados', ManejarAsincrono(ControladorEmpleados.Listar));
RutasEmpleados.get('/empleados/:nomina', ManejarAsincrono(ControladorEmpleados.Obtener));
RutasEmpleados.put('/empleados/:nomina', ManejarAsincrono(ControladorEmpleados.Actualizar));

export { RutasEmpleados };
