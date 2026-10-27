/*
 * ******************************************************************
 * Nombre del programa: API-CRUD · CrearControladorCrud.js
 * Función: Generar los manejadores de listar, obtener, crear, actualizar y eliminar para los
 *          catálogos simples.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Modelo basado en ModeloBase y nombre del recurso
 * Salida: Objeto con los manejadores HTTP
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                 Objetivo
 *     CrearControladorCrud   Genera los manejadores CRUD estándar para un modelo…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador: recibe la petición ya validada y responde con los datos del modelo.
 * (2) El modelo debe ser una instancia de ModeloBase (ModelosCatalogo.js).
 * ******************************************************************
 */

import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Función: CrearControladorCrud
 * Objetivo: Genera los manejadores CRUD estándar para un modelo basado en BaseModel.
 * Entrada: modelo, nombre
 * Salida: Objeto con Listar, Obtener, Crear, Actualizar y Eliminar
 */
function CrearControladorCrud(modelo, nombre)
{
  return {
    async Listar(req, res)
    {
      res.json(await modelo.BuscarTodos(req.consulta_valida || {}));
    },

    async Obtener(req, res)
    {
      const registro = await modelo.BuscarPorId(req.params.id);
      if (!registro)
      {
        throw ErrorHttp.NoEncontrado(`${nombre} no encontrado`);
      }
      res.json(registro);
    },

    async Crear(req, res)
    {
      res.status(201).json(await modelo.Crear(req.body));
    },

    async Actualizar(req, res)
    {
      const existe = await modelo.BuscarPorId(req.params.id);
      if (!existe)
      {
        throw ErrorHttp.NoEncontrado(`${nombre} no encontrado`);
      }
      res.json(await modelo.Actualizar(req.params.id, req.body));
    },

    async Eliminar(req, res)
    {
      const eliminado = await modelo.Eliminar(req.params.id);
      if (!eliminado)
      {
        throw ErrorHttp.NoEncontrado(`${nombre} no encontrado`);
      }
      res.status(204).end();
    },
  };
}

export { CrearControladorCrud };
