/*
 * ******************************************************************
 * Nombre del programa: CIAA · ModeloAlumno.js
 * Función: Consultar y corregir los alumnos del CIAA (sistema externo de alumnos).
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Filtros y datos validados por el controlador
 * Salida: Filas de la base de datos ciaa_ducky
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     CAMPOS_ALUMNO       Columnas que entrega la API del CIAA
 *     CAMPOS_EDITABLES    Columnas que se pueden corregir
 *     ModeloAlumno        Acceso a los alumnos del CIAA
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Solo usa la base de datos del CIAA (bd_ciaa).
 * ******************************************************************
 */

import { bd_ciaa } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Constante: CAMPOS_ALUMNO
 * Objetivo: Columnas que entrega la API del CIAA.
 */
const CAMPOS_ALUMNO = `
  a.Matricula, a.Nombre, a.Segundo_Nombre, a.Apellido_Paterno, a.Apellido_Materno,
  a.Correo_Institucional, a.Correo_Personal, a.Telefono, a.Fecha_Nacimiento,
  c.Clave AS Clave_Carrera, c.Nombre AS Carrera, a.Semestre, a.Estatus, a.Fecha_Actualizacion`;

/*
 * Constante: CAMPOS_EDITABLES
 * Objetivo: Columnas que se pueden corregir desde la API (simula la captura en el CIAA).
 */
const CAMPOS_EDITABLES = [
  'Matricula',
  'Nombre',
  'Segundo_Nombre',
  'Apellido_Paterno',
  'Apellido_Materno',
  'Correo_Institucional',
  'Semestre',
  'Estatus',
];

/*
 * Módulo: ModeloAlumno
 * Objetivo: Acceso a los alumnos del CIAA.
 */
const ModeloAlumno = {
  /*
   * Función: Listar
   * Objetivo: Listar los alumnos, opcionalmente solo los de un estatus.
   * Entrada: { estatus } (opcional)
   * Salida: Promesa con los alumnos
   */
  Listar({ estatus } = {})
  {
    return bd_ciaa.Consultar(
      `SELECT ${CAMPOS_ALUMNO}
         FROM Alumnos a JOIN Carreras c ON c.id_carrera = a.id_carrera
        ${estatus ? 'WHERE a.Estatus = ?' : ''}
        ORDER BY a.Matricula`,
      estatus ? [estatus] : [],
    );
  },

  /*
   * Función: BuscarPorMatricula
   * Objetivo: Obtener un alumno por su matrícula.
   * Entrada: matricula
   * Salida: Promesa con el alumno o null
   */
  async BuscarPorMatricula(matricula)
  {
    const [alumno] = await bd_ciaa.Consultar(
      `SELECT ${CAMPOS_ALUMNO}
         FROM Alumnos a JOIN Carreras c ON c.id_carrera = a.id_carrera
        WHERE a.Matricula = ?`,
      [matricula],
    );
    return alumno ?? null;
  },

  /*
   * Función: Actualizar
   * Objetivo: Corregir los datos de un alumno (p. ej. una matrícula mal capturada).
   * Entrada: matricula, datos
   * Salida: Promesa con el alumno actualizado
   */
  async Actualizar(matricula, datos)
  {
    const campos = CAMPOS_EDITABLES.filter((campo) => datos[campo] !== undefined);
    if (!campos.length)
    {
      throw new ErrorHttp(400, 'No hay datos que actualizar');
    }
    const resultado = await bd_ciaa.Consultar(
      `UPDATE Alumnos SET ${campos.map((campo) => `${campo} = ?`).join(', ')}
        WHERE Matricula = ?`,
      [...campos.map((campo) => datos[campo]), matricula],
    );
    if (!resultado.affectedRows)
    {
      throw new ErrorHttp(404, `No existe el alumno con matrícula ${matricula}`);
    }
    return ModeloAlumno.BuscarPorMatricula(datos.Matricula ?? matricula);
  },
};

export { ModeloAlumno };
