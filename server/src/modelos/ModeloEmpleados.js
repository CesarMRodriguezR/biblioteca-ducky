/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ModeloEmpleados.js
 * Función: Obtener del sistema de Empleados (nómina, sistema externo) los empleados activos,
 *          tomando solo los datos que Biblio necesita.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Ninguna (la URL y la clave están en ENTORNO.EXTERNOS.EMPLEADOS)
 * Salida: Personas normalizadas para generar la lista de usuarios
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     ModeloEmpleados   Acceso a la API de Empleados
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC cuya fuente de datos es una API externa, no MariaDB.
 * (2) El sistema de Empleados entrega más datos (RFC, salario, departamento…); Biblio se queda
 *     solo con nómina, nombre, apellidos, correo institucional y el tipo de empleado (para
 *     sugerir el rol).
 * ******************************************************************
 */

import { ENTORNO } from '../configuracion/entorno.js';
import { LlamarSistemaExterno } from '../utilidades/LlamarSistemaExterno.js';

/*
 * Módulo: ModeloEmpleados
 * Objetivo: Acceso a la API de Empleados.
 */
const ModeloEmpleados = {
  /*
   * Función: ObtenerActivos
   * Objetivo: Pedir al sistema de Empleados los empleados activos y quedarse solo con lo
   *           necesario.
   * Entrada: Ninguna
   * Salida: Promesa con [{ Origen, Tipo, Matricula_Nomina, Nombre, Segundo_Nombre,
   *         Apellido_Paterno, Apellido_Materno, Correo }]
   */
  async ObtenerActivos()
  {
    const { datos } = await LlamarSistemaExterno(
      ENTORNO.EXTERNOS.EMPLEADOS,
      'GET',
      '/empleados?estatus=Activo',
    );
    return datos.map((empleado) => ({
      Origen: 'Empleados',
      Tipo: empleado.Tipo,
      Matricula_Nomina: String(empleado.Numero_Nomina ?? '').trim(),
      Nombre: empleado.Nombre ?? '',
      Segundo_Nombre: empleado.Segundo_Nombre ?? '',
      Apellido_Paterno: empleado.Apellido_Paterno ?? '',
      Apellido_Materno: empleado.Apellido_Materno ?? '',
      Correo: empleado.Correo_Institucional ?? null,
    }));
  },
};

export { ModeloEmpleados };
