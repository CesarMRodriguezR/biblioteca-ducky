/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ModeloPerfil.js
 * Función: Perfiles (roles) y las funciones que tiene asignadas cada uno.
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
 *     PERFIL_PROTEGIDO    Perfil cuyas funciones no se pueden modificar
 *     ClaseModeloPerfil   Modelo de perfiles basado en ModeloBase con la gestión de…
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

import { ModeloBase } from './ModeloBase.js';
import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Constante: PERFIL_PROTEGIDO
 * Objetivo: Perfil cuyas funciones no se pueden modificar.
 */
const PERFIL_PROTEGIDO = 'Administrador';

/*
 * Clase: ClaseModeloPerfil
 * Objetivo: Modelo de perfiles basado en ModeloBase con la gestión de sus funciones.
 */
class ClaseModeloPerfil extends ModeloBase
{
  /*
   * Función: ClaseModeloPerfil.constructor
   * Objetivo: Configurar la tabla Perfiles.
   * Entrada: Ninguna
   * Salida: Instancia de ClaseModeloPerfil
   */
  constructor()
  {
    super({
      tabla: 'Perfiles',
      llave_primaria: 'id_perfil',
      columnas: ['Nombre_Rol', 'Estatus', 'Descripcion_Perfil'],
      buscables: ['Nombre_Rol', 'Descripcion_Perfil'],
    });
  }

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener un perfil con los ids de sus funciones.
   * Entrada: id, conexion
   * Salida: Promesa con el registro encontrado o null si no existe
   */
  async BuscarPorId(id, conexion)
  {
    const perfil = await super.BuscarPorId(id, conexion);
    if (!perfil)
    {
      return null;
    }
    perfil.Protegido = perfil.Nombre_Rol === PERFIL_PROTEGIDO;
    perfil.funciones = await this.ObtenerFunciones(id, conexion);
    return perfil;
  }

  /*
   * Función: BuscarTodosConFunciones
   * Objetivo: Todos los perfiles con la lista de ids de función asignadas.
   * Entrada: Ninguna
   * Salida: Promesa con los perfiles
   */
  async BuscarTodosConFunciones()
  {
    const perfiles = await Consultar('SELECT * FROM Perfiles ORDER BY CAST(id_perfil AS UNSIGNED)');
    const asignaciones = await Consultar('SELECT id_perfil, id_funcion FROM PerfilFuncion');
    return perfiles.map((perfil) => ({
      ...perfil,
      Protegido: perfil.Nombre_Rol === PERFIL_PROTEGIDO,
      funciones: asignaciones
        .filter((asignacion) => asignacion.id_perfil === perfil.id_perfil)
        .map((asignacion) => asignacion.id_funcion),
    }));
  }

  /*
   * Función: ObtenerFunciones
   * Objetivo: Obtener los ids de función asignados a un perfil.
   * Entrada: id_perfil, conexion
   * Salida: Promesa con los ids
   */
  ObtenerFunciones(id_perfil, conexion)
  {
    return Consultar(
      `SELECT f.id_funcion, f.Nombre_Funcion, f.Descripcion_Funcion, f.Estatus
         FROM PerfilFuncion pf
         JOIN Funciones f ON f.id_funcion = pf.id_funcion
        WHERE pf.id_perfil = ?
        ORDER BY CAST(f.id_funcion AS UNSIGNED)`,
      [id_perfil],
      conexion,
    );
  }

  /*
   * Función: AsignarFunciones
   * Objetivo: Reemplaza las funciones del perfil; aplica a todas sus cuentas.
   * Entrada: id_perfil, ids_funcion
   * Salida: Promesa con el perfil actualizado
   */
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
    return EjecutarEnTransaccion(async (conexion) =>
    {
      await Consultar('DELETE FROM PerfilFuncion WHERE id_perfil = ?', [id_perfil], conexion);
      for (const id_funcion of [...new Set(ids_funcion)])
      {
        await Consultar(
          'INSERT INTO PerfilFuncion (id_funcion, id_perfil) VALUES (?, ?)',
          [id_funcion, id_perfil],
          conexion,
        );
      }
      return this.BuscarPorId(id_perfil, conexion);
    });
  }
}

export const ModeloPerfil = new ClaseModeloPerfil();
