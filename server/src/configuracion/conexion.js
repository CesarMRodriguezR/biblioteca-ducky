/*
 * ******************************************************************
 * Nombre del programa: API-CONEXION · conexion.js
 * Función: Crear el pool de conexiones a MariaDB y ofrecer consultas y transacciones.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Opciones de ENTORNO.BASE_DATOS
 * Salida: Filas o resultados de MariaDB
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                  Objetivo
 *     Consultar               Ejecuta una consulta con el pool o con una conexión de…
 *     EjecutarEnTransaccion   Ejecuta `work(conn)` dentro de una transacción. Hace…
 *     SiguienteId             Siguiente identificador VARCHAR(13) de una tabla
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Las consultas usan marcadores ? para los valores; las fechas se devuelven como texto
 *     (dateStrings).
 * ******************************************************************
 */

import mariadb from 'mariadb';
import { ENTORNO } from './entorno.js';

const pool = mariadb.createPool({
  ...ENTORNO.BASE_DATOS,
  dateStrings: true,
  insertIdAsNumber: true,
  bigIntAsNumber: true,
  decimalAsNumber: true,
  namedPlaceholders: false,
});

/*
 * Función: Consultar
 * Objetivo: Ejecuta una consulta con el pool o con una conexión de transacción. Devuelve las
 *           filas (SELECT) o el resultado (INSERT/UPDATE/DELETE).
 * Entrada: sql, parametros (opcional), conexion (opcional)
 * Salida: Promesa con las filas (SELECT) o el resultado de la operación
 */
async function Consultar(sql, parametros = [], conexion = null)
{
  const executor = conexion || pool;
  const resultado = await executor.query(sql, parametros);
  if (Array.isArray(resultado) && resultado.meta)
  {
    return Array.from(resultado);
  }
  return resultado;
}

/*
 * Función: EjecutarEnTransaccion
 * Objetivo: Ejecuta `work(conn)` dentro de una transacción. Hace COMMIT si termina bien y
 *           ROLLBACK si lanza un error.
 * Entrada: trabajo
 * Salida: Promesa con lo que devuelva el trabajo
 */
async function EjecutarEnTransaccion(trabajo)
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

/*
 * Función: SiguienteId
 * Objetivo: Calcular el siguiente identificador de una tabla. Las llaves son VARCHAR(13) como
 *           en el diccionario de datos y no tienen AUTO_INCREMENT: se guardan como texto
 *           numérico ('1', '2'…) y el siguiente es el mayor + 1. Dentro de una transacción
 *           bloquea la tabla hasta el COMMIT para que dos altas no tomen el mismo número.
 * Entrada: tabla, llave, conexion (opcional)
 * Salida: Promesa con el identificador como texto
 */
async function SiguienteId(tabla, llave, conexion = null)
{
  const [{ siguiente }] = await Consultar(
    `SELECT COALESCE(MAX(CAST(\`${llave}\` AS UNSIGNED)), 0) + 1 AS siguiente
       FROM \`${tabla}\` ${conexion ? 'FOR UPDATE' : ''}`,
    [],
    conexion,
  );
  return String(siguiente);
}

export { pool, Consultar, EjecutarEnTransaccion, SiguienteId };
