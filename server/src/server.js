import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const server = app.listen(env.port, () => {
  console.log(`API Biblioteca Ducky escuchando en http://localhost:${env.port}/api`);
});

async function apagar() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
