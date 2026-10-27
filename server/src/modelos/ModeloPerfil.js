import { ModeloBase } from './ModeloBase.js';
import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/** El perfil Administrador tiene acceso completo y sus funciones no se modifican. */
const PERFIL_PROTEGIDO = 'Administrador';

class ClaseModeloPerfil extends ModeloBase 
{
  constructor() 
  {
    super({
      tabla: 'Perfiles',
      llave_primaria: 'id_perfil',
      columnas: ['Nombre_Rol', 'Estatus', 'Descripcion_Perfil'],
      buscables: ['Nombre_Rol', 'Descripcion_Perfil'],
      ordenar_por: 'id_perfil',
    });
  }

  async BuscarPorId(id, conn) 
  {
    const perfil = await super.BuscarPorId(id, conn);
    if (!perfil) 
    {
      return null;
    }
    perfil.Protegido = perfil.Nombre_Rol === PERFIL_PROTEGIDO;
    perfil.funciones = await this.ObtenerFunciones(id, conn);
    return perfil;
  }

  /** Todos los perfiles con la lista de ids de función asignadas. */
  async BuscarTodosConFunciones() 
  {
    const perfiles = await Consultar('SELECT * FROM Perfiles ORDER BY id_perfil');
    const asignaciones = await Consultar('SELECT id_perfil, id_funcion FROM PerfilFuncion');
    return perfiles.map((perfil) => ({
      ...perfil,
      Protegido: perfil.Nombre_Rol === PERFIL_PROTEGIDO,
      funciones: asignaciones
        .filter((asignacion) => asignacion.id_perfil === perfil.id_perfil)
        .map((asignacion) => asignacion.id_funcion),
    }));
  }

  ObtenerFunciones(id_perfil, conn) 
  {
    return Consultar(
      `SELECT f.id_funcion, f.Nombre_Funcion, f.Descripcion_Funcion, f.Estatus
         FROM PerfilFuncion pf
         JOIN Funciones f ON f.id_funcion = pf.id_funcion
        WHERE pf.id_perfil = ?
        ORDER BY f.id_funcion`,
      [id_perfil],
      conn,
    );
  }

  /** Reemplaza las funciones del perfil; aplica a todas sus cuentas. */
  async AsignarFunciones(id_perfil, ids_funcion) 
  {
    const perfil = await super.BuscarPorId(id_perfil);
    if (!perfil) 
    {
      throw ErrorHttp.NoEncontrado('Perfil no encontrado');
    }
    if (perfil.Nombre_Rol === PERFIL_PROTEGIDO) 
    {
      throw ErrorHttp.Conflicto(
        'El Administrador tiene acceso completo al sistema; sus funciones no se pueden modificar.',
      );
    }
    return EjecutarEnTransaccion(async (conn) => 
    {
      await Consultar('DELETE FROM PerfilFuncion WHERE id_perfil = ?', [id_perfil], conn);
      for (const id_funcion of [...new Set(ids_funcion)]) 
      {
        await Consultar(
          'INSERT INTO PerfilFuncion (id_funcion, id_perfil) VALUES (?, ?)',
          [id_funcion, id_perfil],
          conn,
        );
      }
      return this.BuscarPorId(id_perfil, conn);
    });
  }
}

export const ModeloPerfil = new ClaseModeloPerfil();
