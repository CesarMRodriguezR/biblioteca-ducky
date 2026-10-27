import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloChatbot } from '../modelos/ModeloChatbot.js';

const ControladorChatbot = {
  /** POST /chatbot/preguntar — responde con la pregunta frecuente más parecida. */
  async Preguntar(req, res) 
  {
    res.json(await ModeloChatbot.Responder(req.body.texto));
  },

  async Frecuentes(_req, res) 
  {
    res.json(await ModeloChatbot.PreguntasFrecuentes(10));
  },

  async Listar(_req, res) 
  {
    res.json(await ModeloChatbot.Listar());
  },

  async Obtener(req, res) 
  {
    const pregunta = await ModeloChatbot.BuscarPregunta(req.params.id);
    if (!pregunta) 
    {
      throw ErrorHttp.NoEncontrado('Pregunta no encontrada');
    }
    res.json(pregunta);
  },

  async Crear(req, res) 
  {
    res.status(201).json(await ModeloChatbot.Crear(req.body));
  },

  async Actualizar(req, res) 
  {
    const existe = await ModeloChatbot.BuscarPregunta(req.params.id);
    if (!existe) 
    {
      throw ErrorHttp.NoEncontrado('Pregunta no encontrada');
    }
    res.json(await ModeloChatbot.Actualizar(req.params.id, req.body));
  },

  async Eliminar(req, res) 
  {
    const ok = await ModeloChatbot.Eliminar(req.params.id);
    if (!ok) 
    {
      throw ErrorHttp.NoEncontrado('Pregunta no encontrada');
    }
    res.status(204).end();
  },
};

export { ControladorChatbot };
