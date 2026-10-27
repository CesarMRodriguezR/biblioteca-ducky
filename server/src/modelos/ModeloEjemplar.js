/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL03 · ModeloEjemplar.js
 * Función: Copias físicas de cada libro: alta, ubicación, cambio de estado y retiro.
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
 *     Módulo           Objetivo
 *     GenerarCodigo    Código visible: EJ- + id_libro*100 + copia (EJ-00101) o…
 *     ModeloEjemplar   Acceso a las copias físicas de los libros
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

const ESTADOS_EDITABLES = ['Disponible', 'Consulta externa'];

/*
 * Función: GenerarCodigo
 * Objetivo: Código visible: EJ- + id_libro*100 + copia (EJ-00101) o el siguiente libre.
 * Entrada: conexion, id_libro, num_copia
 * Salida: Promesa con el código, p. ej. EJ-00101
 */
async function GenerarCodigo(conexion, id_libro, num_copia)
{
  if (num_copia < 100)
  {
    const candidato = `EJ-${String(id_libro * 100 + num_copia).padStart(5, '0')}`;
    const [ocupado] = await Consultar(
      'SELECT 1 FROM Ejemplares WHERE Codigo = ?',
      [candidato],
      conexion,
    );
    if (!ocupado)
    {
      return candidato;
    }
  }
  const [{ maximo }] = await Consultar(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(Codigo, 4) AS UNSIGNED)), 0) AS maximo FROM Ejemplares',
    [],
    conexion,
  );
  return `EJ-${String(maximo + 1).padStart(5, '0')}`;
}

/*
 * Módulo: ModeloEjemplar
 * Objetivo: Acceso a las copias físicas de los libros.
 */
