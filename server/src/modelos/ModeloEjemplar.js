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
 *     ESTADOS_EDITABLES   Estados que el personal puede asignar a una copia
 *     ESTADOS_PRESTADA    Estados de una copia que está fuera de la biblioteca
 *     MAXIMO_COPIAS       Copias que puede tener un libro
 *     CopiaVisible        Agregar a una copia su código visible y su ubicación interpretada
 *     ModeloEjemplar      Acceso a las copias físicas de los libros
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
 * (5) Columnas del diagrama: id_libro, num_copia, Estatus y Ubicacion (un solo código, ver
 *     utilidades/CodigoUbicacion.js). Una copia retirada queda en Estatus 'Inactivo'.
 * ******************************************************************
 */

import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import {
  CodigoEjemplar,
  GenerarCodigoUbicacion,
  InterpretarCodigoUbicacion,
} from '../utilidades/CodigoUbicacion.js';

/*
 * Constante: ESTADOS_EDITABLES
 * Objetivo: Estados que el personal puede asignar a una copia («En préstamo» lo asigna el
 *           sistema y «Inactivo» es la baja).
 */
const ESTADOS_EDITABLES = ['Disponible', 'Consulta Externa'];

/*
 * Constante: ESTADOS_PRESTADA
 * Objetivo: Estados de una copia que está fuera de la biblioteca y no se puede modificar.
 */
const ESTADOS_PRESTADA = ['En préstamo'];

/*
 * Constante: MAXIMO_COPIAS
 * Objetivo: Copias que puede tener un libro; mantiene único el código visible EJ-…
 */
const MAXIMO_COPIAS = 99;

/*
 * Función: CopiaVisible
 * Objetivo: Agregar a una copia su código visible (EJ-00101) y los componentes de su ubicación,
 *           interpretados del código guardado.
 * Entrada: copia (fila de Ejemplares)
 * Salida: Copia con Codigo, Pasillo, Estante, Nivel y Seccion
 */
function CopiaVisible(copia)
{
  return {
    ...copia,
    Codigo: CodigoEjemplar(copia.id_libro, copia.num_copia),
    ...InterpretarCodigoUbicacion(copia.Ubicacion),
  };
}

/*
 * Módulo: ModeloEjemplar
 * Objetivo: Acceso a las copias físicas de los libros.
 */
