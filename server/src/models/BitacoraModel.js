import { query } from '../config/db.js';

/**
 * Bitácora de acciones relevantes. Alimenta la "Actividad reciente" del
 * panel. Registrar nunca debe romper la operación principal, por eso los
 * errores se reportan en consola y no se propagan.
 */
const BitacoraModel = {
  async registrar(idUsuario, accion, descripcion, conn) {
    try {
      await query(
        'INSERT INTO Bitacora (id_usuario, Accion, Descripcion) VALUES (?, ?, ?)',
        [idUsuario ?? null, accion, descripcion.slice(0, 255)],
        conn,
      );
    } catch (error) {
      console.error('No se pudo registrar en bitácora:', error.message);
    }
  },

  recientes(limit = 10) {
    return query(
      `SELECT b.id_bitacora, b.Accion, b.Descripcion, b.Fecha, u.Nombre_Completo
         FROM Bitacora b LEFT JOIN Usuarios u ON u.id_usuario = b.id_usuario
        ORDER BY b.Fecha DESC, b.id_bitacora DESC
        LIMIT ?`,
      [Number(limit)],
    );
  },
};

export { BitacoraModel };
