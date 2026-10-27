import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { UsuarioModel } from '../models/UsuarioModel.js';

const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.';

const AuthController = {
  /**
   * POST /auth/login — inicia sesión con usuario y contraseña.
   * Tras 5 intentos fallidos la cuenta queda Bloqueada.
   */
  async login(req, res) {
    const { Nombre_Usuario, Contrasena_Usuario } = req.body;
    const usuario = await UsuarioModel.findParaLogin(Nombre_Usuario.toLowerCase());

    if (!usuario) {
      throw new HttpError(401, MENSAJE_CREDENCIALES, { codigo: 'CREDENCIALES' });
    }
    if (usuario.Estatus === 'Bloqueado') {
      throw new HttpError(403, 'Tu cuenta está bloqueada por intentos fallidos. Acude al mostrador de la biblioteca.', {
        codigo: 'CUENTA_BLOQUEADA',
      });
    }
    if (usuario.Estatus === 'Inactivo') {
      throw new HttpError(403, 'Tu cuenta está inactiva. Acude al mostrador de la biblioteca.', { codigo: 'CUENTA_INACTIVA' });
    }

    const valido = await UsuarioModel.verificarContrasena(Contrasena_Usuario, usuario.Contrasena_Usuario);
    if (!valido) {
      const { intentosRestantes, estatus } = await UsuarioModel.registrarIntentoFallido(usuario.id_usuario);
      if (estatus === 'Bloqueado') {
        throw new HttpError(403, 'Tu cuenta se bloqueó por demasiados intentos fallidos. Acude al mostrador de la biblioteca.', {
          codigo: 'CUENTA_BLOQUEADA',
        });
      }
      throw new HttpError(401, MENSAJE_CREDENCIALES, { codigo: 'CREDENCIALES', intentosRestantes });
    }

    await UsuarioModel.reiniciarIntentos(usuario.id_usuario);
    const token = jwt.sign({ sub: usuario.id_usuario, perfil: usuario.id_perfil }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    });
    res.json({ token, usuario: await UsuarioModel.findSesionById(usuario.id_usuario) });
  },

  /** GET /auth/me — datos de la sesión y funciones habilitadas. */
  async me(req, res) {
    res.json(req.usuario);
  },

  /** PUT /auth/contrasena — el usuario cambia su propia contraseña. */
  async cambiarContrasena(req, res) {
    const { actual, nueva } = req.body;
    const usuario = await UsuarioModel.findParaLogin(req.usuario.Nombre_Usuario);
    const valido = await UsuarioModel.verificarContrasena(actual, usuario.Contrasena_Usuario);
    if (!valido) throw HttpError.badRequest('La contraseña actual no es correcta.');
    await UsuarioModel.update(req.usuario.id_usuario, { Contrasena_Usuario: nueva });
    res.status(204).end();
  },
};

export { AuthController };
