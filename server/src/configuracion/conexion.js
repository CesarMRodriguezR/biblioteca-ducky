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

/**
 * Ejecuta una consulta con el pool o con una conexión de transacción.
 * Devuelve las filas (SELECT) o el resultado (INSERT/UPDATE/DELETE).
 */
async function Consultar(sql, params = [], conn = null) 
{
  const executor = conn || pool;
  const result = await executor.query(sql, params);
  if (Array.isArray(result) && result.meta) 
  {
    return Array.from(result);
  }
  return result;
}

/**
 * Ejecuta `work(conn)` dentro de una transacción.
 * Hace COMMIT si termina bien y ROLLBACK si lanza un error.
 */
async function EjecutarEnTransaccion(work) 
{
  const conn = await pool.getConnection();
  try 
  {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  }
  catch (error) 
  {
    await conn.rollback();
    throw error;
  }
  finally 
  {
    conn.release();
  }
}

export { pool, Consultar, EjecutarEnTransaccion };
