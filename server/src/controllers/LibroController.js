'use strict';

const HttpError = require('../utils/HttpError');
const LibroModel = require('../models/LibroModel');
const EjemplarModel = require('../models/EjemplarModel');
const BitacoraModel = require('../models/BitacoraModel');
const { tieneFuncion } = require('../middlewares/auth');
const { generarListadoPdf } = require('../utils/listadoPdf');

const ETIQUETAS_CAMPO = {
  todos: 'Todos', titulo: 'Título', autor: 'Autor', editorial: 'Editorial', isbn: 'ISBN', anio: 'Año', tema: 'Tema',
};
const ETIQUETAS_MOTIVO = { Perdido: 'Perdido', Robado: 'Robado', Danado: 'Dañado', Obsoleto: 'Obsoleto' };

/** Traduce los parámetros de búsqueda de la URL a filtros del modelo. */
function filtrosDesdeQuery(req) {
  const {
    q, campo, orden, desde, hasta, tema, editorial, disponibles, inactivos,
  } = req.validQuery;
  return {
    q,
    campo,
    orden,
    anioDesde: desde,
    anioHasta: hasta,
    idTema: tema,
    idEditorial: editorial,
    soloDisponibles: disponibles,
    incluirInactivos: Boolean(inactivos) && tieneFuncion(req, 'gestionar_libros'),
  };
}

function describirFiltro({ q, campo }) {
  if (!q) return 'Sin filtro (todos los libros)';
  return `${ETIQUETAS_CAMPO[campo] || 'Todos'} «${q}»`;
}

async function libroEditable(id) {
  const libro = await LibroModel.findById(id);
  if (!libro) throw HttpError.notFound('Libro no encontrado');
  return libro;
}

const LibroController = {
  /** GET /libros — búsqueda en el catálogo. */
  async buscar(req, res) {
    const { limit, offset } = req.validQuery;
    const resultado = await LibroModel.buscar({ ...filtrosDesdeQuery(req), limit, offset });
    res.json({ ...resultado, limit, offset });
  },

  /** GET /libros/listado — vista previa del listado (todas las coincidencias). */
  async listado(req, res) {
    const filtros = filtrosDesdeQuery(req);
    const libros = await LibroModel.listado(filtros);
    res.json({
      generadoEl: new Date().toISOString(),
      generadoPor: req.usuario.Nombre_Completo,
      filtro: describirFiltro(filtros),
      total: libros.length,
      datos: libros,
    });
  },

  /** GET /libros/listado.pdf — el mismo listado como archivo PDF. */
  async listadoPdf(req, res) {
    const filtros = filtrosDesdeQuery(req);
    const libros = await LibroModel.listado(filtros);
    const fecha = new Date();
    const sufijo = filtros.q ? `_${filtros.q.replace(/[^\p{L}\p{N}]+/gu, '_')}` : '';
    const nombre = `Listado_libros${sufijo}_${fecha.toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nombre}"`);
    generarListadoPdf(libros, {
      generadoPor: req.usuario.Nombre_Completo,
      filtro: describirFiltro(filtros),
      fecha,
    }).pipe(res);
  },

  /**
   * GET /libros/:id — ficha del libro. Quien gestiona libros ve cada
   * ejemplar con su código; los demás ven el conteo por estado.
   */
  async obtener(req, res) {
    const gestiona = tieneFuncion(req, 'gestionar_libros');
    const libro = await LibroModel.findById(req.params.id, { completa: gestiona });
    if (!libro || (libro.Estatus !== 'Activo' && !gestiona)) {
      throw HttpError.notFound('No hay ningún libro registrado con esos datos.');
    }
    res.json(libro);
  },

  /** GET /libros/isbn/:isbn — se valida primero en el alta de libro. */
  async porIsbn(req, res) {
    const libro = await LibroModel.findByIsbn(req.params.isbn);
    if (!libro) throw HttpError.notFound('No hay ningún libro registrado con ese ISBN.');
    res.json(libro);
  },

  async crear(req, res) {
    const libro = await LibroModel.create(req.body, req.usuario.id_usuario);
    await BitacoraModel.registrar(req.usuario.id_usuario, 'ALTA_LIBRO', `Alta de libro: «${libro.Titulo}»`);
    res.status(201).json(libro);
  },

  async actualizar(req, res) {
    await libroEditable(req.params.id);
    const libro = await LibroModel.update(req.params.id, req.body);
    await BitacoraModel.registrar(req.usuario.id_usuario, 'EDICION_LIBRO', `Edición de ficha: «${libro.Titulo}»`);
    res.json(libro);
  },

  /** PATCH /libros/:id/estatus — activar o inactivar el libro completo. */
  async cambiarEstatus(req, res) {
    const libro = await LibroModel.cambiarEstatus(req.params.id, req.body.Estatus);
    const accion = req.body.Estatus === 'Activo' ? 'Reactivación' : 'Inactivación';
    await BitacoraModel.registrar(req.usuario.id_usuario, 'ESTATUS_LIBRO', `${accion} de libro: «${libro.Titulo}»`);
    res.json(libro);
  },

  // Ejemplares --------------------------------------------------------
  async listarEjemplares(req, res) {
    res.json(await EjemplarModel.findByLibro(req.params.id));
  },

  /** POST /libros/:id/ejemplares — agrega copias con su ubicación. */
  async agregarEjemplares(req, res) {
    const libro = await libroEditable(req.params.id);
    const { cantidad, ...ubicacion } = req.body;
    const codigos = await EjemplarModel.agregar(req.params.id, cantidad, ubicacion);
    await BitacoraModel.registrar(
      req.usuario.id_usuario,
      'ALTA_EJEMPLARES',
      `Alta de ${codigos.length} ejemplar(es) de «${libro.Titulo}»: ${codigos.join(', ')}`,
    );
    res.status(201).json(await LibroModel.findById(req.params.id));
  },

  /** PUT /libros/:id/ejemplares/:numCopia — cambio de estado o ubicación de una copia. */
  async actualizarEjemplar(req, res) {
    const { id, numCopia } = req.params;
    const libro = await libroEditable(id);
    const copia = await EjemplarModel.cambiarEstado(id, numCopia, req.body);
    if (req.body.Estatus) {
      await BitacoraModel.registrar(
        req.usuario.id_usuario,
        'CAMBIO_ESTADO_COPIA',
        `Cambio de estado: ${copia.Codigo} de «${libro.Titulo}» a ${copia.Estatus}`,
      );
    }
    res.json(copia);
  },

  /** POST /libros/:id/ejemplares/:numCopia/baja — retiro de una copia con motivo. */
  async retirarEjemplar(req, res) {
    const { id, numCopia } = req.params;
    await libroEditable(id);
    const copia = await EjemplarModel.retirar(id, numCopia, req.body.Motivo_Baja);
    await BitacoraModel.registrar(
      req.usuario.id_usuario,
      'BAJA_COPIA',
      `Baja de copia ${copia.Codigo} (${ETIQUETAS_MOTIVO[copia.Motivo_Baja]})`,
    );
    res.json(copia);
  },
};

module.exports = LibroController;
