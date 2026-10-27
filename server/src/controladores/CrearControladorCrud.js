import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/**
 * Genera los manejadores CRUD estándar para un modelo basado en BaseModel.
 * @param {import('../models/BaseModel')} model
 * @param {string} nombre  Nombre legible del recurso para los mensajes
 */
function CrearControladorCrud(model, nombre) 
{
  return {
    async Listar(req, res) 
    {
      res.json(await model.BuscarTodos(req.consulta_valida || {}));
    },

    async Obtener(req, res) 
    {
      const registro = await model.BuscarPorId(req.params.id);
      if (!registro) 
      {
        throw ErrorHttp.NoEncontrado(`${nombre} no encontrado`);
      }
      res.json(registro);
    },

    async Crear(req, res) 
    {
      res.status(201).json(await model.Crear(req.body));
    },

    async Actualizar(req, res) 
    {
      const existe = await model.BuscarPorId(req.params.id);
      if (!existe) 
      {
        throw ErrorHttp.NoEncontrado(`${nombre} no encontrado`);
      }
      res.json(await model.Actualizar(req.params.id, req.body));
    },

    async Eliminar(req, res) 
    {
      const eliminado = await model.Eliminar(req.params.id);
      if (!eliminado) 
      {
        throw ErrorHttp.NoEncontrado(`${nombre} no encontrado`);
      }
      res.status(204).end();
    },
  };
}

export { CrearControladorCrud };
