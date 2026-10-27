import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { ModeloEjemplar } from './ModeloEjemplar.js';

/** Columnas de vw_catalogo para cada filtro "Buscar por" del prototipo. */
const CAMPOS_BUSQUEDA = {
  titulo: ['c.Titulo'],
  autor: ['c.Autores'],
  editorial: ['c.Nombre_Editorial'],
  isbn: ['c.ISBN'],
  anio: ['c.Anio'],
  tema: ['c.Temas'],
};
CAMPOS_BUSQUEDA.todos = Object.values(CAMPOS_BUSQUEDA).flat();

const ORDENES = {
  titulo: 'c.Titulo ASC',
  autor: 'c.Autores_Apellidos ASC, c.Titulo ASC',
  anio_desc: 'c.Anio DESC, c.Titulo ASC',
  anio_asc: 'c.Anio ASC, c.Titulo ASC',
  disponibles: 'c.Ejemplares_Disponibles DESC, c.Titulo ASC',
};

/**
 * Convierte el texto de autores del formulario en registros.
 * Acepta "Apellido, Nombre" o "Nombre Apellido", separados por ";", " & " o " y ".
 *   "Kernighan, B. W.; Ritchie, D. M." → [{Apellido_Paterno:'Kernighan', Nombre:'B. W.'}, ...]
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

async function ObtenerIdsAutores(conn, texto) 
{
  const ids = [];
  for (const elemento of ParsearAutores(texto)) 
  {
    const [existente] = await Consultar(
      'SELECT id_autor FROM Autores WHERE Apellido_Paterno = ? AND Nombre = ? LIMIT 1',
      [elemento.Apellido_Paterno, elemento.Nombre],
      conn,
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
        conn,
      );
      ids.push(resultado.insertId);
    }
  }
  return [...new Set(ids)];
}

async function ObtenerIdsTemas(conn, texto) 
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
      conn,
    );
    if (existente) 
    {
      ids.push(existente.id_tema);
    }
    else 
    {
      const resultado = await Consultar('INSERT INTO Temas (Nombre_Tema) VALUES (?)', [nombre], conn);
      ids.push(resultado.insertId);
    }
  }
  return ids;
}

async function ReemplazarRelaciones(conn, id_libro, { Autor, Tema }) 
{
  if (Autor !== undefined) 
  {
    const autores = await ObtenerIdsAutores(conn, Autor);
    if (!autores.length) 
    {
      throw ErrorHttp.SolicitudInvalida('Indica al menos un autor');
    }
    await Consultar('DELETE FROM AutoresLibros WHERE id_libro = ?', [id_libro], conn);
    for (const id_autor of autores) 
    {
      await Consultar(
        'INSERT INTO AutoresLibros (id_libro, id_autor) VALUES (?, ?)',
        [id_libro, id_autor],
        conn,
      );
    }
  }
  if (Tema !== undefined) 
  {
    const temas = await ObtenerIdsTemas(conn, Tema);
    await Consultar('DELETE FROM TemasLibros WHERE id_libro = ?', [id_libro], conn);
    for (const id_tema of temas) 
    {
      await Consultar(
        'INSERT INTO TemasLibros (id_libro, id_tema) VALUES (?, ?)',
        [id_libro, id_tema],
        conn,
      );
    }
  }
}

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
  const where = [];
  const params = [];
  if (!incluir_inactivos) 
  {
    where.push("c.Estatus = 'Activo'");
  }
  if (texto_busqueda) 
  {
    const columnas = CAMPOS_BUSQUEDA[campo] || CAMPOS_BUSQUEDA.todos;
    where.push(`(${columnas.map((col) => `${col} LIKE ?`).join(' OR ')})`);
    columnas.forEach(() => params.push(`%${texto_busqueda}%`));
  }
  if (id_tema) 
  {
    where.push(
      'EXISTS (SELECT 1 FROM TemasLibros tl WHERE tl.id_libro = c.id_libro AND tl.id_tema = ?)',
    );
    params.push(id_tema);
  }
  if (id_editorial) 
  {
    where.push('c.id_editorial = ?');
    params.push(id_editorial);
  }
  if (anio_desde) 
  {
    where.push('c.Anio >= ?');
    params.push(anio_desde);
  }
  if (anio_hasta) 
  {
    where.push('c.Anio <= ?');
    params.push(anio_hasta);
  }
  if (solo_disponibles) 
  {
    where.push('c.Ejemplares_Disponibles > 0');
  }
  return { where_sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

const ModeloLibro = {
  parsear_autores: ParsearAutores,

  /** Búsqueda del catálogo con filtro por campo, rango de años, orden y paginación. */
  async Buscar({ orden = 'titulo', limit = 6, offset = 0, ...filtros } = {}) 
  {
    const { where_sql, params } = ConstruirFiltro(filtros);
    const [{ total }] = await Consultar(
      `SELECT COUNT(*) AS total FROM vw_catalogo c ${where_sql}`,
      params,
    );
    const datos = await Consultar(
      `SELECT c.* FROM vw_catalogo c ${where_sql}
        ORDER BY ${ORDENES[orden] || ORDENES.titulo}
        LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)],
    );
    return { total, datos };
  },

  /** Todas las coincidencias, sin paginar (listado imprimible). */
  Listado({ orden = 'titulo', ...filtros } = {}) 
  {
    const { where_sql, params } = ConstruirFiltro(filtros);
    return Consultar(
      `SELECT c.* FROM vw_catalogo c ${where_sql} ORDER BY ${ORDENES[orden] || ORDENES.titulo}`,
      params,
    );
  },

  async BuscarPorIsbn(isbn) 
  {
    const rows = await Consultar('SELECT id_libro FROM Libros WHERE ISBN = ?', [isbn]);
    return rows[0] ? ModeloLibro.BuscarPorId(rows[0].id_libro) : null;
  },

  /**
   * Ficha del libro. Con `completa` incluye la lista de ejemplares con
   * código y ubicación; sin ella, solo el conteo por estado (vista de
   * alumnos, profesores y colaboradores).
   */
  async BuscarPorId(id, { completa = true } = {}, conn) 
  {
    const rows = await Consultar('SELECT * FROM vw_catalogo WHERE id_libro = ?', [id], conn);
    const libro = rows[0];
    if (!libro) 
    {
      return null;
    }

    const [autores, temas, ejemplares] = await Promise.all([
      Consultar(
        `SELECT a.* FROM AutoresLibros al JOIN Autores a ON a.id_autor = al.id_autor
          WHERE al.id_libro = ? ORDER BY a.id_autor`,
        [id],
        conn,
      ),
      Consultar(
        `SELECT t.* FROM TemasLibros tl JOIN Temas t ON t.id_tema = tl.id_tema
          WHERE tl.id_libro = ? ORDER BY t.Nombre_Tema`,
        [id],
        conn,
      ),
      ModeloEjemplar.BuscarPorLibro(id, conn),
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

  /** Alta de ficha bibliográfica (sin ejemplares; se agregan después). */
  Crear(datos, id_usuario) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [duplicado] = await Consultar(
        'SELECT id_libro FROM Libros WHERE ISBN = ?',
        [datos.ISBN],
        conn,
      );
      if (duplicado) 
      {
        throw ErrorHttp.Conflicto('Ya existe una ficha con ese ISBN', {
          codigo: 'ISBN_DUPLICADO',
          id_libro: duplicado.id_libro,
        });
      }
      const result = await Consultar(
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
        conn,
      );
      await ReemplazarRelaciones(conn, result.insertId, datos);
      return ModeloLibro.BuscarPorId(result.insertId, {}, conn);
    });
  },

  /**
   * Edición de ficha. Reglas del prototipo: el ISBN no cambia, un libro
   * inactivo no se edita y el número de copias solo puede aumentar
   * (para reducir se usa "Dar de baja").
   */
  Actualizar(id, { Numero_Copias, ...datos }) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [libro] = await Consultar(
        'SELECT * FROM Libros WHERE id_libro = ? FOR UPDATE',
        [id],
        conn,
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
      const params = [];
      campos.forEach((campo) => 
      {
        if (datos[campo] !== undefined) 
        {
          sets.push(`${campo} = ?`);
          params.push(datos[campo]);
        }
      });
      if (sets.length) 
      {
        await Consultar(
          `UPDATE Libros SET ${sets.join(', ')} WHERE id_libro = ?`,
          [...params, id],
          conn,
        );
      }
      await ReemplazarRelaciones(conn, id, datos);

      if (Numero_Copias !== undefined) 
      {
        const [{ actuales }] = await Consultar(
          'SELECT COUNT(*) AS actuales FROM Ejemplares WHERE id_libro = ? AND Estatus <> \'Baja\'',
          [id],
          conn,
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
          const [ref] = await Consultar(
            `SELECT Pasillo, Estante, Nivel FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Baja'
              ORDER BY num_copia LIMIT 1`,
            [id],
            conn,
          );
          await ModeloEjemplar.Agregar(id, Numero_Copias - actuales, ref || {}, conn);
        }
      }
      return ModeloLibro.BuscarPorId(id, {}, conn);
    });
  },

  /**
   * Activa o inactiva el libro completo. Para inactivar, ninguna copia
   * puede estar en préstamo o apartada. Un libro inactivo deja de
   * aparecer en el catálogo y sus copias no se pueden prestar.
   */
  CambiarEstatus(id, estatus) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [libro] = await Consultar(
        'SELECT * FROM Libros WHERE id_libro = ? FOR UPDATE',
        [id],
        conn,
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
          conn,
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
      await Consultar('UPDATE Libros SET Estatus = ? WHERE id_libro = ?', [estatus, id], conn);
      return ModeloLibro.BuscarPorId(id, {}, conn);
    });
  },

  async ContarActivos() 
  {
    const [{ n: total }] = await Consultar('SELECT COUNT(*) AS n FROM Libros WHERE Estatus = \'Activo\'');
    return total;
  },
};

export { ModeloLibro };
