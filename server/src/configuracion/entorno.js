/*
 * ******************************************************************
 * Nombre del programa: API-ENTORNO · entorno.js
 * Función: Leer el archivo .env y exponer la configuración de la API con valores por defecto.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Archivo .env (ver .env.example)
 * Salida: Constante ENTORNO
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     ConvertirEntero   Convertir un texto a entero o usar el valor por defecto
 *     ConvertirNumero   Convertir un texto a número o usar el valor por defecto
 *     ENTORNO           Configuración de la API: modo, puerto, CORS, base de…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) En producción JWT_SECRET es obligatorio; si falta, la API no arranca.
 * ******************************************************************
 */

import 'dotenv/config';

/*
 * Función: ConvertirEntero
 * Objetivo: Convertir un texto a entero o usar el valor por defecto.
 * Entrada: valor, valor_defecto
 * Salida: Número entero
 */
const ConvertirEntero = (valor, valor_defecto) =>
{
  const convertido = Number.parseInt(valor, 10);
  return Number.isNaN(convertido) ? valor_defecto : convertido;
};

/*
 * Función: ConvertirNumero
 * Objetivo: Convertir un texto a número o usar el valor por defecto.
 * Entrada: valor, valor_defecto
 * Salida: Número
 */
const ConvertirNumero = (valor, valor_defecto) =>
{
  const convertido = Number(valor);
  return Number.isNaN(convertido) ? valor_defecto : convertido;
};

/*
 * Constante: ENTORNO
 * Objetivo: Configuración de la API: modo, puerto, CORS, base de datos, JWT y reglas de
 *           circulación.
 */
const ENTORNO = {
  MODO: process.env.NODE_ENV || 'development',
  PUERTO: ConvertirEntero(process.env.PORT, 3000),
  ORIGENES_CORS: (process.env.CORS_ORIGINS || '*').split(',').map((parte) => parte.trim()),

  // Opciones del pool de mariadb: conservan los nombres que espera la biblioteca.
  BASE_DATOS: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: ConvertirEntero(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'ducky',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'biblioteca_ducky',
    socketPath: process.env.DB_SOCKET || undefined,
    connectionLimit: ConvertirEntero(process.env.DB_POOL_SIZE, 10),
  },

  JWT: {
    SECRETO: process.env.JWT_SECRET || 'cambia-este-secreto',
    EXPIRA_EN: process.env.JWT_EXPIRES_IN || '8h',
  },

  // Reglas de negocio de circulación (coinciden con la tabla Politicas)
  REGLAS: {
    DIAS_PRESTAMO: ConvertirEntero(process.env.DIAS_PRESTAMO, 7),
    MAX_RENOVACIONES: ConvertirEntero(process.env.MAX_RENOVACIONES, 2),
    MAX_PRESTAMOS_ACTIVOS: ConvertirEntero(process.env.MAX_PRESTAMOS_ACTIVOS, 3),
    MULTA_POR_DIA: ConvertirNumero(process.env.MULTA_POR_DIA, 10),
  },
};

if (ENTORNO.MODO === 'production' && ENTORNO.JWT.SECRETO === 'cambia-este-secreto')
{
  throw new Error('JWT_SECRET debe definirse en producción');
}

export { ENTORNO };
