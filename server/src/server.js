'use strict';

const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');

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
