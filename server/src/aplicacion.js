/*
 * ******************************************************************
 * Nombre del programa: API-APLICACION · aplicacion.js
 * Función: Configurar la aplicación Express: seguridad, CORS, JSON, registro de peticiones,
 *          rutas y manejo de errores.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Variables de entorno (configuracion/entorno.js)
 * Salida: Aplicación Express lista para escuchar
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) servidor.js la pone a escuchar; las pruebas la usan directamente sin abrir un puerto
 *     fijo.
 * ******************************************************************
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENTORNO } from './configuracion/entorno.js';
import { rutas } from './rutas/rutas.js';
import { RutaNoEncontrada, ManejarErrores } from './intermediarios/errores.js';

const aplicacion = express();

aplicacion.use(helmet());
aplicacion.use(
  cors({ origin: ENTORNO.ORIGENES_CORS.includes('*') ? true : ENTORNO.ORIGENES_CORS }),
);
aplicacion.use(express.json({ limit: '1mb' }));
if (ENTORNO.MODO !== 'test')
{
  aplicacion.use(morgan('dev'));
}

aplicacion.use('/api', rutas);

aplicacion.use(RutaNoEncontrada);
aplicacion.use(ManejarErrores);

export { aplicacion };
