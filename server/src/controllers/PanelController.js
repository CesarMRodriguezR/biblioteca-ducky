'use strict';

const UsuarioModel = require('../models/UsuarioModel');
const LibroModel = require('../models/LibroModel');
const OrdenCompraModel = require('../models/OrdenCompraModel');
const BitacoraModel = require('../models/BitacoraModel');

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

module.exports = PanelController;
