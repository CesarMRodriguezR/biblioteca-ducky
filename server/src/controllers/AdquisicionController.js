'use strict';

const HttpError = require('../utils/HttpError');
const OrdenCompraModel = require('../models/OrdenCompraModel');
const BitacoraModel = require('../models/BitacoraModel');
const { tieneFuncion } = require('../middlewares/auth');

const OrdenCompraController = {
  /** Quien gestiona compras ve todas las órdenes; los demás, solo las suyas. */
  async listar(req, res) {
    const { estatus, limit, offset } = req.validQuery;
    const idUsuario = tieneFuncion(req, 'gestionar_compras') ? undefined : req.usuario.id_usuario;
    res.json(await OrdenCompraModel.listar({ idUsuario, estatus, limit, offset }));
  },

  /** GET /ordenes-compra/solicitudes — renglones abiertos ("Solicitudes pendientes"). */
  async solicitudes(_req, res) {
    res.json(await OrdenCompraModel.solicitudesAbiertas());
  },

  async obtener(req, res) {
    const orden = await OrdenCompraModel.findById(req.params.id);
    if (!orden) throw HttpError.notFound('Orden no encontrada');
    if (!tieneFuncion(req, 'gestionar_compras') && orden.id_usuario !== req.usuario.id_usuario) {
      throw HttpError.forbidden();
    }
    res.json(orden);
  },

  async crear(req, res) {
    const orden = await OrdenCompraModel.crear(req.body, req.usuario.id_usuario);
    const renglones = [...orden.librosExistentes, ...orden.librosNuevos];
    const descripcion = renglones
      .map((r) => `${r.Titulo} · ${r.Num_Ejemplares} ${r.Num_Ejemplares === 1 ? 'copia' : 'copias'}`)
      .join('; ');
    await BitacoraModel.registrar(req.usuario.id_usuario, 'SOLICITUD_COMPRA', `Solicitud de compra: ${descripcion}`);
    res.status(201).json(orden);
  },

  async cambiarEstatus(req, res) {
    const orden = await OrdenCompraModel.cambiarEstatus(req.params.id, req.body.Estatus);
    await BitacoraModel.registrar(
      req.usuario.id_usuario,
      'ESTATUS_COMPRA',
      `Solicitud de compra #${orden.id_orden} → ${orden.Estatus}`,
    );
    res.json(orden);
  },
};

module.exports = { OrdenCompraController };
