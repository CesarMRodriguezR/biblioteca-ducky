/*
 * ******************************************************************
 * Nombre del programa: API-LISTA-ESPERA · ModeloListaEspera.js
 * Función: Apartados de libros sin copias disponibles y su atención en orden de llegada.
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
 *     Módulo              Objetivo
 *     SELECT_LISTA        Consulta base de los apartados con usuario y libro
 *     ModeloListaEspera   Acceso a la lista de espera de libros
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

/*
 * Constante: SELECT_LISTA
 * Objetivo: Consulta base de los apartados con usuario y libro.
 */
const SELECT_LISTA = `
  SELECT le.*, l.Titulo, l.ISBN, u.Nombre_Usuario, u.Matricula_Nomina,
         (SELECT COUNT(*) FROM ListaEspera x
           WHERE x.id_libro = le.id_libro AND x.Estatus = 'En espera'
             AND (x.Fecha_Peticion < le.Fecha_Peticion
                  OR (x.Fecha_Peticion = le.Fecha_Peticion AND x.id_lista_espera < le.id_lista_espera))
         ) + 1 AS Posicion
    FROM ListaEspera le
    JOIN Libros l   ON l.id_libro = le.id_libro
    JOIN Usuarios u ON u.id_usuario = le.id_usuario`;

/*
 * Módulo: ModeloListaEspera
 * Objetivo: Acceso a la lista de espera de libros.
 */
const ModeloListaEspera = {
  /*
   * Función: Listar
   * Objetivo: Listar los registros de apartado de la lista de espera con filtros y paginación.
   * Entrada: { id_usuario, id_libro, estatus, limit?, offset? } (opcional)
   * Salida: Promesa con las filas encontradas
   */
  Listar({ id_usuario, id_libro, estatus, limit = 100, offset = 0 } = {})
  {
    const condicion = [];
    const parametros = [];
    if (id_usuario)
    {
      condicion.push('le.id_usuario = ?');
      parametros.push(id_usuario);
    }
    if (id_libro)
    {
      condicion.push('le.id_libro = ?');
      parametros.push(id_libro);
    }
    if (estatus)
    {
      condicion.push('le.Estatus = ?');
      parametros.push(estatus);
    }
    parametros.push(Number(limit), Number(offset));
    return Consultar(
      `${SELECT_LISTA}
       ${condicion.length ? `WHERE ${condicion.join(' AND ')}` : ''}
       ORDER BY le.Fecha_Peticion, le.id_lista_espera
       LIMIT ? OFFSET ?`,
      parametros,
    );
  },

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener un apartado de la lista de espera por su id.
   * Entrada: id, conexion
   * Salida: Promesa con el registro encontrado o null si no existe
   */
  async BuscarPorId(id, conexion)
  {
    const filas = await Consultar(`${SELECT_LISTA} WHERE le.id_lista_espera = ?`, [id], conexion);
    return filas[0] || null;
  },

  /*
   * Función: Inscribir
   * Objetivo: Solo se puede apartar un libro sin copias de Consulta externa libres.
   * Entrada: id_usuario, id_libro
   * Salida: Promesa con el apartado creado
   */
  Inscribir(id_usuario, id_libro)
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [libro] = await Consultar(
        'SELECT id_libro, Estatus FROM Libros WHERE id_libro = ?',
        [id_libro],
        conexion,
      );
      if (!libro || libro.Estatus !== 'Activo')
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }

      const [{ prestables }] = await Consultar(
        `SELECT COUNT(*) AS prestables FROM Ejemplares
          WHERE id_libro = ? AND Estatus = 'Consulta externa'`,
        [id_libro],
        conexion,
      );
      if (prestables > 0)
      {
        throw ErrorHttp.Conflicto(
          'Hay copias para llevar a casa; solicita el préstamo directamente',
        );
      }

      const [duplicado] = await Consultar(
        `SELECT 1 FROM ListaEspera
          WHERE id_usuario = ? AND id_libro = ? AND Estatus IN ('En espera','Notificado')`,
        [id_usuario, id_libro],
        conexion,
      );
      if (duplicado)
      {
        throw ErrorHttp.Conflicto('Ya estás en la lista de espera de este libro');
      }

      const [prestado] = await Consultar(
        `SELECT 1 FROM Prestamos
          WHERE id_usuario = ? AND id_libro = ? AND Estado IN ('Activo','Vencido')`,
        [id_usuario, id_libro],
        conexion,
      );
      if (prestado)
      {
        throw ErrorHttp.Conflicto('Ya tienes este libro en préstamo');
      }

      const resultado = await Consultar(
        'INSERT INTO ListaEspera (id_usuario, id_libro) VALUES (?, ?)',
        [id_usuario, id_libro],
        conexion,
      );
      return ModeloListaEspera.BuscarPorId(resultado.insertId, conexion);
    });
  },

  /*
   * Función: Cancelar
   * Objetivo: Cancela un apartado. Si estaba notificado, el ejemplar apartado pasa al siguiente
   *           en espera o vuelve a quedar disponible.
   * Entrada: id
   * Salida: Promesa con el apartado cancelado
   */
  Cancelar(id)
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const [registro] = await Consultar(
        'SELECT * FROM ListaEspera WHERE id_lista_espera = ? FOR UPDATE',
        [id],
        conexion,
      );
      if (!registro)
      {
        throw ErrorHttp.NoEncontrado('Registro de lista de espera no encontrado');
      }
      if (!['En espera', 'Notificado'].includes(registro.Estatus))
      {
        throw ErrorHttp.Conflicto('El registro ya no está activo');
      }

      await Consultar(
        'UPDATE ListaEspera SET Estatus = \'Cancelado\' WHERE id_lista_espera = ?',
        [id],
        conexion,
      );

      if (registro.Estatus === 'Notificado')
      {
        const [siguiente] = await Consultar(
          `SELECT id_lista_espera FROM ListaEspera
            WHERE id_libro = ? AND Estatus = 'En espera'
            ORDER BY Fecha_Peticion, id_lista_espera LIMIT 1 FOR UPDATE`,
          [registro.id_libro],
          conexion,
        );
        if (siguiente)
        {
          await Consultar(
            'UPDATE ListaEspera SET Estatus = \'Notificado\' WHERE id_lista_espera = ?',
            [siguiente.id_lista_espera],
            conexion,
          );
        }
        else
        {
          await Consultar(
            `UPDATE Ejemplares SET Estatus = 'Consulta externa'
              WHERE id_libro = ? AND Estatus = 'Apartado' LIMIT 1`,
            [registro.id_libro],
            conexion,
          );
        }
      }
      return ModeloListaEspera.BuscarPorId(id, conexion);
    });
  },
};

export { ModeloListaEspera };
