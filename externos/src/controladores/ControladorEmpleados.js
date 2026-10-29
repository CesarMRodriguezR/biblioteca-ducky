/*
 * ******************************************************************
 * Nombre del programa: EMPLEADOS · ControladorEmpleados.js
 * Función: Atender la API de Empleados: listar, consultar y corregir empleados.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Peticiones HTTP de /empleados/api
 * Salida: Respuestas HTTP en formato JSON
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                 Objetivo
 *     ControladorEmpleados   Manejadores de la API de empleados
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se registra en rutas/RutasEmpleados.js envuelto en ManejarAsincrono.
 * ******************************************************************
 */

import { ModeloEmpleado } from '../modelos/ModeloEmpleado.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Módulo: ControladorEmpleados
 * Objetivo: Manejadores de la API de empleados.
 */
const ControladorEmpleados = {
  /*
   * Función: Listar
   * Objetivo: GET /empleados?estatus=Activo — empleados, opcionalmente por estatus.
   * Entrada: req, res
   * Salida: Respuesta JSON { total, datos }
   */
  async Listar(req, res)
  {
    const datos = await ModeloEmpleado.Listar({ estatus: req.query.estatus });
    res.json({ total: datos.length, datos });
  },

  /*
   * Función: Obtener
   * Objetivo: GET /empleados/:nomina — un empleado.
   * Entrada: req, res
   * Salida: Respuesta JSON con el empleado
   */
  async Obtener(req, res)
  {
    const empleado = await ModeloEmpleado.BuscarPorNomina(req.params.nomina);
    if (!empleado)
    {
      throw new ErrorHttp(404, `No existe el empleado con nómina ${req.params.nomina}`);
    }
    res.json(empleado);
  },

  /*
   * Función: Actualizar
   * Objetivo: PUT /empleados/:nomina — corregir los datos de un empleado.
   * Entrada: req, res
   * Salida: Respuesta JSON con el empleado corregido
   */
  async Actualizar(req, res)
  {
    res.json(await ModeloEmpleado.Actualizar(req.params.nomina, req.body ?? {}));
  },
};

export { ControladorEmpleados };
