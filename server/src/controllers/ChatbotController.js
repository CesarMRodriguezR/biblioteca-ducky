import { HttpError } from '../utils/HttpError.js';
import { ChatbotModel } from '../models/ChatbotModel.js';

const ChatbotController = {
  /** POST /chatbot/preguntar — responde con la pregunta frecuente más parecida. */
  async preguntar(req, res) {
    res.json(await ChatbotModel.responder(req.body.texto));
  },

  async frecuentes(_req, res) {
    res.json(await ChatbotModel.preguntasFrecuentes(10));
  },

  async listar(_req, res) {
    res.json(await ChatbotModel.listar());
  },

  async obtener(req, res) {
    const pregunta = await ChatbotModel.findPregunta(req.params.id);
    if (!pregunta) throw HttpError.notFound('Pregunta no encontrada');
    res.json(pregunta);
  },

  async crear(req, res) {
    res.status(201).json(await ChatbotModel.crear(req.body));
  },

  async actualizar(req, res) {
    const existe = await ChatbotModel.findPregunta(req.params.id);
    if (!existe) throw HttpError.notFound('Pregunta no encontrada');
    res.json(await ChatbotModel.actualizar(req.params.id, req.body));
  },

  async eliminar(req, res) {
    const ok = await ChatbotModel.eliminar(req.params.id);
    if (!ok) throw HttpError.notFound('Pregunta no encontrada');
    res.status(204).end();
  },
};

export { ChatbotController };
