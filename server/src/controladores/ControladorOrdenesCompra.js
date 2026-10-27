import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloOrdenCompra } from '../modelos/ModeloOrdenCompra.js';
import { ModeloBitacora } from '../modelos/ModeloBitacora.js';
import { TieneFuncion } from '../intermediarios/autenticacion.js';

const ControladorOrdenesCompra = {
  /** Quien gestiona compras ve todas las órdenes; los demás, solo las suyas. */
  async Listar(req, res) 
  {
    const { estatus, limit, offset } = req.consulta_valida;
    const id_usuario = TieneFuncion(req, 'gestionar_compras') ? undefined : req.usuario.id_usuario;
    res.json(await ModeloOrdenCompra.Listar({ id_usuario, estatus, limit, offset }));
  },

  /** GET /ordenes-compra/solicitudes — renglones abiertos ("Solicitudes pendientes"). */
  async Solicitudes(_req, res) 
  {
    res.json(await ModeloOrdenCompra.SolicitudesAbiertas());
  },

  async Obtener(req, res) 
  {
    const orden = await ModeloOrdenCompra.BuscarPorId(req.params.id);
    if (!orden) 
    {
      throw ErrorHttp.NoEncontrado('Orden no encontrada');
    }
    if (!TieneFuncion(req, 'gestionar_compras') && orden.id_usuario !== req.usuario.id_usuario) 
    {
      throw ErrorHttp.Prohibido();
    }
    res.json(orden);
  },

  async Crear(req, res) 
  {
    const orden = await ModeloOrdenCompra.Crear(req.body, req.usuario.id_usuario);
    const renglones = [...orden.libros_existentes, ...orden.libros_nuevos];
    const descripcion = renglones
      .map(
        (renglon) => `${renglon.Titulo} · ${renglon.Num_Ejemplares} ${renglon.Num_Ejemplares === 1 ? 'copia' : 'copias'}`,
      )
      .join('; ');
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'SOLICITUD_COMPRA',
      `Solicitud de compra: ${descripcion}`,
    );
    res.status(201).json(orden);
  },

  async CambiarEstatus(req, res) 
  {
    const orden = await ModeloOrdenCompra.CambiarEstatus(req.params.id, req.body.Estatus);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'ESTATUS_COMPRA',
      `Solicitud de compra #${orden.id_orden} → ${orden.Estatus}`,
    );
    res.json(orden);
  },
};

export { ControladorOrdenesCompra };
