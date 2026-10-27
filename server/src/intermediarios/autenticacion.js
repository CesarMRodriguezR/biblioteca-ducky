/*
 * ******************************************************************
 * Nombre del programa: API-AUTENTICACION · autenticacion.js
 * Función: Verificar el token de sesión y los permisos (funciones) del usuario.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Petición HTTP de Express (req, res, next)
 * Salida: Llama a next() o responde con un error HTTP
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     Autenticar        Verifica el token Bearer y carga en req.usuario los datos…
 *     RequiereFuncion   Exige que el usuario tenga al menos una de las funciones…
 *     TieneFuncion      Indica si el usuario autenticado tiene una función
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se registran en rutas/rutas.js o aplicacion.js antes del controlador.
 * ******************************************************************
 */

import jwt from 'jsonwebtoken';
import { ENTORNO } from '../configuracion/entorno.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloUsuario } from '../modelos/ModeloUsuario.js';

/*
 * Función: Autenticar
 * Objetivo: Verifica el token Bearer y carga en req.usuario los datos y funciones vigentes del
 *           usuario (se leen de la BD para reflejar cambios de perfil).
 * Entrada: req, _res, next
 * Salida: Promesa; llama a next() o responde 401
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

    let carga_util;
    try
    {
      carga_util = jwt.verify(token, ENTORNO.JWT.SECRETO);
    }
    catch
    {
      throw ErrorHttp.NoAutenticado('Sesión inválida o expirada');
    }

    const usuario = await ModeloUsuario.BuscarSesionPorId(carga_util.sub);
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

/*
 * Función: RequiereFuncion
 * Objetivo: Exige que el usuario tenga al menos una de las funciones indicadas.
 * Entrada: ...funciones
 * Salida: Middleware que responde 403 si no tiene la función
 */
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

/*
 * Función: TieneFuncion
 * Objetivo: Indica si el usuario autenticado tiene una función.
 * Entrada: req, funcion
 * Salida: true si el usuario tiene la función
 */
function TieneFuncion(req, funcion)
{
  return (req.usuario?.funciones || []).includes(funcion);
}

export { Autenticar, RequiereFuncion, TieneFuncion };
