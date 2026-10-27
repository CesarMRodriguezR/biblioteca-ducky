/**
 * Controladores de los módulos "Préstamo Libros" y "Devolución Préstamos":
 * préstamos, devoluciones, renovaciones, multas y lista de espera.
 *
 * Regla general de alcance: quien tiene la función de gestión ve y opera
 * sobre todos los usuarios; los demás solo sobre sus propios registros.
 */
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloPrestamo } from '../modelos/ModeloPrestamo.js';
import { ModeloMulta } from '../modelos/ModeloMulta.js';
import { ModeloListaEspera } from '../modelos/ModeloListaEspera.js';
import { TieneFuncion } from '../intermediarios/autenticacion.js';

/** Devuelve el id de usuario a filtrar según los permisos. */
function CalcularAlcance(req, funcion_gestion, id_solicitado) 
{
  if (TieneFuncion(req, funcion_gestion)) 
  {
    return id_solicitado;
  }
  return req.usuario.id_usuario;
}

function VerificarPropietario(req, registro, funcion_gestion) 
{
  if (!TieneFuncion(req, funcion_gestion) && registro.id_usuario !== req.usuario.id_usuario) 
  {
    throw ErrorHttp.Prohibido();
  }
}

const ControladorPrestamos = {
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

  /** POST /prestamos — un usuario pide para sí; el bibliotecario puede indicar id_usuario. */
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

  /** POST /prestamos/:id/devolucion */
  async Devolver(req, res) 
  {
    const resultado = await ModeloPrestamo.Devolver(req.params.id, {
      fecha_devolucion: req.body?.Fecha_Devolucion,
    });
    res.status(201).json(resultado);
  },

  /** POST /prestamos/:id/renovacion */
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

const ControladorMultas = {
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

  async Crear(req, res) 
  {
    res.status(201).json(await ModeloMulta.Crear(req.body));
  },

  async Pagar(req, res) 
  {
    res.json(await ModeloMulta.Pagar(req.params.id, req.body?.Fecha_Pagado));
  },
};

const ControladorListaEspera = {
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

  async Inscribir(req, res) 
  {
    res
      .status(201)
      .json(await ModeloListaEspera.Inscribir(req.usuario.id_usuario, req.body.id_libro));
  },

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
