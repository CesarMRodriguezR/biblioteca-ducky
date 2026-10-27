'use strict';

const { query, withTransaction } = require('../config/db');
const HttpError = require('../utils/HttpError');
const EjemplarModel = require('./EjemplarModel');

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
function parsearAutores(texto) {
  return String(texto)
    .split(/;|\s&\s|\sy\s/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((parte) => {
      if (parte.includes(',')) {
        const [apellido, ...resto] = parte.split(',');
        return { Apellido_Paterno: apellido.trim(), Nombre: resto.join(',').trim() || '—' };
      }
      const palabras = parte.split(/\s+/);
      const apellido = palabras.pop();
      return { Apellido_Paterno: apellido, Nombre: palabras.join(' ') || '—' };
    });
}

async function idsAutores(conn, texto) {
  const ids = [];
  for (const a of parsearAutores(texto)) {
    const [existente] = await query(
      'SELECT id_autor FROM Autores WHERE Apellido_Paterno = ? AND Nombre = ? LIMIT 1',
      [a.Apellido_Paterno, a.Nombre],
      conn,
    );
    if (existente) {
      ids.push(existente.id_autor);
    } else {
      const r = await query(
        'INSERT INTO Autores (Nombre, Apellido_Paterno) VALUES (?, ?)',
        [a.Nombre, a.Apellido_Paterno],
        conn,
      );
      ids.push(r.insertId);
    }
  }
  return [...new Set(ids)];
}

async function idsTemas(conn, texto) {
  const ids = [];
  const nombres = String(texto).split(',').map((t) => t.trim()).filter(Boolean);
  for (const nombre of nombres) {
    const [existente] = await query('SELECT id_tema FROM Temas WHERE Nombre_Tema = ?', [nombre], conn);
    if (existente) {
      ids.push(existente.id_tema);
    } else {
      const r = await query('INSERT INTO Temas (Nombre_Tema) VALUES (?)', [nombre], conn);
      ids.push(r.insertId);
    }
  }
  return ids;
}

async function reemplazarRelaciones(conn, idLibro, { Autor, Tema }) {
  if (Autor !== undefined) {
    const autores = await idsAutores(conn, Autor);
    if (!autores.length) throw HttpError.badRequest('Indica al menos un autor');
    await query('DELETE FROM AutoresLibros WHERE id_libro = ?', [idLibro], conn);
    for (const idAutor of autores) {
      await query('INSERT INTO AutoresLibros (id_libro, id_autor) VALUES (?, ?)', [idLibro, idAutor], conn);
    }
  }
  if (Tema !== undefined) {
    const temas = await idsTemas(conn, Tema);
    await query('DELETE FROM TemasLibros WHERE id_libro = ?', [idLibro], conn);
    for (const idTema of temas) {
      await query('INSERT INTO TemasLibros (id_libro, id_tema) VALUES (?, ?)', [idLibro, idTema], conn);
    }
  }
}

function construirFiltro({
  q, campo = 'todos', idTema, idEditorial, soloDisponibles, incluirInactivos, anioDesde, anioHasta,
}) {
  const where = [];
  const params = [];
  if (!incluirInactivos) where.push("c.Estatus = 'Activo'");
  if (q) {
    const columnas = CAMPOS_BUSQUEDA[campo] || CAMPOS_BUSQUEDA.todos;
    where.push(`(${columnas.map((col) => `${col} LIKE ?`).join(' OR ')})`);
    columnas.forEach(() => params.push(`%${q}%`));
  }
  if (idTema) {
    where.push('EXISTS (SELECT 1 FROM TemasLibros tl WHERE tl.id_libro = c.id_libro AND tl.id_tema = ?)');
    params.push(idTema);
  }
  if (idEditorial) { where.push('c.id_editorial = ?'); params.push(idEditorial); }
  if (anioDesde) { where.push('c.Anio >= ?'); params.push(anioDesde); }
  if (anioHasta) { where.push('c.Anio <= ?'); params.push(anioHasta); }
  if (soloDisponibles) where.push('c.Ejemplares_Disponibles > 0');
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

const LibroModel = {
  parsearAutores,

  /** Búsqueda del catálogo con filtro por campo, rango de años, orden y paginación. */
  async buscar({ orden = 'titulo', limit = 6, offset = 0, ...filtros } = {}) {
    const { whereSql, params } = construirFiltro(filtros);
    const [{ total }] = await query(`SELECT COUNT(*) AS total FROM vw_catalogo c ${whereSql}`, params);
    const datos = await query(
      `SELECT c.* FROM vw_catalogo c ${whereSql}
        ORDER BY ${ORDENES[orden] || ORDENES.titulo}
        LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)],
    );
    return { total, datos };
  },

  /** Todas las coincidencias, sin paginar (listado imprimible). */
  listado({ orden = 'titulo', ...filtros } = {}) {
    const { whereSql, params } = construirFiltro(filtros);
    return query(
      `SELECT c.* FROM vw_catalogo c ${whereSql} ORDER BY ${ORDENES[orden] || ORDENES.titulo}`,
      params,
    );
  },

  async findByIsbn(isbn) {
    const rows = await query('SELECT id_libro FROM Libros WHERE ISBN = ?', [isbn]);
    return rows[0] ? LibroModel.findById(rows[0].id_libro) : null;
  },

  /**
   * Ficha del libro. Con `completa` incluye la lista de ejemplares con
   * código y ubicación; sin ella, solo el conteo por estado (vista de
   * alumnos, profesores y colaboradores).
   */
  async findById(id, { completa = true } = {}, conn) {
    const rows = await query('SELECT * FROM vw_catalogo WHERE id_libro = ?', [id], conn);
    const libro = rows[0];
    if (!libro) return null;

    const [autores, temas, ejemplares] = await Promise.all([
      query(
        `SELECT a.* FROM AutoresLibros al JOIN Autores a ON a.id_autor = al.id_autor
          WHERE al.id_libro = ? ORDER BY a.id_autor`,
        [id], conn,
      ),
      query(
        `SELECT t.* FROM TemasLibros tl JOIN Temas t ON t.id_tema = tl.id_tema
          WHERE tl.id_libro = ? ORDER BY t.Nombre_Tema`,
        [id], conn,
      ),
      EjemplarModel.findByLibro(id, conn),
    ]);

    const activos = ejemplares.filter((e) => e.Estatus !== 'Baja');
    const conteo = (estatus) => activos.filter((e) => e.Estatus === estatus).length;
    const resumenCopias = {
      Disponible: conteo('Disponible'),
      'Consulta externa': conteo('Consulta externa'),
      'En prestamo': conteo('En prestamo') + conteo('Apartado'),
    };

    return {
      ...libro,
      Autor: autores.map((a) => `${a.Apellido_Paterno}, ${a.Nombre}`).join('; '),
      Tema: temas.map((t) => t.Nombre_Tema).join(', '),
      Seccion: temas[0]?.Nombre_Tema ?? null,
      autores,
      temas,
      resumenCopias,
      ...(completa && { ejemplares }),
    };
  },

  /** Alta de ficha bibliográfica (sin ejemplares; se agregan después). */
  create(datos, idUsuario) {
    return withTransaction(async (conn) => {
      const [duplicado] = await query('SELECT id_libro FROM Libros WHERE ISBN = ?', [datos.ISBN], conn);
      if (duplicado) {
        throw HttpError.conflict('Ya existe una ficha con ese ISBN', { codigo: 'ISBN_DUPLICADO', id_libro: duplicado.id_libro });
      }
      const result = await query(
        `INSERT INTO Libros (ISBN, Titulo, Anio, Sinopsis, id_editorial, id_usuario, Precio, Estatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')`,
        [datos.ISBN, datos.Titulo, datos.Anio, datos.Sinopsis, datos.id_editorial, idUsuario, datos.Precio],
        conn,
      );
      await reemplazarRelaciones(conn, result.insertId, datos);
      return LibroModel.findById(result.insertId, {}, conn);
    });
  },

  /**
   * Edición de ficha. Reglas del prototipo: el ISBN no cambia, un libro
   * inactivo no se edita y el número de copias solo puede aumentar
   * (para reducir se usa "Dar de baja").
   */
  update(id, { Numero_Copias, ...datos }) {
    return withTransaction(async (conn) => {
      const [libro] = await query('SELECT * FROM Libros WHERE id_libro = ? FOR UPDATE', [id], conn);
      if (!libro) throw HttpError.notFound('Libro no encontrado');
      if (libro.Estatus !== 'Activo') {
        throw HttpError.conflict('Este libro está inactivo y no se puede editar. Primero reactívalo desde Libros.', {
          codigo: 'LIBRO_INACTIVO',
        });
      }
      if (datos.ISBN !== undefined && datos.ISBN !== libro.ISBN) {
        throw HttpError.badRequest('No se puede cambiar el ISBN de un libro.', { codigo: 'ISBN_INMUTABLE' });
      }

      const campos = ['Titulo', 'Anio', 'Sinopsis', 'id_editorial', 'Precio'];
      const sets = [];
      const params = [];
      campos.forEach((c) => {
        if (datos[c] !== undefined) { sets.push(`${c} = ?`); params.push(datos[c]); }
      });
      if (sets.length) {
        await query(`UPDATE Libros SET ${sets.join(', ')} WHERE id_libro = ?`, [...params, id], conn);
      }
      await reemplazarRelaciones(conn, id, datos);

      if (Numero_Copias !== undefined) {
        const [{ actuales }] = await query(
          `SELECT COUNT(*) AS actuales FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Baja'`,
          [id],
          conn,
        );
        if (Numero_Copias < actuales) {
          throw HttpError.badRequest('Para reducir copias usa «Dar de baja» con un motivo.', { codigo: 'REDUCIR_COPIAS' });
        }
        if (Numero_Copias > actuales) {
          const [ref] = await query(
            `SELECT Pasillo, Estante, Nivel FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Baja'
              ORDER BY num_copia LIMIT 1`,
            [id],
            conn,
          );
          await EjemplarModel.agregar(id, Numero_Copias - actuales, ref || {}, conn);
        }
      }
      return LibroModel.findById(id, {}, conn);
    });
  },

  /**
   * Activa o inactiva el libro completo. Para inactivar, ninguna copia
   * puede estar en préstamo o apartada. Un libro inactivo deja de
   * aparecer en el catálogo y sus copias no se pueden prestar.
   */
  cambiarEstatus(id, estatus) {
    return withTransaction(async (conn) => {
      const [libro] = await query('SELECT * FROM Libros WHERE id_libro = ? FOR UPDATE', [id], conn);
      if (!libro) throw HttpError.notFound('Libro no encontrado');
      if (libro.Estatus === estatus) {
        throw HttpError.conflict(`El libro ya está ${estatus.toLowerCase()}`);
      }
      if (estatus === 'Inactivo') {
        const prestadas = await query(
          `SELECT Codigo FROM Ejemplares WHERE id_libro = ? AND Estatus IN ('En prestamo','Apartado')`,
          [id],
          conn,
        );
        if (prestadas.length) {
          const codigos = prestadas.map((p) => p.Codigo).join(', ');
          throw HttpError.conflict(
            `No se puede inactivar el libro: tiene copias en préstamo (${codigos}).`,
            { codigo: 'COPIAS_EN_PRESTAMO', copias: prestadas.map((p) => p.Codigo) },
          );
        }
      }
      await query('UPDATE Libros SET Estatus = ? WHERE id_libro = ?', [estatus, id], conn);
      return LibroModel.findById(id, {}, conn);
    });
  },

  async contarActivos() {
    const [{ n }] = await query(`SELECT COUNT(*) AS n FROM Libros WHERE Estatus = 'Activo'`);
    return n;
  },
};

module.exports = LibroModel;
