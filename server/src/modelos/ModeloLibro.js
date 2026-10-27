/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL · ModeloLibro.js
 * Función: Fichas bibliográficas: búsqueda del catálogo, alta, edición y estatus de los libros.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos validados por los controladores
 * Salida: Filas de la base de datos MariaDB o ErrorHttp si se rompe una regla
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                 Objetivo
 *     ORDENES                Cláusula ORDER BY de cada opción de orden del catálogo
 *     ParsearAutores         Convierte el texto de autores del formulario en…
 *     ObtenerIdsAutores      Obtener los ids de los autores del texto, dándolos de…
 *     ObtenerIdsTemas        Obtener los ids de los temas del texto, dándolos de alta…
 *     ReemplazarRelaciones   Reemplazar los autores y temas relacionados con el libro
 *     ConstruirFiltro        Armar la condición WHERE y sus parámetros a partir de los…
 *     ModeloLibro            Acceso a las fichas bibliográficas y al catálogo
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: contiene la lógica de negocio y el acceso a la base de datos.
 * (2) Toda consulta es parametrizada (?); nunca se concatenan datos del usuario en el SQL.
 * (3) Requiere la base de datos creada con database/01_schema.sql y la conexión de
 *     configuracion/conexion.js.
 * (4) Las operaciones que modifican varias tablas usan EjecutarEnTransaccion.
 * ******************************************************************
 */

import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloEjemplar } from './ModeloEjemplar.js';

/*
 * Constante: CAMPOS_BUSQUEDA
 * Objetivo: Columnas de vw_catalogo para cada filtro "Buscar por" del prototipo.
 */
const CAMPOS_BUSQUEDA = {
  titulo: ['c.Titulo'],
  autor: ['c.Autores'],
  editorial: ['c.Nombre_Editorial'],
  isbn: ['c.ISBN'],
  anio: ['c.Anio'],
  tema: ['c.Temas'],
};
CAMPOS_BUSQUEDA.todos = Object.values(CAMPOS_BUSQUEDA).flat();

/*
 * Constante: ORDENES
 * Objetivo: Cláusula ORDER BY de cada opción de orden del catálogo.
 */
const ORDENES = {
  titulo: 'c.Titulo ASC',
  autor: 'c.Autores_Apellidos ASC, c.Titulo ASC',
  anio_desc: 'c.Anio DESC, c.Titulo ASC',
  anio_asc: 'c.Anio ASC, c.Titulo ASC',
  disponibles: 'c.Ejemplares_Disponibles DESC, c.Titulo ASC',
};

/*
 * Función: ParsearAutores
 * Objetivo: Convierte el texto de autores del formulario en registros. Acepta "Apellido,
 *           Nombre" o "Nombre Apellido", separados por ";", " & " o " y ". "Kernighan, B. W.;
 *           Ritchie, D. M." → [{Apellido_Paterno:'Kernighan', Nombre:'B. W.'}, ...]
 * Entrada: texto
 * Salida: Lista de { Nombre, Apellido_Paterno }
 */
function ParsearAutores(texto)
{
  return String(texto)
    .split(/;|\s&\s|\sy\s/)
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) =>
    {
      if (parte.includes(','))
      {
        const [apellido, ...resto] = parte.split(',');
        return { Apellido_Paterno: apellido.trim(), Nombre: resto.join(',').trim() || '—' };
      }
      const palabras = parte.split(/\s+/);
      const apellido = palabras.pop();
      return { Apellido_Paterno: apellido, Nombre: palabras.join(' ') || '—' };
    });
}

/*
 * Función: ObtenerIdsAutores
 * Objetivo: Obtener los ids de los autores del texto, dándolos de alta si no existen.
 * Entrada: conexion, texto
 * Salida: Promesa con los ids
 */
async function ObtenerIdsAutores(conexion, texto)
{
  const ids = [];
  for (const elemento of ParsearAutores(texto))
  {
    const [existente] = await Consultar(
      'SELECT id_autor FROM Autores WHERE Apellido_Paterno = ? AND Nombre = ? LIMIT 1',
      [elemento.Apellido_Paterno, elemento.Nombre],
      conexion,
    );
    if (existente)
    {
      ids.push(existente.id_autor);
    }
    else
    {
      const resultado = await Consultar(
        'INSERT INTO Autores (Nombre, Apellido_Paterno) VALUES (?, ?)',
        [elemento.Nombre, elemento.Apellido_Paterno],
        conexion,
      );
      ids.push(resultado.insertId);
    }
  }
  return [...new Set(ids)];
}

/*
 * Función: ObtenerIdsTemas
 * Objetivo: Obtener los ids de los temas del texto, dándolos de alta si no existen.
 * Entrada: conexion, texto
 * Salida: Promesa con los ids
 */
