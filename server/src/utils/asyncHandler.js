/** Envuelve un controlador async para que los errores lleguen al errorHandler. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export { asyncHandler };
