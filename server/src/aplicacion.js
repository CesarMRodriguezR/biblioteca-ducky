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
