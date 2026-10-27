import jwt from 'jsonwebtoken';
import { ENTORNO } from '../configuracion/entorno.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloUsuario } from '../modelos/ModeloUsuario.js';

const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.';

const ControladorAutenticacion = {
  /**
   * POST /auth/login — inicia sesión con usuario y contraseña.
   * Tras 5 intentos fallidos la cuenta queda Bloqueada.
   */
  async IniciarSesion(req, res) 
  {
    const { Nombre_Usuario, Contrasena_Usuario } = req.body;
    const usuario = await ModeloUsuario.BuscarParaInicioSesion(Nombre_Usuario.toLowerCase());

    if (!usuario) 
    {
      throw new ErrorHttp(401, MENSAJE_CREDENCIALES, { codigo: 'CREDENCIALES' });
    }
    if (usuario.Estatus === 'Bloqueado') 
    {
      throw new ErrorHttp(
        403,
        'Tu cuenta está bloqueada por intentos fallidos. Acude al mostrador de la biblioteca.',
        {
          codigo: 'CUENTA_BLOQUEADA',
        },
      );
    }
    if (usuario.Estatus === 'Inactivo') 
    {
      throw new ErrorHttp(403, 'Tu cuenta está inactiva. Acude al mostrador de la biblioteca.', {
        codigo: 'CUENTA_INACTIVA',
      });
    }

    const valido = await ModeloUsuario.VerificarContrasena(
      Contrasena_Usuario,
      usuario.Contrasena_Usuario,
    );
    if (!valido) 
    {
      const { intentos_restantes, estatus } =
        await ModeloUsuario.RegistrarIntentoFallido(usuario.id_usuario);
      if (estatus === 'Bloqueado') 
      {
        throw new ErrorHttp(
          403,
          'Tu cuenta se bloqueó por demasiados intentos fallidos. Acude al mostrador de la biblioteca.',
          {
            codigo: 'CUENTA_BLOQUEADA',
          },
        );
      }
      throw new ErrorHttp(401, MENSAJE_CREDENCIALES, {
        codigo: 'CREDENCIALES',
        intentos_restantes,
      });
    }

    await ModeloUsuario.ReiniciarIntentos(usuario.id_usuario);
    const token = jwt.sign(
      { sub: usuario.id_usuario, perfil: usuario.id_perfil },
      ENTORNO.JWT.SECRETO,
      {
        expiresIn: ENTORNO.JWT.EXPIRA_EN,
      },
    );
    res.json({ token, usuario: await ModeloUsuario.BuscarSesionPorId(usuario.id_usuario) });
  },

  /** GET /auth/me — datos de la sesión y funciones habilitadas. */
  async ObtenerSesion(req, res) 
  {
    res.json(req.usuario);
  },

  /** PUT /auth/contrasena — el usuario cambia su propia contraseña. */
  async CambiarContrasena(req, res) 
  {
    const { actual, nueva } = req.body;
    const usuario = await ModeloUsuario.BuscarParaInicioSesion(req.usuario.Nombre_Usuario);
    const valido = await ModeloUsuario.VerificarContrasena(actual, usuario.Contrasena_Usuario);
    if (!valido) 
    {
      throw ErrorHttp.SolicitudInvalida('La contraseña actual no es correcta.');
    }
    await ModeloUsuario.Actualizar(req.usuario.id_usuario, { Contrasena_Usuario: nueva });
    res.status(204).end();
  },
};

export { ControladorAutenticacion };
