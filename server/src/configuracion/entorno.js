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
 *     ENTORNO           Configuración de la API: modo, puerto, CORS, base de…
 *                       datos, JWT y sistemas externos
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
 * Constante: ENTORNO
 * Objetivo: Configuración de la API: modo, puerto, CORS, base de datos, JWT y sistemas
 *           externos.
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

  // Sistemas externos (servicio externos/): de dónde salen los alumnos, los empleados y a
  // dónde se envían las solicitudes de compra. Cada uno pide su clave en X-Clave-Api.
  EXTERNOS: {
    CIAA: {
      NOMBRE: 'CIAA',
      URL: process.env.EXT_CIAA_URL || 'http://localhost:4000/ciaa/api',
      CLAVE: process.env.EXT_CIAA_CLAVE || 'clave-ciaa-dev',
    },
    EMPLEADOS: {
      NOMBRE: 'Empleados',
      URL: process.env.EXT_EMPLEADOS_URL || 'http://localhost:4000/empleados/api',
      CLAVE: process.env.EXT_EMPLEADOS_CLAVE || 'clave-empleados-dev',
    },
    TESORERIA: {
      NOMBRE: 'Tesorería',
      URL: process.env.EXT_TESORERIA_URL || 'http://localhost:4000/tesoreria/api',
      CLAVE: process.env.EXT_TESORERIA_CLAVE || 'clave-tesoreria-dev',
    },
    // Clave con la que Tesorería se identifica al avisar una respuesta a Biblio.
    CLAVE_NOTIFICACION: process.env.TESORERIA_CLAVE_NOTIFICACION || 'clave-notificacion-dev',
  },
};

if (ENTORNO.MODO === 'production' && ENTORNO.JWT.SECRETO === 'cambia-este-secreto')
{
  throw new Error('JWT_SECRET debe definirse en producción');
}

export { ENTORNO };
