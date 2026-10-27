import { ENTORNO } from '../configuracion/entorno.js';

const ERRORES_SQL = {
  ER_DUP_ENTRY: { status: 409, message: 'Ya existe un registro con esos datos' },
  ER_ROW_IS_REFERENCED_2: { status: 409, message: 'El registro está en uso y no puede eliminarse' },
  ER_NO_REFERENCED_ROW_2: { status: 400, message: 'Una referencia no existe' },
  ER_CONSTRAINT_FAILED: {
    status: 400,
    message: 'Los datos no cumplen las reglas de la base de datos',
  },
};

function RutaNoEncontrada(req, res) 
{
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

 
function ManejarErrores(err, _req, res, _next) 
{
  if (err.name === 'HttpError') 
  {
    return res.status(err.status).json({ error: err.message, detalles: err.details });
  }

  const sql = ERRORES_SQL[err.code];
  if (sql) 
  {
    return res.status(sql.status).json({ error: sql.message });
  }

  if (err.type === 'entity.parse.failed') 
  {
    return res.status(400).json({ error: 'JSON mal formado' });
  }

  console.error(err);
  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(ENTORNO.MODO !== 'production' && { detalle: err.message }),
  });
}

export { RutaNoEncontrada, ManejarErrores };
