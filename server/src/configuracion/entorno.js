import 'dotenv/config';

const ConvertirEntero = (value, fallback) => 
{
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const ConvertirNumero = (value, fallback) => 
{
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

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

  // Reglas de negocio de circulación (coinciden con la tabla Politicas)
  REGLAS: {
    DIAS_PRESTAMO: ConvertirEntero(process.env.DIAS_PRESTAMO, 7),
    MAX_RENOVACIONES: ConvertirEntero(process.env.MAX_RENOVACIONES, 2),
    MAX_PRESTAMOS_ACTIVOS: ConvertirEntero(process.env.MAX_PRESTAMOS_ACTIVOS, 3),
    MULTA_POR_DIA: ConvertirNumero(process.env.MULTA_POR_DIA, 10),
  },
};

if (ENTORNO.MODO === 'production' && ENTORNO.JWT.SECRETO === 'cambia-este-secreto') 
{
  throw new Error('JWT_SECRET debe definirse en producción');
}

export { ENTORNO };
