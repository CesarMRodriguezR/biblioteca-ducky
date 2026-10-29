/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-CONEXION · conexion.js
 * Función: Abrir un pool de conexiones por sistema externo (cada uno tiene su propia base de
 *          datos) y ejecutar consultas o transacciones en él.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Configuración de ENTORNO.CONEXION y ENTORNO.BASES
 * Salida: Objetos bd_ciaa, bd_empleados y bd_tesoreria
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo          Objetivo
 *     CrearBaseDatos  Crear el pool de una base de datos con Consultar y Transaccion
 *     CerrarBases     Cerrar los tres pools al apagar el servicio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Cada modelo usa solo la base de datos de su sistema: los sistemas no comparten tablas.
 * (2) Las consultas son parametrizadas (?); nunca se concatenan datos en el SQL.
 * ******************************************************************
 */

import mariadb from 'mariadb';
import { ENTORNO } from './entorno.js';

/*
 * Función: CrearBaseDatos
 * Objetivo: Crear el pool de una base de datos y las funciones para consultarla.
 * Entrada: nombre_base
 * Salida: { pool, Consultar(sql, parametros, conexion), Transaccion(trabajo) }
 */
function CrearBaseDatos(nombre_base)
{
  const pool = mariadb.createPool({
    ...ENTORNO.CONEXION,
    database: nombre_base,
    dateStrings: true,
    insertIdAsNumber: true,
    bigIntAsNumber: true,
    decimalAsNumber: true,
  });

  /*
   * Función: Consultar
   * Objetivo: Ejecutar una consulta con el pool o con la conexión de una transacción.
   * Entrada: sql, parametros (opcional), conexion (opcional)
   * Salida: Promesa con las filas (SELECT) o el resultado de la operación
   */
  async function Consultar(sql, parametros = [], conexion = null)
  {
    const resultado = await (conexion || pool).query(sql, parametros);
    return Array.isArray(resultado) && resultado.meta ? Array.from(resultado) : resultado;
  }

  /*
   * Función: Transaccion
   * Objetivo: Ejecutar trabajo(conexion) en una transacción: COMMIT si termina bien y
   *           ROLLBACK si lanza un error.
   * Entrada: trabajo
   * Salida: Promesa con lo que devuelva el trabajo
   */
  async function Transaccion(trabajo)
  {
    const conexion = await pool.getConnection();
    try
    {
      await conexion.beginTransaction();
      const resultado = await trabajo(conexion);
      await conexion.commit();
      return resultado;
    }
    catch (error)
    {
      await conexion.rollback();
      throw error;
    }
    finally
    {
      conexion.release();
    }
  }

  return { pool, Consultar, Transaccion };
}

const bd_ciaa = CrearBaseDatos(ENTORNO.BASES.CIAA);
const bd_empleados = CrearBaseDatos(ENTORNO.BASES.EMPLEADOS);
const bd_tesoreria = CrearBaseDatos(ENTORNO.BASES.TESORERIA);

/*
 * Función: CerrarBases
 * Objetivo: Cerrar los tres pools al apagar el servicio o terminar las pruebas.
 * Entrada: Ninguna
 * Salida: Promesa que se resuelve al cerrar
 */
function CerrarBases()
{
  return Promise.all([bd_ciaa.pool.end(), bd_empleados.pool.end(), bd_tesoreria.pool.end()]);
}

export { bd_ciaa, bd_empleados, bd_tesoreria, CerrarBases };
