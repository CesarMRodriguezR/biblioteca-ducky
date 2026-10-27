import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloLibro } from '../modelos/ModeloLibro.js';
import { ModeloEjemplar } from '../modelos/ModeloEjemplar.js';
import { ModeloBitacora } from '../modelos/ModeloBitacora.js';
import { TieneFuncion } from '../intermediarios/autenticacion.js';
import { GenerarListadoPdf } from '../utilidades/GenerarListadoPdf.js';

const ETIQUETAS_CAMPO = {
  todos: 'Todos',
  titulo: 'Título',
  autor: 'Autor',
  editorial: 'Editorial',
  isbn: 'ISBN',
  anio: 'Año',
  tema: 'Tema',
};
const ETIQUETAS_MOTIVO = {
  Perdido: 'Perdido',
  Robado: 'Robado',
  Danado: 'Dañado',
  Obsoleto: 'Obsoleto',
};

/** Traduce los parámetros de búsqueda de la URL a filtros del modelo. */
function FiltrosDesdeQuery(req) 
{
  const { q: texto_busqueda, campo, orden, desde, hasta, tema, editorial, disponibles, inactivos } =
    req.consulta_valida;
  return {
    q: texto_busqueda,
    campo,
    orden,
    anio_desde: desde,
    anio_hasta: hasta,
    id_tema: tema,
    id_editorial: editorial,
    solo_disponibles: disponibles,
    incluir_inactivos: Boolean(inactivos) && TieneFuncion(req, 'gestionar_libros'),
  };
}

function DescribirFiltro({ q: texto_busqueda, campo }) 
{
  if (!texto_busqueda) 
  {
    return 'Sin filtro (todos los libros)';
  }
  return `${ETIQUETAS_CAMPO[campo] || 'Todos'} «${texto_busqueda}»`;
}

async function LibroEditable(id) 
{
  const libro = await ModeloLibro.BuscarPorId(id);
  if (!libro) 
  {
    throw ErrorHttp.NoEncontrado('Libro no encontrado');
  }
  return libro;
}

const ControladorLibros = {
  /** GET /libros — búsqueda en el catálogo. */
  async Buscar(req, res) 
  {
    const { limit, offset } = req.consulta_valida;
    const resultado = await ModeloLibro.Buscar({ ...FiltrosDesdeQuery(req), limit, offset });
    res.json({ ...resultado, limit, offset });
  },

  /** GET /libros/listado — vista previa del listado (todas las coincidencias). */
  async Listado(req, res) 
  {
    const filtros = FiltrosDesdeQuery(req);
    const libros = await ModeloLibro.Listado(filtros);
    res.json({
      generado_el: new Date().toISOString(),
      generado_por: req.usuario.Nombre_Completo,
      filtro: DescribirFiltro(filtros),
      total: libros.length,
      datos: libros,
    });
  },

  /** GET /libros/listado.pdf — el mismo listado como archivo PDF. */
  async ListadoPdf(req, res) 
  {
    const filtros = FiltrosDesdeQuery(req);
    const libros = await ModeloLibro.Listado(filtros);
    const fecha = new Date();
    const sufijo = filtros.q ? `_${filtros.q.replace(/[^\p{L}\p{N}]+/gu, '_')}` : '';
    const nombre = `Listado_libros${sufijo}_${fecha.toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nombre}"`);
    GenerarListadoPdf(libros, {
      generado_por: req.usuario.Nombre_Completo,
      filtro: DescribirFiltro(filtros),
      fecha,
    }).pipe(res);
  },

  /**
   * GET /libros/:id — ficha del libro. Quien gestiona libros ve cada
   * ejemplar con su código; los demás ven el conteo por estado.
   */
  async Obtener(req, res) 
  {
    const gestiona = TieneFuncion(req, 'gestionar_libros');
    const libro = await ModeloLibro.BuscarPorId(req.params.id, { completa: gestiona });
    if (!libro || (libro.Estatus !== 'Activo' && !gestiona)) 
    {
      throw ErrorHttp.NoEncontrado('No hay ningún libro registrado con esos datos.');
    }
    res.json(libro);
  },

  /** GET /libros/isbn/:isbn — se valida primero en el alta de libro. */
  async PorIsbn(req, res) 
  {
    const libro = await ModeloLibro.BuscarPorIsbn(req.params.isbn);
    if (!libro) 
    {
      throw ErrorHttp.NoEncontrado('No hay ningún libro registrado con ese ISBN.');
    }
    res.json(libro);
  },

  async Crear(req, res) 
  {
    const libro = await ModeloLibro.Crear(req.body, req.usuario.id_usuario);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'ALTA_LIBRO',
      `Alta de libro: «${libro.Titulo}»`,
    );
    res.status(201).json(libro);
  },

  async Actualizar(req, res) 
  {
    await LibroEditable(req.params.id);
    const libro = await ModeloLibro.Actualizar(req.params.id, req.body);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'EDICION_LIBRO',
      `Edición de ficha: «${libro.Titulo}»`,
    );
    res.json(libro);
  },

  /** PATCH /libros/:id/estatus — activar o inactivar el libro completo. */
  async CambiarEstatus(req, res) 
  {
    const libro = await ModeloLibro.CambiarEstatus(req.params.id, req.body.Estatus);
    const accion = req.body.Estatus === 'Activo' ? 'Reactivación' : 'Inactivación';
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'ESTATUS_LIBRO',
      `${accion} de libro: «${libro.Titulo}»`,
    );
    res.json(libro);
  },

  // Ejemplares --------------------------------------------------------
  async ListarEjemplares(req, res) 
  {
    res.json(await ModeloEjemplar.BuscarPorLibro(req.params.id));
  },

  /** POST /libros/:id/ejemplares — agrega copias con su ubicación. */
  async AgregarEjemplares(req, res) 
  {
    const libro = await LibroEditable(req.params.id);
    const { cantidad, ...ubicacion } = req.body;
    const codigos = await ModeloEjemplar.Agregar(req.params.id, cantidad, ubicacion);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'ALTA_EJEMPLARES',
      `Alta de ${codigos.length} ejemplar(es) de «${libro.Titulo}»: ${codigos.join(', ')}`,
    );
    res.status(201).json(await ModeloLibro.BuscarPorId(req.params.id));
  },

  /** PUT /libros/:id/ejemplares/:num_copia — cambio de estado o ubicación de una copia. */
  async ActualizarEjemplar(req, res) 
  {
    const { id, num_copia } = req.params;
    const libro = await LibroEditable(id);
    const copia = await ModeloEjemplar.CambiarEstado(id, num_copia, req.body);
    if (req.body.Estatus) 
    {
      await ModeloBitacora.Registrar(
        req.usuario.id_usuario,
        'CAMBIO_ESTADO_COPIA',
        `Cambio de estado: ${copia.Codigo} de «${libro.Titulo}» a ${copia.Estatus}`,
      );
    }
    res.json(copia);
  },

  /** POST /libros/:id/ejemplares/:num_copia/baja — retiro de una copia con motivo. */
  async RetirarEjemplar(req, res) 
  {
    const { id, num_copia } = req.params;
    await LibroEditable(id);
    const copia = await ModeloEjemplar.Retirar(id, num_copia, req.body.Motivo_Baja);
    await ModeloBitacora.Registrar(
      req.usuario.id_usuario,
      'BAJA_COPIA',
      `Baja de copia ${copia.Codigo} (${ETIQUETAS_MOTIVO[copia.Motivo_Baja]})`,
    );
    res.json(copia);
  },
};

export { ControladorLibros };
