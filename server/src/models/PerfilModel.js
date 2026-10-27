import { BaseModel } from './BaseModel.js';
import { query, withTransaction } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';

/** El perfil Administrador tiene acceso completo y sus funciones no se modifican. */
const PERFIL_PROTEGIDO = 'Administrador';

class PerfilModelClass extends BaseModel {
  constructor() {
    super({
      table: 'Perfiles',
      primaryKey: 'id_perfil',
      columns: ['Nombre_Rol', 'Estatus', 'Descripcion_Perfil'],
      searchable: ['Nombre_Rol', 'Descripcion_Perfil'],
      orderBy: 'id_perfil',
    });
  }

  async findById(id, conn) {
    const perfil = await super.findById(id, conn);
    if (!perfil) return null;
    perfil.Protegido = perfil.Nombre_Rol === PERFIL_PROTEGIDO;
    perfil.funciones = await this.funciones(id, conn);
    return perfil;
  }

  /** Todos los perfiles con la lista de ids de función asignadas. */
  async findAllConFunciones() {
    const perfiles = await query('SELECT * FROM Perfiles ORDER BY id_perfil');
    const asignaciones = await query('SELECT id_perfil, id_funcion FROM PerfilFuncion');
    return perfiles.map((p) => ({
      ...p,
      Protegido: p.Nombre_Rol === PERFIL_PROTEGIDO,
      funciones: asignaciones.filter((a) => a.id_perfil === p.id_perfil).map((a) => a.id_funcion),
    }));
  }

  funciones(idPerfil, conn) {
    return query(
      `SELECT f.id_funcion, f.Nombre_Funcion, f.Descripcion_Funcion, f.Estatus
         FROM PerfilFuncion pf
         JOIN Funciones f ON f.id_funcion = pf.id_funcion
        WHERE pf.id_perfil = ?
        ORDER BY f.id_funcion`,
      [idPerfil],
      conn,
    );
  }

  /** Reemplaza las funciones del perfil; aplica a todas sus cuentas. */
  async setFunciones(idPerfil, idsFuncion) {
    const perfil = await super.findById(idPerfil);
    if (!perfil) throw HttpError.notFound('Perfil no encontrado');
    if (perfil.Nombre_Rol === PERFIL_PROTEGIDO) {
      throw HttpError.conflict('El Administrador tiene acceso completo al sistema; sus funciones no se pueden modificar.');
    }
    return withTransaction(async (conn) => {
      await query('DELETE FROM PerfilFuncion WHERE id_perfil = ?', [idPerfil], conn);
      for (const idFuncion of [...new Set(idsFuncion)]) {
        await query('INSERT INTO PerfilFuncion (id_funcion, id_perfil) VALUES (?, ?)', [idFuncion, idPerfil], conn);
      }
      return this.findById(idPerfil, conn);
    });
  }
}

export const PerfilModel = new PerfilModelClass();
