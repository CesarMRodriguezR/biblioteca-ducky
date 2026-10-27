/*
 * ******************************************************************
 * Nombre del programa: API-MODELO-BASE · ModeloBase.js
 * Función: Modelo genérico de lectura y escritura para tablas con llave primaria simple.
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
 *     Módulo       Objetivo
 *     ModeloBase   Modelo genérico para tablas con llave primaria simple.…
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

/*
 * Clase: ModeloBase
 * Objetivo: Modelo genérico para tablas con llave primaria simple. Solo acepta las columnas
 *           declaradas en `columns`, así los nombres de columna nunca vienen del cliente y los
 *           valores siempre van parametrizados.
 */
class ModeloBase
{
  /*
   * Función: ModeloBase.constructor
   * Objetivo: Guardar la tabla, su llave primaria y las columnas permitidas.
   * Entrada: { tabla, llave_primaria, columnas, buscables?, ordenar_por }
   * Salida: Instancia de ModeloBase
   */
  constructor({ tabla, llave_primaria, columnas, buscables = [], ordenar_por })
  {
    this.tabla = tabla;
    this.llave_primaria = llave_primaria;
    this.columnas = columnas;
    this.buscables = buscables;
    this.ordenar_por = ordenar_por || llave_primaria;
  }

  /*
   * Función: FiltrarColumnas
   * Objetivo: Conservar solo las columnas declaradas del objeto recibido.
   * Entrada: datos
   * Salida: Objeto con las columnas permitidas
   */
  FiltrarColumnas(datos)
  {
    return Object.fromEntries(
      Object.entries(datos).filter(
        ([clave, valor]) => this.columnas.includes(clave) && valor !== undefined,
      ),
    );
  }

  /*
   * Función: BuscarTodos
   * Objetivo: Listar registros con búsqueda opcional y paginación.
   * Entrada: { q, limit?, offset? } (opcional), conexion
   * Salida: Promesa con las filas encontradas
   */
  async BuscarTodos({ q: texto_busqueda, limit = 100, offset = 0 } = {}, conexion)
  {
    const parametros = [];
    let condicion = '';
    if (texto_busqueda && this.buscables.length)
    {
      condicion = `WHERE ${this.buscables.map((buscable) => `\`${buscable}\` LIKE ?`).join(' OR ')}`;
      this.buscables.forEach(() => parametros.push(`%${texto_busqueda}%`));
    }
    parametros.push(Number(limit), Number(offset));
    return Consultar(
      `SELECT * FROM \`${this.tabla}\` ${condicion} ORDER BY \`${this.ordenar_por}\` LIMIT ? OFFSET ?`,
      parametros,
      conexion,
    );
  }

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener un registro por su llave primaria.
   * Entrada: id, conexion
   * Salida: Promesa con el registro encontrado o null si no existe
   */
  async BuscarPorId(id, conexion)
  {
    const filas = await Consultar(
      `SELECT * FROM \`${this.tabla}\` WHERE \`${this.llave_primaria}\` = ?`,
      [id],
      conexion,
    );
    return filas[0] || null;
  }

  /*
   * Función: Crear
   * Objetivo: Insertar un registro con las columnas permitidas.
   * Entrada: datos, conexion
   * Salida: Promesa con el registro creado
   */
  async Crear(datos, conexion)
  {
    const valores = this.FiltrarColumnas(datos);
    const claves = Object.keys(valores);
    const resultado = await Consultar(
      `INSERT INTO \`${this.tabla}\` (${claves.map((clave) => `\`${clave}\``).join(', ')})
       VALUES (${claves.map(() => '?').join(', ')})`,
      Object.values(valores),
      conexion,
    );
    return this.BuscarPorId(resultado.insertId, conexion);
  }

  /*
   * Función: Actualizar
   * Objetivo: Actualizar las columnas permitidas de un registro.
   * Entrada: id, datos, conexion
   * Salida: Promesa con el registro actualizado
   */
  async Actualizar(id, datos, conexion)
  {
    const valores = this.FiltrarColumnas(datos);
    const claves = Object.keys(valores);
    if (claves.length)
    {
      await Consultar(
        `UPDATE \`${this.tabla}\` SET ${claves.map((clave) => `\`${clave}\` = ?`).join(', ')}
         WHERE \`${this.llave_primaria}\` = ?`,
        [...Object.values(valores), id],
        conexion,
      );
    }
    return this.BuscarPorId(id, conexion);
  }

  /*
   * Función: Eliminar
   * Objetivo: Eliminar un registro por su llave primaria.
   * Entrada: id, conexion
   * Salida: Promesa con true si se eliminó el registro
   */
  async Eliminar(id, conexion)
  {
    const resultado = await Consultar(
      `DELETE FROM \`${this.tabla}\` WHERE \`${this.llave_primaria}\` = ?`,
      [id],
      conexion,
    );
    return resultado.affectedRows > 0;
  }
}

export { ModeloBase };
