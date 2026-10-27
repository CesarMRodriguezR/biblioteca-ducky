'use strict';

const HttpError = require('../utils/HttpError');

/**
 * Valida req[origen] con un esquema zod y reemplaza el valor por el parseado.
 * origen: 'body' | 'query' | 'params'
 */
const validar = (esquema, origen = 'body') => (req, _res, next) => {
  const resultado = esquema.safeParse(req[origen]);
  if (!resultado.success) {
    // Un mensaje por campo (el primero), como se muestra bajo cada input.
    const porCampo = new Map();
    resultado.error.issues.forEach((i) => {
      const campo = i.path.join('.');
      if (!porCampo.has(campo)) porCampo.set(campo, i.message);
    });
    const detalles = [...porCampo].map(([campo, mensaje]) => ({ campo, mensaje }));
    return next(HttpError.badRequest('Revisa los campos marcados.', detalles));
  }
  if (origen === 'query') {
    req.validQuery = resultado.data;
  } else {
    req[origen] = resultado.data;
  }
  return next();
};

module.exports = validar;
