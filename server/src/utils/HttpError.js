class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) { return new HttpError(400, message, details); }
  static unauthorized(message = 'No autenticado') { return new HttpError(401, message); }
  static forbidden(message = 'No tienes permiso para esta acción') { return new HttpError(403, message); }
  static notFound(message = 'Recurso no encontrado') { return new HttpError(404, message); }
  static conflict(message, details) { return new HttpError(409, message, details); }
}

export { HttpError };
