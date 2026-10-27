/*
 * ******************************************************************
 * Nombre del programa: API-CIRCULACION · ControladorCirculacion.js
 * Función: Préstamos, devoluciones, renovaciones, multas y lista de espera.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Peticiones HTTP enrutadas desde rutas/rutas.js
 * Salida: Respuestas HTTP en formato JSON
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                   Objetivo
 *     CalcularAlcance          Devuelve el id de usuario a filtrar según los permisos
 *     VerificarPropietario     Rechazar con 403 si el registro no es del usuario y no…
 *     ControladorPrestamos     Manejadores de préstamos, devoluciones y renovaciones
 *     ControladorMultas        Manejadores de multas y su pago
 *     ControladorListaEspera   Manejadores de la lista de espera
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no contiene SQL; usa los modelos de src/modelos.
 * (2) Cada método se registra en rutas/rutas.js envuelto en ManejarAsincrono, que envía los
 *     errores a ManejarErrores.
 * (3) Los permisos se revisan antes (RequiereFuncion) y los datos llegan validados por los
 *     esquemas zod.
 * (4) Los errores de regla de negocio se lanzan como ErrorHttp con el código HTTP
 *     correspondiente.
 * ******************************************************************
 */

import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloPrestamo } from '../modelos/ModeloPrestamo.js';
import { ModeloMulta } from '../modelos/ModeloMulta.js';
import { ModeloListaEspera } from '../modelos/ModeloListaEspera.js';
import { TieneFuncion } from '../intermediarios/autenticacion.js';

/*
 * Función: CalcularAlcance
 * Objetivo: Devuelve el id de usuario a filtrar según los permisos.
 * Entrada: req, funcion_gestion, id_solicitado
 * Salida: id_usuario a filtrar o undefined si puede ver todos
 */
function CalcularAlcance(req, funcion_gestion, id_solicitado)
{
  if (TieneFuncion(req, funcion_gestion))
  {
    return id_solicitado;
  }
  return req.usuario.id_usuario;
}

/*
 * Función: VerificarPropietario
 * Objetivo: Rechazar con 403 si el registro no es del usuario y no tiene la función de gestión.
 * Entrada: req, registro, funcion_gestion
 * Salida: Ninguna (lanza ErrorHttp)
 */
function VerificarPropietario(req, registro, funcion_gestion)
{
  if (!TieneFuncion(req, funcion_gestion) && registro.id_usuario !== req.usuario.id_usuario)
  {
    throw ErrorHttp.Prohibido();
  }
}

/*
 * Módulo: ControladorPrestamos
 * Objetivo: Manejadores de préstamos, devoluciones y renovaciones.
 */
