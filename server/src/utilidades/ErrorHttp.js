class ErrorHttp extends Error 
{
  constructor(status, message, details = undefined) 
  {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static SolicitudInvalida(message, details) 
  {
    return new ErrorHttp(400, message, details);
  }
  static NoAutenticado(message = 'No autenticado') 
  {
    return new ErrorHttp(401, message);
  }
  static Prohibido(message = 'No tienes permiso para esta acción') 
  {
    return new ErrorHttp(403, message);
  }
  static NoEncontrado(message = 'Recurso no encontrado') 
  {
    return new ErrorHttp(404, message);
  }
  static Conflicto(message, details) 
  {
    return new ErrorHttp(409, message, details);
  }
}

export { ErrorHttp };
