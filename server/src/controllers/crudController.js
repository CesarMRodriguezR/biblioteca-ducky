'use strict';

const HttpError = require('../utils/HttpError');

/**
 * Genera los manejadores CRUD estándar para un modelo basado en BaseModel.
 * @param {import('../models/BaseModel')} model
 * @param {string} nombre  Nombre legible del recurso para los mensajes
 */
function crudController(model, nombre) {
  return {
    async listar(req, res) {
      res.json(await model.findAll(req.validQuery || {}));
    },

    async obtener(req, res) {
      const registro = await model.findById(req.params.id);
      if (!registro) throw HttpError.notFound(`${nombre} no encontrado`);
      res.json(registro);
    },

    async crear(req, res) {
      res.status(201).json(await model.create(req.body));
    },

    async actualizar(req, res) {
      const existe = await model.findById(req.params.id);
      if (!existe) throw HttpError.notFound(`${nombre} no encontrado`);
      res.json(await model.update(req.params.id, req.body));
    },

    async eliminar(req, res) {
      const eliminado = await model.remove(req.params.id);
      if (!eliminado) throw HttpError.notFound(`${nombre} no encontrado`);
      res.status(204).end();
    },
  };
}

module.exports = crudController;
