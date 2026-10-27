'use strict';

/**
 * Controladores de los módulos "Préstamo Libros" y "Devolución Préstamos":
 * préstamos, devoluciones, renovaciones, multas y lista de espera.
 *
 * Regla general de alcance: quien tiene la función de gestión ve y opera
 * sobre todos los usuarios; los demás solo sobre sus propios registros.
 */
const HttpError = require('../utils/HttpError');
const PrestamoModel = require('../models/PrestamoModel');
const MultaModel = require('../models/MultaModel');
const ListaEsperaModel = require('../models/ListaEsperaModel');
const { tieneFuncion } = require('../middlewares/auth');

/** Devuelve el id de usuario a filtrar según los permisos. */
function alcance(req, funcionGestion, idSolicitado) {
  if (tieneFuncion(req, funcionGestion)) return idSolicitado;
  return req.usuario.id_usuario;
}

function verificarPropietario(req, registro, funcionGestion) {
  if (!tieneFuncion(req, funcionGestion) && registro.id_usuario !== req.usuario.id_usuario) {
    throw HttpError.forbidden();
  }
}

const PrestamoController = {
  async listar(req, res) {
    const { id_usuario: idUsuario, estado, limit, offset } = req.validQuery;
    res.json(await PrestamoModel.listar({
      idUsuario: alcance(req, 'gestionar_prestamos', idUsuario),
      estado,
      limit,
      offset,
    }));
  },

  async obtener(req, res) {
    const prestamo = await PrestamoModel.findById(req.params.id);
    if (!prestamo) throw HttpError.notFound('Préstamo no encontrado');
    verificarPropietario(req, prestamo, 'gestionar_prestamos');
    res.json(prestamo);
  },

  /** POST /prestamos — un usuario pide para sí; el bibliotecario puede indicar id_usuario. */
  async crear(req, res) {
    const { id_libro: idLibro, num_copia: numCopia, id_usuario: idSolicitado } = req.body;
    if (idSolicitado && idSolicitado !== req.usuario.id_usuario && !tieneFuncion(req, 'gestionar_prestamos')) {
      throw HttpError.forbidden('Solo puedes solicitar préstamos para ti');
    }
    const prestamo = await PrestamoModel.prestar({
      idUsuario: idSolicitado || req.usuario.id_usuario,
      idLibro,
      numCopia,
    });
    res.status(201).json(prestamo);
  },

  /** POST /prestamos/:id/devolucion */
  async devolver(req, res) {
    const resultado = await PrestamoModel.devolver(req.params.id, {
      fechaDevolucion: req.body?.Fecha_Devolucion,
    });
    res.status(201).json(resultado);
  },

  /** POST /prestamos/:id/renovacion */
  async renovar(req, res) {
    const prestamo = await PrestamoModel.findById(req.params.id);
    if (!prestamo) throw HttpError.notFound('Préstamo no encontrado');
    verificarPropietario(req, prestamo, 'gestionar_prestamos');
    res.status(201).json(await PrestamoModel.renovar(req.params.id));
  },
};

const MultaController = {
  async listar(req, res) {
    const { id_usuario: idUsuario, pendientes, limit, offset } = req.validQuery;
    res.json(await MultaModel.listar({
      idUsuario: alcance(req, 'gestionar_multas', idUsuario),
      pendientes,
      limit,
      offset,
    }));
  },

  async obtener(req, res) {
    const multa = await MultaModel.findById(req.params.id);
    if (!multa) throw HttpError.notFound('Multa no encontrada');
    verificarPropietario(req, multa, 'gestionar_multas');
    res.json(multa);
  },

  async crear(req, res) {
    res.status(201).json(await MultaModel.crear(req.body));
  },

  async pagar(req, res) {
    res.json(await MultaModel.pagar(req.params.id, req.body?.Fecha_Pagado));
  },
};

const ListaEsperaController = {
  async listar(req, res) {
    const {
      id_usuario: idUsuario, id_libro: idLibro, estatus, limit, offset,
    } = req.validQuery;
    res.json(await ListaEsperaModel.listar({
      idUsuario: alcance(req, 'gestionar_prestamos', idUsuario),
      idLibro,
      estatus,
      limit,
      offset,
    }));
  },

  async inscribir(req, res) {
    res.status(201).json(await ListaEsperaModel.inscribir(req.usuario.id_usuario, req.body.id_libro));
  },

  async cancelar(req, res) {
    const registro = await ListaEsperaModel.findById(req.params.id);
    if (!registro) throw HttpError.notFound('Registro de lista de espera no encontrado');
    verificarPropietario(req, registro, 'gestionar_prestamos');
    res.json(await ListaEsperaModel.cancelar(req.params.id));
  },
};

module.exports = { PrestamoController, MultaController, ListaEsperaController };
