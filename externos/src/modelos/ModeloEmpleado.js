/*
 * ******************************************************************
 * Nombre del programa: EMPLEADOS · ModeloEmpleado.js
 * Función: Consultar y corregir los empleados del sistema de nómina (sistema externo).
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Filtros y datos validados por el controlador
 * Salida: Filas de la base de datos empleados_ducky
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     CAMPOS_EMPLEADO     Columnas que entrega la API de Empleados
 *     CAMPOS_EDITABLES    Columnas que se pueden corregir
 *     ModeloEmpleado      Acceso a los empleados
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Solo usa la base de datos de Empleados (bd_empleados).
 * ******************************************************************
 */

import { bd_empleados } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Constante: CAMPOS_EMPLEADO
 * Objetivo: Columnas que entrega la API de Empleados.
 */
const CAMPOS_EMPLEADO = `
  e.Numero_Nomina, e.Nombre, e.Segundo_Nombre, e.Apellido_Paterno, e.Apellido_Materno,
  e.Correo_Institucional, e.RFC, e.Telefono, e.Puesto, e.Tipo, d.Nombre AS Departamento,
  e.Fecha_Ingreso, e.Estatus, e.Fecha_Actualizacion`;

/*
 * Constante: CAMPOS_EDITABLES
 * Objetivo: Columnas que se pueden corregir desde la API (simula la captura en Recursos
 *           Humanos).
 */
const CAMPOS_EDITABLES = [
  'Numero_Nomina',
  'Nombre',
  'Segundo_Nombre',
  'Apellido_Paterno',
  'Apellido_Materno',
  'Correo_Institucional',
  'Puesto',
  'Tipo',
  'Estatus',
];

/*
 * Módulo: ModeloEmpleado
 * Objetivo: Acceso a los empleados.
 */
const ModeloEmpleado = {
  /*
   * Función: Listar
   * Objetivo: Listar los empleados, opcionalmente solo los de un estatus.
   * Entrada: { estatus } (opcional)
   * Salida: Promesa con los empleados
   */
  Listar({ estatus } = {})
  {
    return bd_empleados.Consultar(
      `SELECT ${CAMPOS_EMPLEADO}
         FROM Empleados e JOIN Departamentos d ON d.id_departamento = e.id_departamento
        ${estatus ? 'WHERE e.Estatus = ?' : ''}
        ORDER BY e.Numero_Nomina`,
      estatus ? [estatus] : [],
    );
  },

  /*
   * Función: BuscarPorNomina
   * Objetivo: Obtener un empleado por su número de nómina.
   * Entrada: nomina
   * Salida: Promesa con el empleado o null
   */
  async BuscarPorNomina(nomina)
  {
    const [empleado] = await bd_empleados.Consultar(
      `SELECT ${CAMPOS_EMPLEADO}
         FROM Empleados e JOIN Departamentos d ON d.id_departamento = e.id_departamento
        WHERE e.Numero_Nomina = ?`,
      [nomina],
    );
    return empleado ?? null;
  },

  /*
   * Función: Actualizar
   * Objetivo: Corregir los datos de un empleado (p. ej. un nombre que no se capturó).
   * Entrada: nomina, datos
   * Salida: Promesa con el empleado actualizado
   */
  async Actualizar(nomina, datos)
  {
    const campos = CAMPOS_EDITABLES.filter((campo) => datos[campo] !== undefined);
    if (!campos.length)
    {
      throw new ErrorHttp(400, 'No hay datos que actualizar');
    }
    const resultado = await bd_empleados.Consultar(
      `UPDATE Empleados SET ${campos.map((campo) => `${campo} = ?`).join(', ')}
        WHERE Numero_Nomina = ?`,
      [...campos.map((campo) => datos[campo]), nomina],
    );
    if (!resultado.affectedRows)
    {
      throw new ErrorHttp(404, `No existe el empleado con nómina ${nomina}`);
    }
    return ModeloEmpleado.BuscarPorNomina(datos.Numero_Nomina ?? nomina);
  },
};

export { ModeloEmpleado };
