/*
 * ******************************************************************
 * Nombre del programa: API-BITACORA · ModeloBitacora.js
 * Función: Registrar y consultar las acciones relevantes que muestra la actividad reciente del
 *          panel.
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
 *     Módulo           Objetivo
 *     ModeloBitacora   Bitácora de acciones relevantes. Alimenta la "Actividad…
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
 * Módulo: ModeloBitacora
 * Objetivo: Bitácora de acciones relevantes. Alimenta la "Actividad reciente" del panel.
 *           Registrar nunca debe romper la operación principal, por eso los errores se reportan
 *           en consola y no se propagan.
 */
const ModeloBitacora = {
  /*
   * Función: Registrar
   * Objetivo: Guardar una acción en la bitácora sin interrumpir la operación si falla.
   * Entrada: id_usuario, accion, descripcion, conexion
   * Salida: Promesa sin valor
   */
  async Registrar(id_usuario, accion, descripcion, conexion)
  {
    try
    {
      await Consultar(
        'INSERT INTO Bitacora (id_usuario, Accion, Descripcion) VALUES (?, ?, ?)',
        [id_usuario ?? null, accion, descripcion.slice(0, 255)],
        conexion,
      );
    }
    catch (error)
    {
      console.error('No se pudo registrar en bitácora:', error.message);
    }
  },

  /*
   * Función: Recientes
   * Objetivo: Obtener las acciones más recientes con el nombre de quien las hizo.
   * Entrada: limit (opcional)
   * Salida: Promesa con las acciones
   */
  Recientes(limit = 10)
  {
    return Consultar(
      `SELECT b.id_bitacora, b.Accion, b.Descripcion, b.Fecha, u.Nombre_Completo
         FROM Bitacora b LEFT JOIN Usuarios u ON u.id_usuario = b.id_usuario
        ORDER BY b.Fecha DESC, b.id_bitacora DESC
        LIMIT ?`,
      [Number(limit)],
    );
  },
};

export { ModeloBitacora };
