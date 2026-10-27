import { Consultar } from '../configuracion/conexion.js';

/**
 * Modelo genérico para tablas con llave primaria simple.
 * Solo acepta las columnas declaradas en `columns`, así los nombres de
 * columna nunca vienen del cliente y los valores siempre van parametrizados.
 */
class ModeloBase 
{
  /**
   * @param {object} cfg
   * @param {string}   cfg.table       Nombre de la tabla
   * @param {string}   cfg.primaryKey  Columna PK (autoincremental)
   * @param {string[]} cfg.columns     Columnas editables
   * @param {string[]} [cfg.searchable] Columnas para búsqueda con ?q=
   * @param {string}   [cfg.orderBy]   Orden por defecto
   */
  constructor({ tabla, llave_primaria, columnas, buscables = [], ordenar_por }) 
  {
    this.tabla = tabla;
    this.llave_primaria = llave_primaria;
    this.columnas = columnas;
    this.buscables = buscables;
    this.ordenar_por = ordenar_por || llave_primaria;
  }

  FiltrarColumnas(data) 
  {
    return Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) => this.columnas.includes(key) && value !== undefined,
      ),
    );
  }

  async BuscarTodos({ q: texto_busqueda, limit = 100, offset = 0 } = {}, conn) 
  {
    const params = [];
    let where = '';
    if (texto_busqueda && this.buscables.length) 
    {
      where = `WHERE ${this.buscables.map((buscable) => `\`${buscable}\` LIKE ?`).join(' OR ')}`;
      this.buscables.forEach(() => params.push(`%${texto_busqueda}%`));
    }
    params.push(Number(limit), Number(offset));
    return Consultar(
      `SELECT * FROM \`${this.tabla}\` ${where} ORDER BY \`${this.ordenar_por}\` LIMIT ? OFFSET ?`,
      params,
      conn,
    );
  }

  async BuscarPorId(id, conn) 
  {
    const rows = await Consultar(
      `SELECT * FROM \`${this.tabla}\` WHERE \`${this.llave_primaria}\` = ?`,
      [id],
      conn,
    );
    return rows[0] || null;
  }

  async Crear(data, conn) 
  {
    const values = this.FiltrarColumnas(data);
    const keys = Object.keys(values);
    const result = await Consultar(
      `INSERT INTO \`${this.tabla}\` (${keys.map((clave) => `\`${clave}\``).join(', ')})
       VALUES (${keys.map(() => '?').join(', ')})`,
      Object.values(values),
      conn,
    );
    return this.BuscarPorId(result.insertId, conn);
  }

  async Actualizar(id, data, conn) 
  {
    const values = this.FiltrarColumnas(data);
    const keys = Object.keys(values);
    if (keys.length) 
    {
      await Consultar(
        `UPDATE \`${this.tabla}\` SET ${keys.map((clave) => `\`${clave}\` = ?`).join(', ')}
         WHERE \`${this.llave_primaria}\` = ?`,
        [...Object.values(values), id],
        conn,
      );
    }
    return this.BuscarPorId(id, conn);
  }

  async Eliminar(id, conn) 
  {
    const result = await Consultar(
      `DELETE FROM \`${this.tabla}\` WHERE \`${this.llave_primaria}\` = ?`,
      [id],
      conn,
    );
    return result.affectedRows > 0;
  }
}

export { ModeloBase };
