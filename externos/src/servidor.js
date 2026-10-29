/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-SERVIDOR · servidor.js
 * Función: Iniciar los sistemas externos simulados y cerrar sus conexiones al apagarse.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: PORT del archivo .env
 * Salida: Servidor HTTP con /ciaa/api, /empleados/api y /tesoreria/api
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo   Objetivo
 *     Apagar   Cerrar el servidor y los pools al recibir SIGINT o SIGTERM
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Ejecutar con npm start o npm run dev. Requiere MariaDB con las bases de datos de
 *     database/ (npm run db:reset).
 * ******************************************************************
 */

import { aplicacion } from './aplicacion.js';
import { ENTORNO } from './configuracion/entorno.js';
import { CerrarBases } from './configuracion/conexion.js';

const servidor = aplicacion.listen(ENTORNO.PUERTO, () =>
{
  const base = `http://localhost:${ENTORNO.PUERTO}`;
  console.log('Sistemas externos simulados:');
  console.log(`  CIAA (alumnos)      ${base}/ciaa/api/alumnos`);
  console.log(`  Empleados (nómina)  ${base}/empleados/api/empleados`);
  console.log(`  Tesorería           ${base}/tesoreria/api/solicitudes`);
});

/*
 * Función: Apagar
 * Objetivo: Cerrar el servidor y los pools al recibir SIGINT o SIGTERM.
 * Entrada: Ninguna
 * Salida: Ninguna (termina el proceso)
 */
async function Apagar()
{
  servidor.close();
  await CerrarBases();
  process.exit(0);
}

process.on('SIGINT', Apagar);
process.on('SIGTERM', Apagar);
