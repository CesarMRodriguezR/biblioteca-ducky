/**
 * Ejemplares (copias físicas). Estados:
 *   Disponible        → se consulta dentro de la biblioteca.
 *   Consulta externa  → se puede llevar a casa (es la única que se presta).
 *   En prestamo       → lo asigna el sistema al registrar un préstamo.
 *   Apartado          → reservado para el primero de la lista de espera.
 *   Baja              → retirada con un motivo (Perdido, Robado, Dañado, Obsoleto).
 */
import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

const ESTADOS_EDITABLES = ['Disponible', 'Consulta externa'];

/** Código visible: EJ- + id_libro*100 + copia (EJ-00101) o el siguiente libre. */
async function GenerarCodigo(conn, id_libro, num_copia) 
{
  if (num_copia < 100) 
  {
    const candidato = `EJ-${String(id_libro * 100 + num_copia).padStart(5, '0')}`;
    const [ocupado] = await Consultar(
      'SELECT 1 FROM Ejemplares WHERE Codigo = ?',
      [candidato],
      conn,
    );
    if (!ocupado) 
    {
      return candidato;
    }
  }
  const [{ maximo }] = await Consultar(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(Codigo, 4) AS UNSIGNED)), 0) AS maximo FROM Ejemplares',
    [],
    conn,
  );
  return `EJ-${String(maximo + 1).padStart(5, '0')}`;
}

