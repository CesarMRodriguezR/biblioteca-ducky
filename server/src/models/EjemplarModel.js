/**
 * Ejemplares (copias físicas). Estados:
 *   Disponible        → se consulta dentro de la biblioteca.
 *   Consulta externa  → se puede llevar a casa (es la única que se presta).
 *   En prestamo       → lo asigna el sistema al registrar un préstamo.
 *   Apartado          → reservado para el primero de la lista de espera.
 *   Baja              → retirada con un motivo (Perdido, Robado, Dañado, Obsoleto).
 */
import { query, withTransaction } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';

const ESTADOS_EDITABLES = ['Disponible', 'Consulta externa'];

/** Código visible: EJ- + id_libro*100 + copia (EJ-00101) o el siguiente libre. */
async function generarCodigo(conn, idLibro, numCopia) {
  if (numCopia < 100) {
    const candidato = `EJ-${String(idLibro * 100 + numCopia).padStart(5, '0')}`;
    const [ocupado] = await query('SELECT 1 FROM Ejemplares WHERE Codigo = ?', [candidato], conn);
    if (!ocupado) return candidato;
  }
  const [{ maximo }] = await query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(Codigo, 4) AS UNSIGNED)), 0) AS maximo FROM Ejemplares`,
    [],
    conn,
  );
  return `EJ-${String(maximo + 1).padStart(5, '0')}`;
}

const EjemplarModel = {
  ESTADOS_EDITABLES,

  findByLibro(idLibro, conn) {
    return query('SELECT * FROM Ejemplares WHERE id_libro = ? ORDER BY num_copia', [idLibro], conn);
  },

  async findOne(idLibro, numCopia, conn) {
    const rows = await query(
      'SELECT * FROM Ejemplares WHERE id_libro = ? AND num_copia = ?',
      [idLibro, numCopia],
      conn,
    );
    return rows[0] || null;
  },

  /** Primera copia prestable (Consulta externa), bloqueada para la transacción. */
  async findPrestable(idLibro, conn) {
    const rows = await query(
      `SELECT * FROM Ejemplares
        WHERE id_libro = ? AND Estatus = 'Consulta externa'
        ORDER BY num_copia LIMIT 1 FOR UPDATE`,
      [idLibro],
      conn,
    );
    return rows[0] || null;
  },

  /**
   * Agrega `cantidad` copias con el siguiente num_copia y su código.
   * Si no se indica ubicación, se usa la de las demás copias del libro.
   */
  async agregar(idLibro, cantidad, { Pasillo, Estante, Nivel, Estatus = 'Disponible' } = {}, connExterna) {
    const trabajo = async (conn) => {
      const [libro] = await query('SELECT Estatus FROM Libros WHERE id_libro = ?', [idLibro], conn);
      if (!libro) throw HttpError.notFound('Libro no encontrado');
      if (libro.Estatus !== 'Activo') throw HttpError.conflict('No se pueden agregar copias a un libro inactivo');

      const [ref] = await query(
        `SELECT Pasillo, Estante, Nivel FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Baja'
          ORDER BY num_copia LIMIT 1`,
        [idLibro],
        conn,
      );
      const ubicacion = {
        Pasillo: Pasillo ?? ref?.Pasillo ?? null,
        Estante: Estante ?? ref?.Estante ?? null,
        Nivel: Nivel ?? ref?.Nivel ?? null,
      };
      const [{ ultimo }] = await query(
        'SELECT COALESCE(MAX(num_copia), 0) AS ultimo FROM Ejemplares WHERE id_libro = ? FOR UPDATE',
        [idLibro],
        conn,
      );
      const nuevos = [];
      for (let i = 1; i <= cantidad; i += 1) {
        const num = ultimo + i;
        const codigo = await generarCodigo(conn, idLibro, num);
        await query(
          `INSERT INTO Ejemplares (id_libro, num_copia, Estatus, Codigo, Pasillo, Estante, Nivel)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [idLibro, num, Estatus, codigo, ubicacion.Pasillo, ubicacion.Estante, ubicacion.Nivel],
          conn,
        );
        nuevos.push(codigo);
      }
      return nuevos;
    };
    return connExterna ? trabajo(connExterna) : withTransaction(trabajo);
  },

  /** Actualización interna (préstamos, devoluciones, lista de espera). */
  async setEstatus(idLibro, numCopia, estatus, conn) {
    await query(
      'UPDATE Ejemplares SET Estatus = ? WHERE id_libro = ? AND num_copia = ?',
      [estatus, idLibro, numCopia],
      conn,
    );
  },

  /**
   * Cambio de estado hecho por el personal: solo entre Disponible y
   * Consulta externa. "En préstamo" lo asigna el sistema.
   */
  cambiarEstado(idLibro, numCopia, { Estatus, Pasillo, Estante, Nivel }) {
    return withTransaction(async (conn) => {
      const [copia] = await query(
        `SELECT e.*, l.Estatus AS Estatus_Libro FROM Ejemplares e
           JOIN Libros l ON l.id_libro = e.id_libro
          WHERE e.id_libro = ? AND e.num_copia = ? FOR UPDATE`,
        [idLibro, numCopia],
        conn,
      );
      if (!copia) throw HttpError.notFound('Ejemplar no encontrado');
      if (copia.Estatus_Libro !== 'Activo') {
        throw HttpError.conflict('Este libro está inactivo y no se puede editar.', { codigo: 'LIBRO_INACTIVO' });
      }
      if (Estatus !== undefined) {
        if (['En prestamo', 'Apartado'].includes(copia.Estatus)) {
          throw HttpError.conflict('Copia en préstamo: debe devolverse antes de reasignar su estado.', {
            codigo: 'COPIA_EN_PRESTAMO',
          });
        }
        if (copia.Estatus === 'Baja') throw HttpError.conflict('La copia está dada de baja.');
        if (!ESTADOS_EDITABLES.includes(Estatus)) {
          throw HttpError.badRequest('Solo se puede asignar Disponible o Consulta externa.');
        }
      }
      const sets = [];
      const params = [];
      [['Estatus', Estatus], ['Pasillo', Pasillo], ['Estante', Estante], ['Nivel', Nivel]].forEach(([c, v]) => {
        if (v !== undefined) { sets.push(`${c} = ?`); params.push(v); }
      });
      if (sets.length) {
        await query(
          `UPDATE Ejemplares SET ${sets.join(', ')} WHERE id_libro = ? AND num_copia = ?`,
          [...params, idLibro, numCopia],
          conn,
        );
      }
      return EjemplarModel.findOne(idLibro, numCopia, conn);
    });
  },

  /** Retira una copia con motivo. Las copias en préstamo no se retiran. */
  retirar(idLibro, numCopia, motivo) {
    return withTransaction(async (conn) => {
      const [copia] = await query(
        'SELECT * FROM Ejemplares WHERE id_libro = ? AND num_copia = ? FOR UPDATE',
        [idLibro, numCopia],
        conn,
      );
      if (!copia) throw HttpError.notFound('Ejemplar no encontrado');
      if (['En prestamo', 'Apartado'].includes(copia.Estatus)) {
        throw HttpError.conflict('Las copias en préstamo no se pueden retirar hasta que se devuelvan.', {
          codigo: 'COPIA_EN_PRESTAMO',
        });
      }
      if (copia.Estatus === 'Baja') throw HttpError.conflict('La copia ya estaba dada de baja.');
      await query(
        `UPDATE Ejemplares SET Estatus = 'Baja', Motivo_Baja = ? WHERE id_libro = ? AND num_copia = ?`,
        [motivo, idLibro, numCopia],
        conn,
      );
      return EjemplarModel.findOne(idLibro, numCopia, conn);
    });
  },
};

export { EjemplarModel };