const ControladorPrestamos = {
  /*
   * Función: Listar
   * Objetivo: Atender GET /api/prestamos.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Listar(req, res)
  {
    const { id_usuario, estado, limit, offset } = req.consulta_valida;
    res.json(
      await ModeloPrestamo.Listar({
        id_usuario: CalcularAlcance(req, 'gestionar_prestamos', id_usuario),
        estado,
        limit,
        offset,
      }),
    );
  },

  /*
   * Función: Obtener
   * Objetivo: Atender GET /api/prestamos/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Obtener(req, res)
  {
    const prestamo = await ModeloPrestamo.BuscarPorId(req.params.id);
    if (!prestamo)
    {
      throw ErrorHttp.NoEncontrado('Préstamo no encontrado');
    }
    VerificarPropietario(req, prestamo, 'gestionar_prestamos');
    res.json(prestamo);
  },

  /*
   * Función: Crear
   * Objetivo: POST /prestamos — un usuario pide para sí; el bibliotecario puede indicar
   *           id_usuario.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Crear(req, res)
  {
    const { id_libro, num_copia, id_usuario: id_solicitado } = req.body;
    if (
      id_solicitado &&
      id_solicitado !== req.usuario.id_usuario &&
      !TieneFuncion(req, 'gestionar_prestamos')
    )
    {
      throw ErrorHttp.Prohibido('Solo puedes solicitar préstamos para ti');
    }
    const prestamo = await ModeloPrestamo.Prestar({
      id_usuario: id_solicitado || req.usuario.id_usuario,
      id_libro,
      num_copia,
    });
    res.status(201).json(prestamo);
  },

  /*
   * Función: Devolver
   * Objetivo: POST /prestamos/:id/devolucion
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Devolver(req, res)
  {
    const resultado = await ModeloPrestamo.Devolver(req.params.id, {
      fecha_devolucion: req.body?.Fecha_Devolucion,
    });
    res.status(201).json(resultado);
  },

  /*
   * Función: Renovar
   * Objetivo: POST /prestamos/:id/renovacion
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Renovar(req, res)
  {
    const prestamo = await ModeloPrestamo.BuscarPorId(req.params.id);
    if (!prestamo)
    {
      throw ErrorHttp.NoEncontrado('Préstamo no encontrado');
    }
    VerificarPropietario(req, prestamo, 'gestionar_prestamos');
    res.status(201).json(await ModeloPrestamo.Renovar(req.params.id));
  },
};

/*
 * Módulo: ControladorMultas
 * Objetivo: Manejadores de multas y su pago.
 */
const ControladorMultas = {
  /*
   * Función: Listar
   * Objetivo: Atender GET /api/multas.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Listar(req, res)
  {
    const { id_usuario, pendientes, limit, offset } = req.consulta_valida;
    res.json(
      await ModeloMulta.Listar({
        id_usuario: CalcularAlcance(req, 'gestionar_multas', id_usuario),
        pendientes,
        limit,
        offset,
      }),
    );
  },

  /*
   * Función: Obtener
   * Objetivo: Atender GET /api/multas/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Obtener(req, res)
  {
    const multa = await ModeloMulta.BuscarPorId(req.params.id);
    if (!multa)
    {
      throw ErrorHttp.NoEncontrado('Multa no encontrada');
    }
    VerificarPropietario(req, multa, 'gestionar_multas');
    res.json(multa);
  },

  /*
   * Función: Crear
   * Objetivo: Atender POST /api/multas.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Crear(req, res)
  {
    res.status(201).json(await ModeloMulta.Crear(req.body));
  },

  /*
   * Función: Pagar
   * Objetivo: Atender POST /api/multas/:id/pago.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Pagar(req, res)
  {
    res.json(await ModeloMulta.Pagar(req.params.id, req.body?.Fecha_Pagado));
  },
};

/*
 * Módulo: ControladorListaEspera
 * Objetivo: Manejadores de la lista de espera.
 */
const ControladorListaEspera = {
  /*
   * Función: Listar
   * Objetivo: Atender GET /api/lista-espera.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Listar(req, res)
  {
    const {
      id_usuario,
      id_libro,
      estatus,
      limit,
      offset,
    } = req.consulta_valida;
    res.json(
      await ModeloListaEspera.Listar({
        id_usuario: CalcularAlcance(req, 'gestionar_prestamos', id_usuario),
        id_libro,
        estatus,
        limit,
        offset,
      }),
    );
  },

  /*
   * Función: Inscribir
   * Objetivo: Atender POST /api/lista-espera.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Inscribir(req, res)
  {
    res
      .status(201)
      .json(await ModeloListaEspera.Inscribir(req.usuario.id_usuario, req.body.id_libro));
  },

  /*
   * Función: Cancelar
   * Objetivo: Atender DELETE /api/lista-espera/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Cancelar(req, res)
  {
    const registro = await ModeloListaEspera.BuscarPorId(req.params.id);
    if (!registro)
    {
      throw ErrorHttp.NoEncontrado('Registro de lista de espera no encontrado');
    }
    VerificarPropietario(req, registro, 'gestionar_prestamos');
    res.json(await ModeloListaEspera.Cancelar(req.params.id));
  },
};

export { ControladorPrestamos, ControladorMultas, ControladorListaEspera };
