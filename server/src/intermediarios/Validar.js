/*
 * ******************************************************************
 * Nombre del programa: API-VALIDAR · Validar.js
 * Función: Validar el cuerpo, la consulta o los parámetros de la petición con un esquema zod.
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
 *     Módulo       Objetivo
 *     Validar      Valida req[origen] con un esquema zod y reemplaza el…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se registran en rutas/rutas.js o aplicacion.js antes del controlador.
 * ******************************************************************
 */

import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Función: Validar
 * Objetivo: Valida req[origen] con un esquema zod y reemplaza el valor por el parseado. origen:
 *           'body' | 'query' | 'params'
 * Entrada: esquema, origen (opcional)
 * Salida: Middleware de Express
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
        resultado.error.issues.forEach((problema) =>
        {
          const campo = problema.path.join('.');
          if (!por_campo.has(campo))
          {
            por_campo.set(campo, problema.message);
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
