import 'dotenv/config';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((o) => o.trim()),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'ducky',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'biblioteca_ducky',
    socketPath: process.env.DB_SOCKET || undefined,
    connectionLimit: toInt(process.env.DB_POOL_SIZE, 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'cambia-este-secreto',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  // Reglas de negocio de circulación (coinciden con la tabla Politicas)
  reglas: {
    diasPrestamo: toInt(process.env.DIAS_PRESTAMO, 7),
    maxRenovaciones: toInt(process.env.MAX_RENOVACIONES, 2),
    maxPrestamosActivos: toInt(process.env.MAX_PRESTAMOS_ACTIVOS, 3),
    multaPorDia: toNumber(process.env.MULTA_POR_DIA, 10),
  },
};

if (env.nodeEnv === 'production' && env.jwt.secret === 'cambia-este-secreto') {
  throw new Error('JWT_SECRET debe definirse en producción');
}

export { env };
