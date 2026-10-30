/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL · ControladorLibros.js
 * Función: Catálogo, listado, alta, edición, estatus y copias de los libros.
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
 *     Módulo              Objetivo
 *     ETIQUETAS_CAMPO     Nombre visible de cada campo de búsqueda para el listado
 *     ETIQUETAS_MOTIVO    Nombre visible de cada motivo de baja
 *     FiltrosDesdeQuery   Traduce los parámetros de búsqueda de la URL a filtros…
 *     DescribirFiltro     Describir el filtro aplicado para el encabezado del listado
 *     LibroEditable       Verificar que el libro exista y esté activo antes de…
 *     ControladorLibros   Manejadores del catálogo de libros y sus copias
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
import { ModeloLibro } from '../modelos/ModeloLibro.js';
import { ModeloEjemplar } from '../modelos/ModeloEjemplar.js';
import { ModeloOrdenCompra } from '../modelos/ModeloOrdenCompra.js';
import { TieneFuncion } from '../intermediarios/autenticacion.js';
import { GenerarListadoPdf } from '../utilidades/GenerarListadoPdf.js';

/*
 * Constante: ETIQUETAS_CAMPO
 * Objetivo: Nombre visible de cada campo de búsqueda para el listado.
 */
const ETIQUETAS_CAMPO = {
  todos: 'Todos',
  titulo: 'Título',
  autor: 'Autor',
  editorial: 'Editorial',
  isbn: 'ISBN',
  anio: 'Año',
  tema: 'Tema',
};
/*
 * Constante: ETIQUETAS_MOTIVO
 * Objetivo: Nombre visible de cada motivo de baja.
 */
const ETIQUETAS_MOTIVO = {
  Perdido: 'Perdido',
  Robado: 'Robado',
  Danado: 'Dañado',
  Obsoleto: 'Obsoleto',
};

/*
 * Función: FiltrosDesdeQuery
 * Objetivo: Traduce los parámetros de búsqueda de la URL a filtros del modelo.
 * Entrada: req
 * Salida: Objeto de filtros para ModeloLibro.Buscar
 */
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

/*
 * Función: DescribirFiltro
 * Objetivo: Describir el filtro aplicado para el encabezado del listado.
 * Entrada: { q, campo }
 * Salida: Texto como «Autor «Tanenbaum»» o «Sin filtro (todos los libros)»
 */
function DescribirFiltro({ q: texto_busqueda, campo })
{
  if (!texto_busqueda)
  {
    return 'Sin filtro (todos los libros)';
  }
  return `${ETIQUETAS_CAMPO[campo] || 'Todos'} «${texto_busqueda}»`;
}

/*
 * Función: LibroEditable
 * Objetivo: Verificar que el libro exista y esté activo antes de modificar sus copias.
 * Entrada: id
 * Salida: Promesa con el libro; ErrorHttp si no procede
 */
async function LibroEditable(id)
{
  const libro = await ModeloLibro.BuscarPorId(id);
  if (!libro)
  {
    throw ErrorHttp.NoEncontrado('Libro no encontrado');
  }
  return libro;
}

/*
 * Módulo: ControladorLibros
 * Objetivo: Manejadores del catálogo de libros y sus copias.
 */