const ModeloEjemplar = {
  ESTADOS_EDITABLES,
  ESTADOS_PRESTADA,
  CopiaVisible,

  /*
   * Función: BuscarPorLibro
   * Objetivo: Listar las copias de un libro con su código, ubicación y estado.
   * Entrada: id_libro, conexion
   * Salida: Promesa con las copias
   */
  async BuscarPorLibro(id_libro, conexion)
  {
    const copias = await Consultar(
      'SELECT * FROM Ejemplares WHERE id_libro = ? ORDER BY num_copia',
      [id_libro],
      conexion,
    );
    return copias.map(CopiaVisible);
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
    return filas[0] ? CopiaVisible(filas[0]) : null;
  },

  /*
   * Función: Agregar
   * Objetivo: Agrega `cantidad` copias con el siguiente num_copia. La ubicación se guarda como
   *           un código; los componentes que no se indiquen se toman de las demás copias del
   *           libro y la sección, de su primer tema.
   * Entrada: id_libro, cantidad, { Pasillo, Estante, Nivel, Seccion, Estatus? } (opcional),
   *          conn_externa
   * Salida: Promesa con los códigos visibles de las copias creadas
   */
  async Agregar(
    id_libro,
    cantidad,
    { Pasillo, Estante, Nivel, Seccion, Estatus = 'Disponible' } = {},
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

      const [[referencia], [tema]] = await Promise.all([
        Consultar(
          `SELECT Ubicacion FROM Ejemplares WHERE id_libro = ? AND Estatus <> 'Inactivo'
            ORDER BY num_copia LIMIT 1`,
          [id_libro],
          conexion,
        ),
        Consultar(
          `SELECT t.Nombre_Tema FROM TemasLibros tl JOIN Temas t ON t.id_tema = tl.id_tema
            WHERE tl.id_libro = ? ORDER BY t.Nombre_Tema LIMIT 1`,
          [id_libro],
          conexion,
        ),
      ]);
      const anterior = InterpretarCodigoUbicacion(referencia?.Ubicacion);
      const ubicacion = GenerarCodigoUbicacion({
        Pasillo: Pasillo ?? anterior.Pasillo,
        Estante: Estante ?? anterior.Estante,
        Nivel: Nivel ?? anterior.Nivel,
        Seccion: Seccion ?? anterior.Seccion ?? tema?.Nombre_Tema,
      });
      if (!ubicacion)
      {
        throw ErrorHttp.SolicitudInvalida('Indica la ubicación de las copias.');
      }
      const [{ ultimo }] = await Consultar(
        'SELECT COALESCE(MAX(num_copia), 0) AS ultimo FROM Ejemplares WHERE id_libro = ? FOR UPDATE',
        [id_libro],
        conexion,
      );
      if (ultimo + cantidad > MAXIMO_COPIAS)
      {
        throw ErrorHttp.Conflicto(`Un libro puede tener como máximo ${MAXIMO_COPIAS} copias.`);
      }
      const nuevos = [];
      for (let indice = 1; indice <= cantidad; indice += 1)
      {
        const num = ultimo + indice;
        await Consultar(
          'INSERT INTO Ejemplares (id_libro, num_copia, Estatus, Ubicacion) VALUES (?, ?, ?, ?)',
          [id_libro, num, Estatus, ubicacion],
          conexion,
        );
        nuevos.push(CodigoEjemplar(id_libro, num));
      }
      return nuevos;
    };
    return conn_externa ? Trabajo(conn_externa) : EjecutarEnTransaccion(Trabajo);
  },

  /*
   * Función: CambiarEstado
   * Objetivo: Cambio hecho por el personal: estado (solo entre Disponible y Consulta Externa)
   *           o ubicación. Al cambiar un componente de la ubicación se genera un código nuevo.
   * Entrada: id_libro, num_copia, { Estatus, Pasillo, Estante, Nivel, Seccion }
   * Salida: Promesa con la copia actualizada
   */
  CambiarEstado(id_libro, num_copia, { Estatus, Pasillo, Estante, Nivel, Seccion })
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
        if (ESTADOS_PRESTADA.includes(copia.Estatus))
        {
          throw ErrorHttp.Conflicto(
            'Copia en préstamo: debe devolverse antes de reasignar su estado.',
            {
              codigo: 'COPIA_EN_PRESTAMO',
            },
          );
        }
        if (copia.Estatus === 'Inactivo')
        {
          throw ErrorHttp.Conflicto('La copia está dada de baja.');
        }
        if (!ESTADOS_EDITABLES.includes(Estatus))
        {
          throw ErrorHttp.SolicitudInvalida('Solo se puede asignar Disponible o Consulta Externa.');
        }
      }
      const sets = [];
      const parametros = [];
      if (Estatus !== undefined)
      {
        sets.push('Estatus = ?');
        parametros.push(Estatus);
      }
      const cambios = { Pasillo, Estante, Nivel, Seccion };
      if (Object.values(cambios).some((valor) => valor !== undefined))
      {
        const actual = InterpretarCodigoUbicacion(copia.Ubicacion);
        Object.entries(cambios).forEach(([campo, valor]) =>
        {
          if (valor !== undefined)
          {
            actual[campo] = valor;
          }
        });
        sets.push('Ubicacion = ?');
        parametros.push(GenerarCodigoUbicacion(actual));
      }
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
   * Objetivo: Retira una copia (Estatus 'Inactivo'). Las copias en préstamo no se retiran. El
   *           motivo se pide como en el prototipo, pero el diagrama no tiene dónde guardarlo:
   *           solo se devuelve en la respuesta.
   * Entrada: id_libro, num_copia, motivo
   * Salida: Promesa con la copia dada de baja y su Motivo_Baja
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
      if (ESTADOS_PRESTADA.includes(copia.Estatus))
      {
        throw ErrorHttp.Conflicto(
          'Las copias en préstamo no se pueden retirar hasta que se devuelvan.',
          {
            codigo: 'COPIA_EN_PRESTAMO',
          },
        );
      }
      if (copia.Estatus === 'Inactivo')
      {
        throw ErrorHttp.Conflicto('La copia ya estaba dada de baja.');
      }
      await Consultar(
        'UPDATE Ejemplares SET Estatus = \'Inactivo\' WHERE id_libro = ? AND num_copia = ?',
        [id_libro, num_copia],
        conexion,
      );
      return {
        ...(await ModeloEjemplar.BuscarUno(id_libro, num_copia, conexion)),
        Motivo_Baja: motivo,
      };
    });
  },
};

export { ModeloEjemplar };
