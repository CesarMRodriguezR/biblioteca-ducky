import { Consultar } from '../configuracion/conexion.js';

/**
 * Bitácora de acciones relevantes. Alimenta la "Actividad reciente" del
 * panel. Registrar nunca debe romper la operación principal, por eso los
 * errores se reportan en consola y no se propagan.
 */
const ModeloBitacora = {
  async Registrar(id_usuario, accion, descripcion, conn) 
  {
    try 
    {
      await Consultar(
        'INSERT INTO Bitacora (id_usuario, Accion, Descripcion) VALUES (?, ?, ?)',
        [id_usuario ?? null, accion, descripcion.slice(0, 255)],
        conn,
      );
    }
    catch (error) 
    {
      console.error('No se pudo registrar en bitácora:', error.message);
    }
  },

  Recientes(limit = 10) 
  {
    return Consultar(
      `SELECT b.id_bitacora, b.Accion, b.Descripcion, b.Fecha, u.Nombre_Completo
         FROM Bitacora b LEFT JOIN Usuarios u ON u.id_usuario = b.id_usuario
        ORDER BY b.Fecha DESC, b.id_bitacora DESC
        LIMIT ?`,
      [Number(limit)],
    );
  },
};

export { ModeloBitacora };