async function ObtenerIdsTemas(conexion, texto)
{
  const ids = [];
  const nombres = String(texto)
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean);
  for (const nombre of nombres)
  {
    const [existente] = await Consultar(
      'SELECT id_tema FROM Temas WHERE Nombre_Tema = ?',
      [nombre],
      conexion,
    );
    if (existente)
    {
      ids.push(existente.id_tema);
    }
    else
    {
      const resultado = await Consultar('INSERT INTO Temas (Nombre_Tema) VALUES (?)', [nombre], conexion);
      ids.push(resultado.insertId);
    }
  }
  return ids;
}

/*
 * Función: ReemplazarRelaciones
 * Objetivo: Reemplazar los autores y temas relacionados con el libro.
 * Entrada: conexion, id_libro, { Autor, Tema }
 * Salida: Promesa sin valor
 */
async function ReemplazarRelaciones(conexion, id_libro, { Autor, Tema })
{
  if (Autor !== undefined)
  {
    const autores = await ObtenerIdsAutores(conexion, Autor);
    if (!autores.length)
    {
      throw ErrorHttp.SolicitudInvalida('Indica al menos un autor');
    }
    await Consultar('DELETE FROM AutoresLibros WHERE id_libro = ?', [id_libro], conexion);
    for (const id_autor of autores)
    {
      await Consultar(
        'INSERT INTO AutoresLibros (id_libro, id_autor) VALUES (?, ?)',
        [id_libro, id_autor],
        conexion,
      );
    }
  }
  if (Tema !== undefined)
  {
    const temas = await ObtenerIdsTemas(conexion, Tema);
    await Consultar('DELETE FROM TemasLibros WHERE id_libro = ?', [id_libro], conexion);
    for (const id_tema of temas)
    {
      await Consultar(
        'INSERT INTO TemasLibros (id_libro, id_tema) VALUES (?, ?)',
        [id_libro, id_tema],
        conexion,
      );
    }
  }
}

/*
 * Función: ConstruirFiltro
 * Objetivo: Armar la condición WHERE y sus parámetros a partir de los filtros de búsqueda.
 * Entrada: { q, campo?, id_tema, id_editorial, solo_disponibles, incluir_inactivos, anio_desde,
 *          anio_hasta }
 * Salida: { condicion, parametros }
 */
function ConstruirFiltro({
  q: texto_busqueda,
  campo = 'todos',
  id_tema,
  id_editorial,
  solo_disponibles,
  incluir_inactivos,
  anio_desde,
  anio_hasta,
})
{
  const condicion = [];
  const parametros = [];
  if (!incluir_inactivos)
  {
    condicion.push("c.Estatus = 'Activo'");
  }
  if (texto_busqueda)
  {
    const columnas = CAMPOS_BUSQUEDA[campo] || CAMPOS_BUSQUEDA.todos;
    condicion.push(`(${columnas.map((columna) => `${columna} LIKE ?`).join(' OR ')})`);
    columnas.forEach(() => parametros.push(`%${texto_busqueda}%`));
  }
  if (id_tema)
  {
    condicion.push(
      'EXISTS (SELECT 1 FROM TemasLibros tl WHERE tl.id_libro = c.id_libro AND tl.id_tema = ?)',
    );
    parametros.push(id_tema);
  }
  if (id_editorial)
  {
    condicion.push('c.id_editorial = ?');
    parametros.push(id_editorial);
  }
  if (anio_desde)
  {
    condicion.push('c.Anio >= ?');
    parametros.push(anio_desde);
  }
  if (anio_hasta)
  {
    condicion.push('c.Anio <= ?');
    parametros.push(anio_hasta);
  }
  if (solo_disponibles)
  {
    condicion.push('c.Ejemplares_Disponibles > 0');
  }
  return { where_sql: condicion.length ? `WHERE ${condicion.join(' AND ')}` : '', params: parametros };
}

/*
 * Módulo: ModeloLibro
 * Objetivo: Acceso a las fichas bibliográficas y al catálogo.
 */