const ModeloEjemplar = {
  ESTADOS_EDITABLES,

  BuscarPorLibro(id_libro, conn) 
  {
    return Consultar(
      'SELECT * FROM Ejemplares WHERE id_libro = ? ORDER BY num_copia',
      [id_libro],
      conn,
    );
  },

  async BuscarUno(id_libro, num_copia, conn) 
  {
    const rows = await Consultar(
      'SELECT * FROM Ejemplares WHERE id_libro = ? AND num_copia = ?',
      [id_libro, num_copia],
      conn,
    );
    return rows[0] || null;
  },

  /** Primera copia prestable (Consulta externa), bloqueada para la transacción. */
  async BuscarPrestable(id_libro, conn) 
  {
    const rows = await Consultar(
      `SELECT * FROM Ejemplares
        WHERE id_libro = ? AND Estatus = 'Consulta externa'
        ORDER BY num_copia LIMIT 1 FOR UPDATE`,
      [id_libro],
      conn,
    );
    return rows[0] || null;
  },

  /**
   * Agrega `cantidad` copias con el siguiente num_copia y su código.
   * Si no se indica ubicación, se usa la de las demás copias del libro.
   */
  async Agregar(
    id_libro,
    cantidad,
    { Pasillo, Estante, Nivel, Estatus = 'Disponible' } = {},
    conn_externa,
  ) 
  {
    const Trabajo = async (conn) => 
    {
      const [libro] = await Consultar(
        'SELECT Estatus FROM Libros WHERE id_libro = ?',
        [id_libro],
        conn,
      );
      if (!libro) 
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }
      if (libro.Estatus !== 'Activo')
      {
        throw ErrorHttp.Conflicto('No se pueden agregar copias a un libro inactivo');
      }

      const [ref] = await Consultar(
        `SELECT Pasillo, Estante, Nivel FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Baja'
          ORDER BY num_copia LIMIT 1`,
        [id_libro],
        conn,
      );
      const ubicacion = {
        Pasillo: Pasillo ?? ref?.Pasillo ?? null,
        Estante: Estante ?? ref?.Estante ?? null,
        Nivel: Nivel ?? ref?.Nivel ?? null,
      };
      const [{ ultimo }] = await Consultar(
        'SELECT COALESCE(MAX(num_copia), 0) AS ultimo FROM Ejemplares WHERE id_libro = ? FOR UPDATE',
        [id_libro],
        conn,
      );
      const nuevos = [];
      for (let indice = 1; indice <= cantidad; indice += 1) 
      {
        const num = ultimo + indice;
        const codigo = await GenerarCodigo(conn, id_libro, num);
        await Consultar(
          `INSERT INTO Ejemplares (id_libro, num_copia, Estatus, Codigo, Pasillo, Estante, Nivel)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id_libro, num, Estatus, codigo, ubicacion.Pasillo, ubicacion.Estante, ubicacion.Nivel],
          conn,
        );
        nuevos.push(codigo);
      }
      return nuevos;
    };
    return conn_externa ? Trabajo(conn_externa) : EjecutarEnTransaccion(Trabajo);
  },

  /** Actualización interna (préstamos, devoluciones, lista de espera). */
  async AsignarEstatus(id_libro, num_copia, estatus, conn) 
  {
    await Consultar(
      'UPDATE Ejemplares SET Estatus = ? WHERE id_libro = ? AND num_copia = ?',
      [estatus, id_libro, num_copia],
      conn,
    );
  },

  /**
   * Cambio de estado hecho por el personal: solo entre Disponible y
   * Consulta externa. "En préstamo" lo asigna el sistema.
   */
  CambiarEstado(id_libro, num_copia, { Estatus, Pasillo, Estante, Nivel }) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [copia] = await Consultar(
        `SELECT e.*, l.Estatus AS Estatus_Libro FROM Ejemplares e
           JOIN Libros l ON l.id_libro = e.id_libro
          WHERE e.id_libro = ? AND e.num_copia = ? FOR UPDATE`,
        [id_libro, num_copia],
        conn,
      );
      if (!copia) 
      {
        throw ErrorHttp.NoEncontrado('Ejemplar no encontrado');
      }
      if (copia.Estatus_Libro !== 'Activo') 
      {
        throw ErrorHttp.Conflicto('Este libro está inactivo y no se puede editar.', {
          codigo: 'LIBRO_INACTIVO',
        });
      }
      if (Estatus !== undefined) 
      {
        if (['En prestamo', 'Apartado'].includes(copia.Estatus)) 
        {
          throw ErrorHttp.Conflicto(
            'Copia en préstamo: debe devolverse antes de reasignar su estado.',
            {
              codigo: 'COPIA_EN_PRESTAMO',
            },
          );
        }
        if (copia.Estatus === 'Baja') 
        {
          throw ErrorHttp.Conflicto('La copia está dada de baja.');
        }
        if (!ESTADOS_EDITABLES.includes(Estatus)) 
        {
          throw ErrorHttp.SolicitudInvalida('Solo se puede asignar Disponible o Consulta externa.');
        }
      }
      const sets = [];
      const params = [];
      [
        ['Estatus', Estatus],
        ['Pasillo', Pasillo],
        ['Estante', Estante],
        ['Nivel', Nivel],
      ].forEach(([clave, valor]) => 
      {
        if (valor !== undefined) 
        {
          sets.push(`${clave} = ?`);
          params.push(valor);
        }
      });
      if (sets.length) 
      {
        await Consultar(
          `UPDATE Ejemplares SET ${sets.join(', ')} WHERE id_libro = ? AND num_copia = ?`,
          [...params, id_libro, num_copia],
          conn,
        );
      }
      return ModeloEjemplar.BuscarUno(id_libro, num_copia, conn);
    });
  },

  /** Retira una copia con motivo. Las copias en préstamo no se retiran. */
  Retirar(id_libro, num_copia, motivo) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [copia] = await Consultar(
        'SELECT * FROM Ejemplares WHERE id_libro = ? AND num_copia = ? FOR UPDATE',
        [id_libro, num_copia],
        conn,
      );
      if (!copia) 
      {
        throw ErrorHttp.NoEncontrado('Ejemplar no encontrado');
      }
      if (['En prestamo', 'Apartado'].includes(copia.Estatus)) 
      {
        throw ErrorHttp.Conflicto(
          'Las copias en préstamo no se pueden retirar hasta que se devuelvan.',
          {
            codigo: 'COPIA_EN_PRESTAMO',
          },
        );
      }
      if (copia.Estatus === 'Baja') 
      {
        throw ErrorHttp.Conflicto('La copia ya estaba dada de baja.');
      }
      await Consultar(
        'UPDATE Ejemplares SET Estatus = \'Baja\', Motivo_Baja = ? WHERE id_libro = ? AND num_copia = ?',
        [motivo, id_libro, num_copia],
        conn,
      );
      return ModeloEjemplar.BuscarUno(id_libro, num_copia, conn);
    });
  },
};

export { ModeloEjemplar };
