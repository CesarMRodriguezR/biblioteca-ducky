/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU01 · ControladorAutenticacion.js
 * Función: Inicio de sesión, datos de la sesión y cambio de contraseña.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Peticiones HTTP enrutadas desde rutas/rutas.js
 * Salida: Respuestas HTTP en formato JSON
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                     Objetivo
 *     ControladorAutenticacion   Manejadores de inicio de sesión y sesión del usuario
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no contiene SQL; usa los modelos de src/modelos.
 * (2) Cada método se registra en rutas/rutas.js envuelto en ManejarAsincrono, que envía los
 *     errores a ManejarErrores.
 * (3) Los permisos se revisan antes (RequiereFuncion) y los datos llegan validados por los
 *     esquemas zod.
 * (4) Los errores de regla de negocio se lanzan como ErrorHttp con el código HTTP
 *     correspondiente.
 * ******************************************************************
 */

import jwt from 'jsonwebtoken';
import { ENTORNO } from '../configuracion/entorno.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloUsuario } from '../modelos/ModeloUsuario.js';

const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.';

/*
 * Módulo: ControladorAutenticacion
 * Objetivo: Manejadores de inicio de sesión y sesión del usuario.
 */
const ControladorAutenticacion = {
  /*
   * Función: IniciarSesion
   * Objetivo: POST /auth/login — inicia sesión con usuario y contraseña. Las cuentas
   *           Inactivas (las marca el administrador) no pueden entrar.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async IniciarSesion(req, res)
  {
    const { Nombre_Usuario, Contrasena_Usuario } = req.body;
    const usuario = await ModeloUsuario.BuscarParaInicioSesion(Nombre_Usuario.toLowerCase());

    if (!usuario)
    {
      throw new ErrorHttp(401, MENSAJE_CREDENCIALES, { codigo: 'CREDENCIALES' });
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
      throw new ErrorHttp(401, MENSAJE_CREDENCIALES, { codigo: 'CREDENCIALES' });
    }

    const token = jwt.sign(
      { sub: usuario.id_usuario, perfil: usuario.id_perfil },
      ENTORNO.JWT.SECRETO,
      {
        expiresIn: ENTORNO.JWT.EXPIRA_EN,
      },
    );
    res.json({ token, usuario: await ModeloUsuario.BuscarSesionPorId(usuario.id_usuario) });
  },

  /*
   * Función: ObtenerSesion
   * Objetivo: GET /auth/me — datos de la sesión y funciones habilitadas.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async ObtenerSesion(req, res)
  {
    res.json(req.usuario);
  },

  /*
   * Función: CambiarContrasena
   * Objetivo: PUT /auth/contrasena — el usuario cambia su propia contraseña.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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
