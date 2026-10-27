import { UsuarioModel } from '../models/UsuarioModel.js';
import { LibroModel } from '../models/LibroModel.js';
import { OrdenCompraModel } from '../models/OrdenCompraModel.js';
import { BitacoraModel } from '../models/BitacoraModel.js';

const PanelController = {
  /** GET /panel — indicadores y actividad reciente (pantalla "Panel"). */
  async resumen(_req, res) {
    const [usuariosValidos, solicitudesPendientes, librosActivos, actividad] = await Promise.all([
      UsuarioModel.contarActivos(),
      OrdenCompraModel.contarPendientes(),
      LibroModel.contarActivos(),
      BitacoraModel.recientes(8),
    ]);
    res.json({ usuariosValidos, solicitudesPendientes, librosActivos, actividad });
  },
};

export { PanelController };
