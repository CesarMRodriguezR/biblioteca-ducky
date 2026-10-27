/*
 * ******************************************************************
 * Nombre del programa: API-MULTAS · ModeloMulta.js
 * Función: Multas por retraso o daño y su pago.
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
 *     Módulo         Objetivo
 *     SELECT_MULTA   Consulta base de las multas con usuario y préstamo
 *     ModeloMulta    Acceso a las multas
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

import { Consultar } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { Hoy } from '../utilidades/fechas.js';

/*
 * Constante: SELECT_MULTA
 * Objetivo: Consulta base de las multas con usuario y préstamo.
 */
const SELECT_MULTA = `
  SELECT m.*, u.Nombre_Usuario, u.Matricula_Nomina, l.Titulo,
         CASE WHEN m.Fecha_Pagado IS NULL THEN 'Pendiente' ELSE 'Pagada' END AS Estado
    FROM Multas m
    JOIN Usuarios u ON u.id_usuario = m.id_usuario
    LEFT JOIN Prestamos p ON p.id_prestamo = m.id_prestamo
    LEFT JOIN Libros l ON l.id_libro = p.id_libro`;

/*
 * Módulo: ModeloMulta
 * Objetivo: Acceso a las multas.
 */
const ModeloMulta = {
  /*
   * Función: Listar
   * Objetivo: Listar los registros de multa con filtros y paginación.
   * Entrada: { id_usuario, pendientes, limit?, offset? } (opcional)
   * Salida: Promesa con las filas encontradas
   */
  Listar({ id_usuario, pendientes, limit = 100, offset = 0 } = {})
  {
    const condicion = [];
    const parametros = [];
    if (id_usuario)
    {
      condicion.push('m.id_usuario = ?');
      parametros.push(id_usuario);
    }
    if (pendientes === true)
    {
      condicion.push('m.Fecha_Pagado IS NULL');
    }
    if (pendientes === false)
    {
      condicion.push('m.Fecha_Pagado IS NOT NULL');
    }
    parametros.push(Number(limit), Number(offset));
    return Consultar(
      `${SELECT_MULTA}
       ${condicion.length ? `WHERE ${condicion.join(' AND ')}` : ''}
       ORDER BY m.Fecha_Pagado IS NULL DESC, m.id_multa DESC
       LIMIT ? OFFSET ?`,
      parametros,
    );
  },

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener un multa por su id.
   * Entrada: id
   * Salida: Promesa con el registro encontrado o null si no existe
   */
  async BuscarPorId(id)
  {
    const filas = await Consultar(`${SELECT_MULTA} WHERE m.id_multa = ?`, [id]);
    return filas[0] || null;
  },

  /*
   * Función: Crear
   * Objetivo: Multa manual (p. ej. por daño), sin préstamo obligatorio.
   * Entrada: { id_usuario, id_prestamo?, Cantidad_a_Pagar, Justificacion }
   * Salida: Promesa con el registro creado
   */
  async Crear({ id_usuario, id_prestamo = null, Cantidad_a_Pagar, Justificacion })
  {
    const resultado = await Consultar(
      `INSERT INTO Multas (Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion)
       VALUES (?, ?, ?, ?)`,
      [Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion],
    );
    return ModeloMulta.BuscarPorId(resultado.insertId);
  },

  /*
   * Función: Pagar
   * Objetivo: Registrar el pago de una multa pendiente.
   * Entrada: id, fecha (opcional)
   * Salida: Promesa con la multa pagada
   */
  async Pagar(id, fecha = Hoy())
  {
    const multa = await ModeloMulta.BuscarPorId(id);
    if (!multa)
    {
      throw ErrorHttp.NoEncontrado('Multa no encontrada');
    }
    if (multa.Fecha_Pagado)
    {
      throw ErrorHttp.Conflicto('La multa ya está pagada');
    }
    await Consultar('UPDATE Multas SET Fecha_Pagado = ? WHERE id_multa = ?', [fecha, id]);
    return ModeloMulta.BuscarPorId(id);
  },
};

export { ModeloMulta };