const ModeloEjemplar = {
  ESTADOS_EDITABLES,

  /*
   * Función: BuscarPorLibro
   * Objetivo: Listar las copias de un libro con su código, ubicación y estado.
   * Entrada: id_libro, conexion
   * Salida: Promesa con las copias
   */
  BuscarPorLibro(id_libro, conexion)
  {
    return Consultar(
      'SELECT * FROM Ejemplares WHERE id_libro = ? ORDER BY num_copia',
      [id_libro],
      conexion,
    );
  },

  /*
   * Función: BuscarUno
   * Objetivo: Obtener una copia de un libro.
   * Entrada: id_libro, num_copia, conexion
   * Salida: Promesa con la copia o null
   */
  async BuscarUno(id_libro, num_copia, conexion)
  {
    const filas = await Consultar(
      'SELECT * FROM Ejemplares WHERE id_libro = ? AND num_copia = ?',
      [id_libro, num_copia],
      conexion,
    );
    return filas[0] || null;
  },

  /*
   * Función: BuscarPrestable
   * Objetivo: Primera copia prestable (Consulta externa), bloqueada para la transacción.
   * Entrada: id_libro, conexion
   * Salida: Promesa con la copia o null
   */
  async BuscarPrestable(id_libro, conexion)
  {
    const filas = await Consultar(
      `SELECT * FROM Ejemplares
        WHERE id_libro = ? AND Estatus = 'Consulta externa'
        ORDER BY num_copia LIMIT 1 FOR UPDATE`,
      [id_libro],
      conexion,
    );
    return filas[0] || null;
  },

  /*
   * Función: Agregar
   * Objetivo: Agrega `cantidad` copias con el siguiente num_copia y su código. Si no se indica
   *           ubicación, se usa la de las demás copias del libro.
   * Entrada: id_libro, cantidad, { Pasillo, Estante, Nivel, Estatus? } (opcional), conn_externa
   * Salida: Promesa con los códigos de las copias creadas
   */
  async Agregar(
    id_libro,
    cantidad,
    { Pasillo, Estante, Nivel, Estatus = 'Disponible' } = {},
    conn_externa,
  )
  {
    const Trabajo = async (conexion) =>
    {
      const [libro] = await Consultar(
        'SELECT Estatus FROM Libros WHERE id_libro = ?',
        [id_libro],
        conexion,
      );
      if (!libro)
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }
      if (libro.Estatus !== 'Activo')
      {
        throw ErrorHttp.Conflicto('No se pueden agregar copias a un libro inactivo');
      }

      const [referencia] = await Consultar(
        `SELECT Pasillo, Estante, Nivel FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Baja'
          ORDER BY num_copia LIMIT 1`,
        [id_libro],
        conexion,
      );
      const ubicacion = {
        Pasillo: Pasillo ?? referencia?.Pasillo ?? null,
        Estante: Estante ?? referencia?.Estante ?? null,
        Nivel: Nivel ?? referencia?.Nivel ?? null,
      };
      const [{ ultimo }] = await Consultar(
        'SELECT COALESCE(MAX(num_copia), 0) AS ultimo FROM Ejemplares WHERE id_libro = ? FOR UPDATE',
        [id_libro],
        conexion,
      );
      const nuevos = [];
      for (let indice = 1; indice <= cantidad; indice += 1)
      {
        const num = ultimo + indice;
        const codigo = await GenerarCodigo(conexion, id_libro, num);
        await Consultar(
          `INSERT INTO Ejemplares (id_libro, num_copia, Estatus, Codigo, Pasillo, Estante, Nivel)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id_libro, num, Estatus, codigo, ubicacion.Pasillo, ubicacion.Estante, ubicacion.Nivel],
          conexion,
        );
        nuevos.push(codigo);
      }
      return nuevos;
    };
    return conn_externa ? Trabajo(conn_externa) : EjecutarEnTransaccion(Trabajo);
  },

  /*
   * Función: AsignarEstatus
   * Objetivo: Actualización interna (préstamos, devoluciones, lista de espera).
   * Entrada: id_libro, num_copia, estatus, conexion
   * Salida: Promesa con el resultado de la actualización
   */
  async AsignarEstatus(id_libro, num_copia, estatus, conexion)
  {
    await Consultar(
      'UPDATE Ejemplares SET Estatus = ? WHERE id_libro = ? AND num_copia = ?',
      [estatus, id_libro, num_copia],
      conexion,
    );
  },

  /*
   * Función: CambiarEstado
   * Objetivo: Cambio de estado hecho por el personal: solo entre Disponible y Consulta externa.
   *           "En préstamo" lo asigna el sistema.
   * Entrada: id_libro, num_copia, { Estatus, Pasillo, Estante, Nivel }
   * Salida: Promesa con la copia actualizada
   */
  CambiarEstado(id_libro, num_copia, { Estatus, Pasillo, Estante, Nivel })
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [copia] = await Consultar(
        `SELECT e.*, l.Estatus AS Estatus_Libro FROM Ejemplares e
           JOIN Libros l ON l.id_libro = e.id_libro
          WHERE e.id_libro = ? AND e.num_copia = ? FOR UPDATE`,
        [id_libro, num_copia],
        conexion,
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
      const parametros = [];
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
          parametros.push(valor);
        }
      });
      if (sets.length)
      {
        await Consultar(
          `UPDATE Ejemplares SET ${sets.join(', ')} WHERE id_libro = ? AND num_copia = ?`,
          [...parametros, id_libro, num_copia],
          conexion,
        );
      }
      return ModeloEjemplar.BuscarUno(id_libro, num_copia, conexion);
    });
  },

  /*
   * Función: Retirar
   * Objetivo: Retira una copia con motivo. Las copias en préstamo no se retiran.
   * Entrada: id_libro, num_copia, motivo
   * Salida: Promesa con la copia dada de baja
   */
  Retirar(id_libro, num_copia, motivo)
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [copia] = await Consultar(
        'SELECT * FROM Ejemplares WHERE id_libro = ? AND num_copia = ? FOR UPDATE',
        [id_libro, num_copia],
        conexion,
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
        conexion,
      );
      return ModeloEjemplar.BuscarUno(id_libro, num_copia, conexion);
    });
  },
};

export { ModeloEjemplar };
