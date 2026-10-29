/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-ENTORNO · entorno.js
 * Función: Leer la configuración de los sistemas externos simulados desde el archivo .env.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Variables de entorno (archivo .env)
 * Salida: Objeto ENTORNO con puerto, bases de datos, claves y la dirección de Biblio
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
 *     ENTORNO           Configuración de los tres sistemas externos
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Copiar .env.example a .env y ajustar DB_PASSWORD; las claves deben coincidir con las de
 *     server/.env.
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
 * Objetivo: Configuración de los tres sistemas externos: puerto, conexión a MariaDB (una base
 *           de datos por sistema), claves de acceso y aviso a Biblio.
 */
const ENTORNO = {
  MODO: process.env.NODE_ENV || 'development',
  PUERTO: ConvertirEntero(process.env.PORT, 4000),

  // Opciones del pool de mariadb: conservan los nombres que espera la biblioteca.
  CONEXION: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: ConvertirEntero(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'ducky',
    password: process.env.DB_PASSWORD || '',
    socketPath: process.env.DB_SOCKET || undefined,
    connectionLimit: 5,
  },

  BASES: {
    CIAA: process.env.DB_CIAA || 'ciaa_ducky',
    EMPLEADOS: process.env.DB_EMPLEADOS || 'empleados_ducky',
    TESORERIA: process.env.DB_TESORERIA || 'tesoreria_ducky',
  },

  CLAVES: {
    CIAA: process.env.CLAVE_CIAA || 'clave-ciaa-dev',
    EMPLEADOS: process.env.CLAVE_EMPLEADOS || 'clave-empleados-dev',
    TESORERIA: process.env.CLAVE_TESORERIA || 'clave-tesoreria-dev',
  },

  BIBLIO: {
    URL: process.env.BIBLIO_URL || 'http://localhost:3000/api',
    CLAVE_NOTIFICACION: process.env.BIBLIO_CLAVE_NOTIFICACION || 'clave-notificacion-dev',
  },
};

export { ENTORNO };