const ModeloLibro = {
  parsear_autores: ParsearAutores,

  /*
   * Función: Buscar
   * Objetivo: Búsqueda del catálogo con filtro por campo, rango de años, orden y paginación.
   * Entrada: { orden?, limit?, offset?, ...filtros } (opcional)
   * Salida: Promesa con { total, datos }
   */
  async Buscar({ orden = 'titulo', limit = 6, offset = 0, ...filtros } = {})
  {
    const { where_sql, params: parametros } = ConstruirFiltro(filtros);
    const [{ total }] = await Consultar(
      `SELECT COUNT(*) AS total FROM vw_catalogo c ${where_sql}`,
      parametros,
    );
    const datos = await Consultar(
      `SELECT c.* FROM vw_catalogo c ${where_sql}
        ORDER BY ${ORDENES[orden] || ORDENES.titulo}
        LIMIT ? OFFSET ?`,
      [...parametros, Number(limit), Number(offset)],
    );
    return { total, datos };
  },

  /*
   * Función: Listado
   * Objetivo: Todas las coincidencias, sin paginar (listado imprimible).
   * Entrada: { orden?, ...filtros } (opcional)
   * Salida: Promesa con todas las filas que coinciden
   */
  Listado({ orden = 'titulo', ...filtros } = {})
  {
    const { where_sql, params: parametros } = ConstruirFiltro(filtros);
    return Consultar(
      `SELECT c.* FROM vw_catalogo c ${where_sql} ORDER BY ${ORDENES[orden] || ORDENES.titulo}`,
      parametros,
    );
  },

  /*
   * Función: BuscarPorIsbn
   * Objetivo: Obtener la ficha de un libro por su ISBN.
   * Entrada: isbn
   * Salida: Promesa con la ficha o null
   */
  async BuscarPorIsbn(isbn)
  {
    const filas = await Consultar('SELECT id_libro FROM Libros WHERE ISBN = ?', [isbn]);
    return filas[0] ? ModeloLibro.BuscarPorId(filas[0].id_libro) : null;
  },

  /*
   * Función: BuscarPorId
   * Objetivo: Ficha del libro. Con `completa` incluye la lista de ejemplares con código y
   *           ubicación; sin ella, solo el conteo por estado (vista de alumnos, profesores y
   *           colaboradores).
   * Entrada: id, { completa? } (opcional), conexion
   * Salida: Promesa con la ficha o null si no existe
   */
  async BuscarPorId(id, { completa = true } = {}, conexion)
  {
    const filas = await Consultar('SELECT * FROM vw_catalogo WHERE id_libro = ?', [id], conexion);
    const libro = filas[0];
    if (!libro)
    {
      return null;
    }

    const [autores, temas, ejemplares] = await Promise.all([
      Consultar(
        `SELECT a.* FROM AutoresLibros al JOIN Autores a ON a.id_autor = al.id_autor
          WHERE al.id_libro = ? ORDER BY a.id_autor`,
        [id],
        conexion,
      ),
      Consultar(
        `SELECT t.* FROM TemasLibros tl JOIN Temas t ON t.id_tema = tl.id_tema
          WHERE tl.id_libro = ? ORDER BY t.Nombre_Tema`,
        [id],
        conexion,
      ),
      ModeloEjemplar.BuscarPorLibro(id, conexion),
    ]);

    const activos = ejemplares.filter((ejemplar) => ejemplar.Estatus !== 'Baja');
    const Conteo = (estatus) => activos.filter((activo) => activo.Estatus === estatus).length;
    const resumen_copias = {
      Disponible: Conteo('Disponible'),
      'Consulta externa': Conteo('Consulta externa'),
      'En prestamo': Conteo('En prestamo') + Conteo('Apartado'),
    };

    return {
      ...libro,
      Autor: autores.map((autor) => `${autor.Apellido_Paterno}, ${autor.Nombre}`).join('; '),
      Tema: temas.map((tema) => tema.Nombre_Tema).join(', '),
      Seccion: temas[0]?.Nombre_Tema ?? null,
      autores,
      temas,
      resumen_copias,
      ...(completa && { ejemplares }),
    };
  },

  /*
   * Función: Crear
   * Objetivo: Alta de ficha bibliográfica (sin ejemplares; se agregan después).
   * Entrada: datos, id_usuario
   * Salida: Promesa con el registro creado
   */
  Crear(datos, id_usuario)
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [duplicado] = await Consultar(
        'SELECT id_libro FROM Libros WHERE ISBN = ?',
        [datos.ISBN],
        conexion,
      );
      if (duplicado)
      {
        throw ErrorHttp.Conflicto('Ya existe una ficha con ese ISBN', {
          codigo: 'ISBN_DUPLICADO',
          id_libro: duplicado.id_libro,
        });
      }
      const resultado = await Consultar(
        `INSERT INTO Libros (ISBN, Titulo, Anio, Sinopsis, id_editorial, id_usuario, Precio, Estatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')`,
        [
          datos.ISBN,
          datos.Titulo,
          datos.Anio,
          datos.Sinopsis,
          datos.id_editorial,
          id_usuario,
          datos.Precio,
        ],
        conexion,
      );
      await ReemplazarRelaciones(conexion, resultado.insertId, datos);
      return ModeloLibro.BuscarPorId(resultado.insertId, {}, conexion);
    });
  },

  /*
   * Función: Actualizar
   * Objetivo: Edición de ficha. Reglas del prototipo: el ISBN no cambia, un libro inactivo no
   *           se edita y el número de copias solo puede aumentar (para reducir se usa "Dar de
   *           baja").
   * Entrada: id, { Numero_Copias, ...datos }
   * Salida: Promesa con el registro actualizado
   */
  Actualizar(id, { Numero_Copias, ...datos })
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [libro] = await Consultar(
        'SELECT * FROM Libros WHERE id_libro = ? FOR UPDATE',
        [id],
        conexion,
      );
      if (!libro)
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }
      if (libro.Estatus !== 'Activo')
      {
        throw ErrorHttp.Conflicto(
          'Este libro está inactivo y no se puede editar. Primero reactívalo desde Libros.',
          {
            codigo: 'LIBRO_INACTIVO',
          },
        );
      }
      if (datos.ISBN !== undefined && datos.ISBN !== libro.ISBN)
      {
        throw ErrorHttp.SolicitudInvalida('No se puede cambiar el ISBN de un libro.', {
          codigo: 'ISBN_INMUTABLE',
        });
      }

      const campos = ['Titulo', 'Anio', 'Sinopsis', 'id_editorial', 'Precio'];
      const sets = [];
      const parametros = [];
      campos.forEach((campo) =>
      {
        if (datos[campo] !== undefined)
        {
          sets.push(`${campo} = ?`);
          parametros.push(datos[campo]);
        }
      });
      if (sets.length)
      {
        await Consultar(
          `UPDATE Libros SET ${sets.join(', ')} WHERE id_libro = ?`,
          [...parametros, id],
          conexion,
        );
      }
      await ReemplazarRelaciones(conexion, id, datos);

      if (Numero_Copias !== undefined)
      {
        const [{ actuales }] = await Consultar(
          'SELECT COUNT(*) AS actuales FROM Ejemplares WHERE id_libro = ? AND Estatus <> \'Baja\'',
          [id],
          conexion,
        );
        if (Numero_Copias < actuales)
        {
          throw ErrorHttp.SolicitudInvalida(
            'Para reducir copias usa «Dar de baja» con un motivo.',
            { codigo: 'REDUCIR_COPIAS' },
          );
        }
        if (Numero_Copias > actuales)
        {
          const [referencia] = await Consultar(
            `SELECT Pasillo, Estante, Nivel FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Baja'
              ORDER BY num_copia LIMIT 1`,
            [id],
            conexion,
          );
          await ModeloEjemplar.Agregar(id, Numero_Copias - actuales, referencia || {}, conexion);
        }
      }
      return ModeloLibro.BuscarPorId(id, {}, conexion);
    });
  },

  /*
   * Función: CambiarEstatus
   * Objetivo: Activa o inactiva el libro completo. Para inactivar, ninguna copia puede estar en
   *           préstamo o apartada. Un libro inactivo deja de aparecer en el catálogo y sus
   *           copias no se pueden prestar.
   * Entrada: id, estatus
   * Salida: Promesa con la ficha actualizada
   */
  CambiarEstatus(id, estatus)
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [libro] = await Consultar(
        'SELECT * FROM Libros WHERE id_libro = ? FOR UPDATE',
        [id],
        conexion,
      );
      if (!libro)
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }
      if (libro.Estatus === estatus)
      {
        throw ErrorHttp.Conflicto(`El libro ya está ${estatus.toLowerCase()}`);
      }
      if (estatus === 'Inactivo')
      {
        const prestadas = await Consultar(
          'SELECT Codigo FROM Ejemplares WHERE id_libro = ? AND Estatus IN (\'En prestamo\',\'Apartado\')',
          [id],
          conexion,
        );
        if (prestadas.length)
        {
          const codigos = prestadas.map((prestada) => prestada.Codigo).join(', ');
          throw ErrorHttp.Conflicto(
            `No se puede inactivar el libro: tiene copias en préstamo (${codigos}).`,
            { codigo: 'COPIAS_EN_PRESTAMO', copias: prestadas.map((prestada) => prestada.Codigo) },
          );
        }
      }
      await Consultar('UPDATE Libros SET Estatus = ? WHERE id_libro = ?', [estatus, id], conexion);
      return ModeloLibro.BuscarPorId(id, {}, conexion);
    });
  },

  /*
   * Función: ContarActivos
   * Objetivo: Contar los libros activos del catálogo.
   * Entrada: Ninguna
   * Salida: Promesa con el número de registros activos
   */
  async ContarActivos()
  {
    const [{ n: total }] = await Consultar('SELECT COUNT(*) AS n FROM Libros WHERE Estatus = \'Activo\'');
    return total;
  },
};

export { ModeloLibro };
