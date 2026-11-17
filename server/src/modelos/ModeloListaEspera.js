/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL05 · ModeloListaEspera.js
 * Función: Lista de espera de un libro: consulta, registro de un lector y baja de un lector.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: ISBN del libro y matrícula del lector
 * Salida: Libro con sus ejemplares para préstamo externo y su lista de espera
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     ModeloListaEspera   Acceso a la lista de espera
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Estatus del diccionario: Pendiente (en espera), Atendida (se le prestó el libro) y
 *     Cancelada (se quitó de la lista). Notificado no se usa: el sistema no envía avisos.
 * (2) Tiene prioridad el primero que se registró (Fecha_Peticion y luego id); la regla se
 *     aplica al registrar el préstamo (ModeloPrestamo.Registrar).
 * ******************************************************************
 */

import { Consultar, SiguienteId } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy } from '../utilidades/fechas.js';
import { InterpretarCodigoUbicacion } from '../utilidades/CodigoUbicacion.js';
import { ModeloPrestamo } from './ModeloPrestamo.js';

/*
 * Módulo: ModeloListaEspera
 * Objetivo: Acceso a la lista de espera.
 */
const ModeloListaEspera = {
  /*
   * Función: BuscarLibro
   * Objetivo: Encontrar un libro activo por su ISBN (con o sin guiones) y devolver su lista de
   *           espera.
   * Entrada: isbn
   * Salida: Promesa con la lista de espera del libro
   */
  async BuscarLibro(isbn)
  {
    const limpio = String(isbn).trim();
    const [libro] = await Consultar(
      `SELECT id_libro FROM Libros
        WHERE Estatus = 'Activo' AND REPLACE(ISBN, '-', '') = ?`,
      [limpio.replace(/-/g, '')],
    );
    if (!libro)
    {
      throw ErrorHttp.NoEncontrado(`No hay un libro activo con el ISBN ${limpio}`);
    }
    return ModeloListaEspera.DelLibro(libro.id_libro);
  },

  /*
   * Función: DelLibro
   * Objetivo: Datos del libro, ejemplares para préstamo externo (libres de los que existen),
   *           próxima devolución y lectores en espera con su turno.
   * Entrada: id_libro
   * Salida: Promesa con { libro, prestables, prestables_libres, proxima_devolucion, lista,
   *         prioridad }
   */
  async DelLibro(id_libro)
  {
    const [[libro], [copias], lista] = await Promise.all([
      Consultar(
        `SELECT id_libro, ISBN, Titulo, Autores_Apellidos, Nombre_Editorial, Ubicacion
           FROM vw_catalogo WHERE id_libro = ?`,
        [id_libro],
      ),
      Consultar(
        `SELECT SUM(e.Estatus IN ('Consulta Externa','En préstamo')) AS prestables,
                SUM(e.Estatus = 'Consulta Externa') AS libres,
                (SELECT MIN(pr.Fecha_Entrega_Programada) FROM Prestamos pr
                  WHERE pr.id_libro = ? AND pr.Estado = 'Activo') AS proxima
           FROM Ejemplares e WHERE e.id_libro = ?`,
        [id_libro, id_libro],
      ),
      Consultar(
        `SELECT le.id_lista_espera, le.Fecha_Peticion, le.Estatus, u.id_usuario,
                u.Nombre_Completo, u.Matricula_Nomina, p.Nombre_Rol
           FROM ListaDeEspera le
           JOIN Usuarios u ON u.id_usuario = le.id_usuario
           JOIN Perfiles p ON p.id_perfil = u.id_perfil
          WHERE le.id_libro = ? AND le.Estatus = 'Pendiente'
          ORDER BY le.Fecha_Peticion, CAST(le.id_lista_espera AS UNSIGNED)`,
        [id_libro],
      ),
    ]);
    const libres = Number(copias.libres ?? 0);
    return {
      libro: { ...libro, ubicacion: InterpretarCodigoUbicacion(libro.Ubicacion) },
      prestables: Number(copias.prestables ?? 0),
      prestables_libres: libres,
      proxima_devolucion: copias.proxima,
      lista: lista.map((registro, indice) => ({ ...registro, Turno: indice + 1 })),
      prioridad: libres > 0 && lista.length ? lista[0] : null,
    };
  },

  /*
   * Función: Agregar
   * Objetivo: Registrar a un lector en la lista de espera de un libro. No procede si el libro
   *           tiene ejemplares libres, si el lector ya está en la lista o si ya tiene el libro.
   * Entrada: id_libro, matricula
   * Salida: Promesa con { registro, lugar, lista }
   */
  async Agregar(id_libro, matricula)
  {
    const lector = await ModeloPrestamo.BuscarLector(matricula);
    if (lector.Estatus !== 'Activo')
    {
      throw ErrorHttp.Conflicto(`La cuenta de ${lector.Nombre_Completo} está inactiva.`, {
        codigo: 'USUARIO_INACTIVO',
      });
    }
    const actual = await ModeloListaEspera.DelLibro(id_libro);
    if (actual.prestables_libres > 0)
    {
      throw ErrorHttp.Conflicto('Hay ejemplares disponibles para préstamo externo', {
        codigo: 'HAY_EJEMPLARES',
        mensaje: 'Registra el préstamo en lugar de agregar al lector a la lista de espera.',
      });
    }
    if (actual.lista.some((registro) => registro.id_usuario === lector.id_usuario))
    {
      throw ErrorHttp.Conflicto(
        `${lector.Nombre_Completo} ya está en la lista de espera de este libro`,
        { codigo: 'YA_EN_LISTA', mensaje: 'No se puede agregar dos veces al mismo lector.' },
      );
    }
    const [prestado] = await Consultar(
      `SELECT Fecha_Entrega_Programada FROM Prestamos
        WHERE id_usuario = ? AND id_libro = ? AND Estado = 'Activo'`,
      [lector.id_usuario, id_libro],
    );
    if (prestado)
    {
      throw ErrorHttp.Conflicto(`${lector.Nombre_Completo} ya tiene este libro en préstamo`, {
        codigo: 'YA_LO_TIENE',
        fecha: prestado.Fecha_Entrega_Programada,
      });
    }
    const id_lista_espera = await SiguienteId('ListaDeEspera', 'id_lista_espera');
    await Consultar(
      `INSERT INTO ListaDeEspera (id_lista_espera, Fecha_Peticion, Estatus, id_usuario, id_libro)
       VALUES (?, ?, 'Pendiente', ?, ?)`,
      [id_lista_espera, Hoy(), lector.id_usuario, id_libro],
    );
    const lista = await ModeloListaEspera.DelLibro(id_libro);
    return { id_lista_espera, lector, lugar: lista.lista.length, ...lista };
  },

  /*
   * Función: Quitar
   * Objetivo: Quitar a un lector de la lista de espera (queda Cancelada).
   * Entrada: id_lista_espera
   * Salida: Promesa con { registro, lista } del libro actualizado
   */
  async Quitar(id_lista_espera)
  {
    const [registro] = await Consultar(
      `SELECT le.id_libro, u.Nombre_Completo FROM ListaDeEspera le
         JOIN Usuarios u ON u.id_usuario = le.id_usuario
        WHERE le.id_lista_espera = ? AND le.Estatus = 'Pendiente'`,
      [id_lista_espera],
    );
    if (!registro)
    {
      throw ErrorHttp.NoEncontrado('Ese lector ya no está en la lista de espera.');
    }
    await Consultar(
      'UPDATE ListaDeEspera SET Estatus = \'Cancelada\' WHERE id_lista_espera = ?',
      [id_lista_espera],
    );
    const lista = await ModeloListaEspera.DelLibro(registro.id_libro);
    return { Nombre_Completo: registro.Nombre_Completo, ...lista };
  },
};

export { ModeloListaEspera };
