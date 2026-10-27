import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { UsuarioModel } from '../models/UsuarioModel.js';

/**
 * Verifica el token Bearer y carga en req.usuario los datos y funciones
 * vigentes del usuario (se leen de la BD para reflejar cambios de perfil).
 */
async function autenticar(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw HttpError.unauthorized();
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch {
      throw HttpError.unauthorized('Sesión inválida o expirada');
    }

    const usuario = await UsuarioModel.findSesionById(payload.sub);
    if (!usuario || usuario.Estatus !== 'Activo') {
      throw HttpError.unauthorized('Usuario inactivo o inexistente');
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
}

/** Exige que el usuario tenga al menos una de las funciones indicadas. */
function requiereFuncion(...funciones) {
  return (req, _res, next) => {
    const propias = req.usuario?.funciones || [];
    if (funciones.some((f) => propias.includes(f))) {
      return next();
    }
    return next(HttpError.forbidden());
  };
}

/** Indica si el usuario autenticado tiene una función. */
function tieneFuncion(req, funcion) {
  return (req.usuario?.funciones || []).includes(funcion);
}

export { autenticar, requiereFuncion, tieneFuncion };
