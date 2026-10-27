/** Envuelve un controlador async para que los errores lleguen al errorHandler. */
const ManejarAsincrono = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export { ManejarAsincrono };
