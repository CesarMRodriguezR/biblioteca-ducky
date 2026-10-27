/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ControladorUsuarios.js
 * Función: Consulta, cambio, alta y baja por lista de usuarios, y funciones de los perfiles.
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
 *     Módulo                Objetivo
 *     ControladorUsuarios   Manejadores de la gestión de usuarios
 *     ControladorPerfiles   Manejadores de perfiles y funciones
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
import { ModeloUsuario } from '../modelos/ModeloUsuario.js';
import { ModeloPerfil } from '../modelos/ModeloPerfil.js';
import { ModeloBitacora } from '../modelos/ModeloBitacora.js';
import { CrearControladorCrud } from './CrearControladorCrud.js';

/*
 * Módulo: ControladorUsuarios
 * Objetivo: Manejadores de la gestión de usuarios.
 */
const ControladorUsuarios = {
  /*
   * Función: Listar
   * Objetivo: GET /usuarios — "Usuarios válidos" con búsqueda por matrícula y paginación.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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

  /*
   * Función: Obtener
   * Objetivo: Atender GET /api/usuarios/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Obtener(req, res)
  {
    const usuario = await ModeloUsuario.BuscarDetalle(req.params.id);
    if (!usuario)
    {
      throw ErrorHttp.NoEncontrado('Usuario no encontrado');
    }
    res.json(usuario);
  },

  /*
   * Función: PorMatricula
   * Objetivo: GET /usuarios/matricula/:matricula — consulta de un usuario.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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

  /*
   * Función: Crear
   * Objetivo: Atender POST /api/usuarios.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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

  /*
   * Función: Actualizar
   * Objetivo: PUT /usuarios/:id — cambio de datos. Si algo no es válido no se guarda nada y se
   *           conserva la información anterior.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
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

  /*
   * Función: ValidarLista
   * Objetivo: POST /usuarios/carga/validar — revisión previa de la lista cargada.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async ValidarLista(req, res)
  {
    res.json(await ModeloUsuario.ValidarLista(req.body.filas));
  },

  /*
   * Función: CrearDesdeLista
   * Objetivo: POST /usuarios/carga — crea las cuentas con el rol asignado a cada fila.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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

  /*
   * Función: RevisarBajas
   * Objetivo: POST /usuarios/bajas/revisar — quienes ya no aparecen en la nueva lista.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async RevisarBajas(req, res)
  {
    res.json(await ModeloUsuario.RevisarBajas(req.body.matriculas));
  },

  /*
   * Función: DarDeBaja
   * Objetivo: POST /usuarios/bajas — baja de cuentas sin préstamos ni multas pendientes.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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

/*
 * Módulo: ControladorPerfiles
 * Objetivo: Manejadores de perfiles y funciones.
 */
const ControladorPerfiles = {
  ...CrearControladorCrud(ModeloPerfil, 'Perfil'),

  /*
   * Función: Listar
   * Objetivo: GET /perfiles — roles con sus funciones (pantalla "Gestión de perfiles").
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Listar(_req, res)
  {
    res.json(await ModeloPerfil.BuscarTodosConFunciones());
  },

  /*
   * Función: AsignarFunciones
   * Objetivo: Atender PUT /api/perfiles/:id/funciones.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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
