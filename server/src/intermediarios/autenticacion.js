import jwt from 'jsonwebtoken';
import { ENTORNO } from '../configuracion/entorno.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloUsuario } from '../modelos/ModeloUsuario.js';

/**
 * Verifica el token Bearer y carga en req.usuario los datos y funciones
 * vigentes del usuario (se leen de la BD para reflejar cambios de perfil).
 */
async function Autenticar(req, _res, next) 
{
  try 
  {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) 
    {
      throw ErrorHttp.NoAutenticado();
    }

    let payload;
    try 
    {
      payload = jwt.verify(token, ENTORNO.JWT.SECRETO);
    }
    catch 
    {
      throw ErrorHttp.NoAutenticado('Sesión inválida o expirada');
    }

    const usuario = await ModeloUsuario.BuscarSesionPorId(payload.sub);
    if (!usuario || usuario.Estatus !== 'Activo') 
    {
      throw ErrorHttp.NoAutenticado('Usuario inactivo o inexistente');
    }

    req.usuario = usuario;
    next();
  }
  catch (error) 
  {
    next(error);
  }
}

/** Exige que el usuario tenga al menos una de las funciones indicadas. */
function RequiereFuncion(...funciones) 
{
  return (req, _res, next) => 
  {
    const propias = req.usuario?.funciones || [];
    if (funciones.some((funcion) => propias.includes(funcion))) 
    {
      return next();
    }
    return next(ErrorHttp.Prohibido());
  };
}

/** Indica si el usuario autenticado tiene una función. */
function TieneFuncion(req, funcion) 
{
  return (req.usuario?.funciones || []).includes(funcion);
}

export { Autenticar, RequiereFuncion, TieneFuncion };
