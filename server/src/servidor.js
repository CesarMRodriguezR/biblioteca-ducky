/*
 * ******************************************************************
 * Nombre del programa: API-SERVIDOR · servidor.js
 * Función: Iniciar la API en el puerto configurado y cerrar las conexiones al apagarse.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: PUERTO del archivo .env
 * Salida: Servidor HTTP escuchando en /api
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo       Objetivo
 *     Apagar       Cerrar el servidor y el pool de conexiones al recibir…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Ejecutar con npm start o npm run dev. Requiere MariaDB activa y el archivo .env.
 * ******************************************************************
 */

import { aplicacion } from './aplicacion.js';
import { ENTORNO } from './configuracion/entorno.js';
import { pool } from './configuracion/conexion.js';

const servidor = aplicacion.listen(ENTORNO.PUERTO, () =>
{
  console.log(`API Biblioteca Ducky escuchando en http://localhost:${ENTORNO.PUERTO}/api`);
});

/*
 * Función: Apagar
 * Objetivo: Cerrar el servidor y el pool de conexiones al recibir SIGINT o SIGTERM.
 * Entrada: Ninguna
 * Salida: Ninguna (termina el proceso)
 */
async function Apagar()
{
  servidor.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', Apagar);
process.on('SIGTERM', Apagar);
