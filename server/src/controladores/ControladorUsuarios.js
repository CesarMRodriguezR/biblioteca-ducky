import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloUsuario } from '../modelos/ModeloUsuario.js';
import { ModeloPerfil } from '../modelos/ModeloPerfil.js';
import { ModeloBitacora } from '../modelos/ModeloBitacora.js';
import { CrearControladorCrud } from './CrearControladorCrud.js';

const ControladorUsuarios = {
  /** GET /usuarios — "Usuarios válidos" con búsqueda por matrícula y paginación. */
  async Listar(req, res) 
  {
    const { q: texto_busqueda, id_perfil, estatus, limit, offset } = req.consulta_valida;
    const resultado = await ModeloUsuario.BuscarTodos({
      q: texto_busqueda,
      id_perfil,
      estatus,
      limit,
      offset,
    });
    res.json({ ...resultado, limit, offset });
  },

  async Obtener(req, res) 
  {
    const usuario = await ModeloUsuario.BuscarDetalle(req.params.id);
    if (!usuario) 
    {
      throw ErrorHttp.NoEncontrado('Usuario no encontrado');
    }
    res.json(usuario);
  },

  /** GET /usuarios/matricula/:matricula — consulta de un usuario. */
  async PorMatricula(req, res) 
  {
    const usuario = await ModeloUsuario.BuscarPorMatricula(req.params.matricula);
    if (!usuario) 
    {
      throw ErrorHttp.NoEncontrado(
        'No hay ningún usuario registrado con esa matrícula o número de nómina.',
      );
    }
    res.json(await ModeloUsuario.BuscarDetalle(usuario.id_usuario));
  },

  async Crear(req, res) 
  {
    const usuario = await ModeloUsuario.Crear(req.body);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'ALTA_CUENTA',
      `Alta de cuenta: ${usuario.Nombre_Usuario}`,
    );
    res.status(201).json(usuario);
  },

  /**
   * PUT /usuarios/:id — cambio de datos. Si algo no es válido no se
   * guarda nada y se conserva la información anterior.
   */
  async Actualizar(req, res) 
  {
    const existe = await ModeloUsuario.BuscarPorId(req.params.id);
    if (!existe) 
    {
      throw ErrorHttp.NoEncontrado('Usuario no encontrado');
    }
    const es_propio = Number(req.params.id) === req.usuario.id_usuario;
    if (es_propio && req.body.Estatus && req.body.Estatus !== 'Activo') 
    {
      throw ErrorHttp.SolicitudInvalida('No puedes desactivar tu propia cuenta.');
    }
    if (es_propio && req.body.id_perfil && req.body.id_perfil !== existe.id_perfil) 
    {
      throw ErrorHttp.SolicitudInvalida('No puedes cambiar el perfil de tu propia cuenta.');
    }
    const usuario = await ModeloUsuario.Actualizar(req.params.id, req.body);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'CAMBIO_USUARIO',
      `Cambio de datos de ${usuario.Nombre_Usuario}`,
    );
    res.json(usuario);
  },

  /** POST /usuarios/carga/validar — revisión previa de la lista cargada. */
  async ValidarLista(req, res) 
  {
    res.json(await ModeloUsuario.ValidarLista(req.body.filas));
  },

  /** POST /usuarios/carga — crea las cuentas con el rol asignado a cada fila. */
  async CrearDesdeLista(req, res) 
  {
    const resultado = await ModeloUsuario.CrearDesdeLista(req.body.cuentas);
    if (resultado.creados.length) 
    {
      await ModeloBitacora.Registrar(
        req.usuario.id_usuario,
        'ALTA_CUENTAS',
        `Alta de cuentas por lista: ${resultado.creados.length} ${resultado.creados.length === 1 ? 'cuenta creada' : 'cuentas creadas'}`,
      );
    }
    res.status(resultado.creados.length ? 201 : 200).json(resultado);
  },

  /** POST /usuarios/bajas/revisar — quienes ya no aparecen en la nueva lista. */
  async RevisarBajas(req, res) 
  {
    res.json(await ModeloUsuario.RevisarBajas(req.body.matriculas));
  },

  /** POST /usuarios/bajas — baja de cuentas sin préstamos ni multas pendientes. */
  async DarDeBaja(req, res) 
  {
    const ids = req.body.ids.filter((id) => id !== req.usuario.id_usuario);
    const resultado = await ModeloUsuario.DarDeBaja(ids);
    if (resultado.dados_de_baja.length) 
    {
      await ModeloBitacora.Registrar(
        req.usuario.id_usuario,
        'BAJA_CUENTAS',
        `Baja de cuentas: ${resultado.dados_de_baja.map((elemento) => elemento.Nombre_Usuario).join(', ')}`,
      );
    }
    res.json(resultado);
  },
};

const ControladorPerfiles = {
  ...CrearControladorCrud(ModeloPerfil, 'Perfil'),

  /** GET /perfiles — roles con sus funciones (pantalla "Gestión de perfiles"). */
  async Listar(_req, res) 
  {
    res.json(await ModeloPerfil.BuscarTodosConFunciones());
  },

  async AsignarFunciones(req, res) 
  {
    const perfil = await ModeloPerfil.AsignarFunciones(req.params.id, req.body.funciones);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'CAMBIO_PERFIL',
      `Funciones actualizadas del perfil ${perfil.Nombre_Rol}`,
    );
    res.json(perfil);
  },
};

export { ControladorUsuarios, ControladorPerfiles };
