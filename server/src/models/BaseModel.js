import { query } from '../config/db.js';

/**
 * Modelo genérico para tablas con llave primaria simple.
 * Solo acepta las columnas declaradas en `columns`, así los nombres de
 * columna nunca vienen del cliente y los valores siempre van parametrizados.
 */
class BaseModel {
  /**
   * @param {object} cfg
   * @param {string}   cfg.table       Nombre de la tabla
   * @param {string}   cfg.primaryKey  Columna PK (autoincremental)
   * @param {string[]} cfg.columns     Columnas editables
   * @param {string[]} [cfg.searchable] Columnas para búsqueda con ?q=
   * @param {string}   [cfg.orderBy]   Orden por defecto
   */
  constructor({ table, primaryKey, columns, searchable = [], orderBy }) {
    this.table = table;
    this.primaryKey = primaryKey;
    this.columns = columns;
    this.searchable = searchable;
    this.orderBy = orderBy || primaryKey;
  }

  pick(data) {
    return Object.fromEntries(
      Object.entries(data).filter(([key, value]) => this.columns.includes(key) && value !== undefined),
    );
  }

  async findAll({ q, limit = 100, offset = 0 } = {}, conn) {
    const params = [];
    let where = '';
    if (q && this.searchable.length) {
      where = `WHERE ${this.searchable.map((c) => `\`${c}\` LIKE ?`).join(' OR ')}`;
      this.searchable.forEach(() => params.push(`%${q}%`));
    }
    params.push(Number(limit), Number(offset));
    return query(
      `SELECT * FROM \`${this.table}\` ${where} ORDER BY \`${this.orderBy}\` LIMIT ? OFFSET ?`,
      params,
      conn,
    );
  }

  async findById(id, conn) {
    const rows = await query(
      `SELECT * FROM \`${this.table}\` WHERE \`${this.primaryKey}\` = ?`,
      [id],
      conn,
    );
    return rows[0] || null;
  }

  async create(data, conn) {
    const values = this.pick(data);
    const keys = Object.keys(values);
    const result = await query(
      `INSERT INTO \`${this.table}\` (${keys.map((k) => `\`${k}\``).join(', ')})
       VALUES (${keys.map(() => '?').join(', ')})`,
      Object.values(values),
      conn,
    );
    return this.findById(result.insertId, conn);
  }

  async update(id, data, conn) {
    const values = this.pick(data);
    const keys = Object.keys(values);
    if (keys.length) {
      await query(
        `UPDATE \`${this.table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')}
         WHERE \`${this.primaryKey}\` = ?`,
        [...Object.values(values), id],
        conn,
      );
    }
    return this.findById(id, conn);
  }

  async remove(id, conn) {
    const result = await query(
      `DELETE FROM \`${this.table}\` WHERE \`${this.primaryKey}\` = ?`,
      [id],
      conn,
    );
    return result.affectedRows > 0;
  }
}

export { BaseModel };
