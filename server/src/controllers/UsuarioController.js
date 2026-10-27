import { HttpError } from '../utils/HttpError.js';
import { UsuarioModel } from '../models/UsuarioModel.js';
import { PerfilModel } from '../models/PerfilModel.js';
import { BitacoraModel } from '../models/BitacoraModel.js';
import { crudController } from './crudController.js';

const UsuarioController = {
  /** GET /usuarios — "Usuarios válidos" con búsqueda por matrícula y paginación. */
  async listar(req, res) {
    const { q, id_perfil: idPerfil, estatus, limit, offset } = req.validQuery;
    const resultado = await UsuarioModel.findAll({ q, idPerfil, estatus, limit, offset });
    res.json({ ...resultado, limit, offset });
  },

  async obtener(req, res) {
    const usuario = await UsuarioModel.findDetalle(req.params.id);
    if (!usuario) throw HttpError.notFound('Usuario no encontrado');
    res.json(usuario);
  },

  /** GET /usuarios/matricula/:matricula — consulta de un usuario. */
  async porMatricula(req, res) {
    const usuario = await UsuarioModel.findByMatricula(req.params.matricula);
    if (!usuario) {
      throw HttpError.notFound('No hay ningún usuario registrado con esa matrícula o número de nómina.');
    }
    res.json(await UsuarioModel.findDetalle(usuario.id_usuario));
  },

  async crear(req, res) {
    const usuario = await UsuarioModel.create(req.body);
    await BitacoraModel.registrar(req.usuario.id_usuario, 'ALTA_CUENTA', `Alta de cuenta: ${usuario.Nombre_Usuario}`);
    res.status(201).json(usuario);
  },

  /**
   * PUT /usuarios/:id — cambio de datos. Si algo no es válido no se
   * guarda nada y se conserva la información anterior.
   */
  async actualizar(req, res) {
    const existe = await UsuarioModel.findById(req.params.id);
    if (!existe) throw HttpError.notFound('Usuario no encontrado');
    const esPropio = Number(req.params.id) === req.usuario.id_usuario;
    if (esPropio && req.body.Estatus && req.body.Estatus !== 'Activo') {
      throw HttpError.badRequest('No puedes desactivar tu propia cuenta.');
    }
    if (esPropio && req.body.id_perfil && req.body.id_perfil !== existe.id_perfil) {
      throw HttpError.badRequest('No puedes cambiar el perfil de tu propia cuenta.');
    }
    const usuario = await UsuarioModel.update(req.params.id, req.body);
    await BitacoraModel.registrar(req.usuario.id_usuario, 'CAMBIO_USUARIO', `Cambio de datos de ${usuario.Nombre_Usuario}`);
    res.json(usuario);
  },

  /** POST /usuarios/carga/validar — revisión previa de la lista cargada. */
  async validarLista(req, res) {
    res.json(await UsuarioModel.validarLista(req.body.filas));
  },

  /** POST /usuarios/carga — crea las cuentas con el rol asignado a cada fila. */
  async crearDesdeLista(req, res) {
    const resultado = await UsuarioModel.crearDesdeLista(req.body.cuentas);
    if (resultado.creados.length) {
      await BitacoraModel.registrar(
        req.usuario.id_usuario,
        'ALTA_CUENTAS',
        `Alta de cuentas por lista: ${resultado.creados.length} ${resultado.creados.length === 1 ? 'cuenta creada' : 'cuentas creadas'}`,
      );
    }
    res.status(resultado.creados.length ? 201 : 200).json(resultado);
  },

  /** POST /usuarios/bajas/revisar — quienes ya no aparecen en la nueva lista. */
  async revisarBajas(req, res) {
    res.json(await UsuarioModel.revisarBajas(req.body.matriculas));
  },

  /** POST /usuarios/bajas — baja de cuentas sin préstamos ni multas pendientes. */
  async darDeBaja(req, res) {
    const ids = req.body.ids.filter((id) => id !== req.usuario.id_usuario);
    const resultado = await UsuarioModel.darDeBaja(ids);
    if (resultado.dadosDeBaja.length) {
      await BitacoraModel.registrar(
        req.usuario.id_usuario,
        'BAJA_CUENTAS',
        `Baja de cuentas: ${resultado.dadosDeBaja.map((u) => u.Nombre_Usuario).join(', ')}`,
      );
    }
    res.json(resultado);
  },
};

const PerfilController = {
  ...crudController(PerfilModel, 'Perfil'),

  /** GET /perfiles — roles con sus funciones (pantalla "Gestión de perfiles"). */
  async listar(_req, res) {
    res.json(await PerfilModel.findAllConFunciones());
  },

  async asignarFunciones(req, res) {
    const perfil = await PerfilModel.setFunciones(req.params.id, req.body.funciones);
    await BitacoraModel.registrar(req.usuario.id_usuario, 'CAMBIO_PERFIL', `Funciones actualizadas del perfil ${perfil.Nombre_Rol}`);
    res.json(perfil);
  },
};

export { UsuarioController, PerfilController };
