import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/**
 * Valida req[origen] con un esquema zod y reemplaza el valor por el parseado.
 * origen: 'body' | 'query' | 'params'
 */
const Validar =
  (esquema, origen = 'body') =>
    (req, _res, next) => 
    {
      const resultado = esquema.safeParse(req[origen]);
      if (!resultado.success) 
      {
      // Un mensaje por campo (el primero), como se muestra bajo cada input.
        const por_campo = new Map();
        resultado.error.issues.forEach((issue) => 
        {
          const campo = issue.path.join('.');
          if (!por_campo.has(campo)) 
          {
            por_campo.set(campo, issue.message);
          }
        });
        const detalles = [...por_campo].map(([campo, mensaje]) => ({ campo, mensaje }));
        return next(ErrorHttp.SolicitudInvalida('Revisa los campos marcados.', detalles));
      }
      if (origen === 'query') 
      {
        req.consulta_valida = resultado.data;
      }
      else 
      {
        req[origen] = resultado.data;
      }
      return next();
    };

export { Validar };