const ControladorLibros = {
  /*
   * Función: Buscar
   * Objetivo: GET /libros — búsqueda en el catálogo.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Buscar(req, res)
  {
    const { limit, offset } = req.consulta_valida;
    const resultado = await ModeloLibro.Buscar({ ...FiltrosDesdeQuery(req), limit, offset });
    res.json({ ...resultado, limit, offset });
  },

  /*
   * Función: Listado
   * Objetivo: GET /libros/listado — vista previa del listado (todas las coincidencias).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
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

  /*
   * Función: ListadoPdf
   * Objetivo: GET /libros/listado.pdf — el mismo listado como archivo PDF.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con el PDF del listado
   */
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

  /*
   * Función: Obtener
   * Objetivo: GET /libros/:id — ficha del libro. Quien gestiona libros ve cada ejemplar con su
   *           código; los demás ven el conteo por estado.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
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

  /*
   * Función: PorIsbn
   * Objetivo: GET /libros/isbn/:isbn — se valida primero en el alta de libro.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async PorIsbn(req, res)
  {
    const libro = await ModeloLibro.BuscarPorIsbn(req.params.isbn);
    if (!libro)
    {
      throw ErrorHttp.NoEncontrado('No hay ningún libro registrado con ese ISBN.');
    }
    res.json(libro);
  },

  /*
   * Función: SolicitadoPorIsbn
   * Objetivo: GET /libros/solicitados/:isbn — datos del libro pedido en una orden de compra
   *           para precargar el alta cuando el ISBN aún no está en el catálogo.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async SolicitadoPorIsbn(req, res)
  {
    const libro = await ModeloOrdenCompra.BuscarLibroNuevoPorIsbn(req.params.isbn);
    if (!libro)
    {
      throw ErrorHttp.NoEncontrado('Ese ISBN no aparece en ninguna solicitud de compra.');
    }
    res.json(libro);
  },

  /*
   * Función: Crear
   * Objetivo: Atender POST /api/libros.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Crear(req, res)
  {
    const libro = await ModeloLibro.Crear(req.body, req.usuario.id_usuario);
    res.status(201).json(libro);
  },

  /*
   * Función: Actualizar
   * Objetivo: Atender PUT /api/libros/:id.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Actualizar(req, res)
  {
    await LibroEditable(req.params.id);
    const libro = await ModeloLibro.Actualizar(req.params.id, req.body);
    res.json(libro);
  },

  /*
   * Función: CambiarEstatus
   * Objetivo: PATCH /libros/:id/estatus — activar o inactivar el libro completo.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async CambiarEstatus(req, res)
  {
    const libro = await ModeloLibro.CambiarEstatus(req.params.id, req.body.Estatus);
    res.json(libro);
  },

  /*
   * Función: ListarEjemplares
   * Objetivo: Atender GET /api/libros/:id/ejemplares (copias con código, ubicación y estado).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async ListarEjemplares(req, res)
  {
    res.json(await ModeloEjemplar.BuscarPorLibro(req.params.id));
  },

  /*
   * Función: AgregarEjemplares
   * Objetivo: POST /libros/:id/ejemplares — agrega copias con su ubicación.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async AgregarEjemplares(req, res)
  {
    await LibroEditable(req.params.id);
    const { cantidad, ...ubicacion } = req.body;
    await ModeloEjemplar.Agregar(req.params.id, cantidad, ubicacion);
    res.status(201).json(await ModeloLibro.BuscarPorId(req.params.id));
  },

  /*
   * Función: ActualizarEjemplar
   * Objetivo: PUT /libros/:id/ejemplares/:num_copia — cambio de estado o ubicación de una
   *           copia.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async ActualizarEjemplar(req, res)
  {
    const { id, num_copia } = req.params;
    await LibroEditable(id);
    const copia = await ModeloEjemplar.CambiarEstado(id, num_copia, req.body);
    res.json(copia);
  },

  /*
   * Función: RetirarEjemplar
   * Objetivo: POST /libros/:id/ejemplares/:num_copia/baja — retiro de una copia con motivo. La
   *           copia queda Inactiva; el motivo solo se informa en el mensaje (no se guarda).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async RetirarEjemplar(req, res)
  {
    const { id, num_copia } = req.params;
    await LibroEditable(id);
    const copia = await ModeloEjemplar.Retirar(id, num_copia, req.body.Motivo_Baja);
    res.json({
      ...copia,
      mensaje: `Copia ${copia.Codigo} dada de baja (${ETIQUETAS_MOTIVO[copia.Motivo_Baja]}).`,
    });
  },
};

export { ControladorLibros };
