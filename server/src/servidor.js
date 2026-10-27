import { aplicacion } from './aplicacion.js';
import { ENTORNO } from './configuracion/entorno.js';
import { pool } from './configuracion/conexion.js';

const server = aplicacion.listen(ENTORNO.PUERTO, () => 
{
  console.log(`API Biblioteca Ducky escuchando en http://localhost:${ENTORNO.PUERTO}/api`);
});

async function Apagar() 
{
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', Apagar);
process.on('SIGTERM', Apagar);
