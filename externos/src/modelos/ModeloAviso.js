/*
 * ******************************************************************
 * Nombre del programa: CIAA · ModeloAviso.js
 * Función: Guardar y listar los avisos que Biblio envía a Servicios Escolares (lista de alumnos
 *          deudores y libros perdidos).
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Avisos recibidos por la API del CIAA
 * Salida: Avisos guardados en ciaa_ducky.AvisosBiblioteca
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo        Objetivo
 *     TIPOS_AVISO   Tipos de aviso que acepta Servicios Escolares
 *     ModeloAviso   Acceso a los avisos de la biblioteca
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Solo usa la base de datos del CIAA; el detalle se guarda como texto JSON.
 * ******************************************************************
 */

import { bd_ciaa } from '../configuracion/conexion.js';

/*
 * Constante: TIPOS_AVISO
 * Objetivo: Tipos de aviso que acepta Servicios Escolares.
 */
const TIPOS_AVISO = ['Lista de deudores', 'Libro perdido'];

/*
 * Función: DesdeFila
 * Objetivo: Convertir una fila de la tabla en un aviso con el detalle ya interpretado.
 * Entrada: fila
 * Salida: Aviso con Detalle como objeto
 */
function DesdeFila(fila)
{
  return { ...fila, Detalle: JSON.parse(fila.Detalle) };
}

/*
 * Módulo: ModeloAviso
 * Objetivo: Acceso a los avisos de la biblioteca.
 */
const ModeloAviso = {
  TIPOS_AVISO,

  /*
   * Función: Registrar
   * Objetivo: Guardar un aviso de la biblioteca.
   * Entrada: { tipo, periodo, matricula, detalle }
   * Salida: Promesa con el aviso guardado
   */
  async Registrar({ tipo, periodo, matricula, detalle })
  {
    const alta = await bd_ciaa.Consultar(
      'INSERT INTO AvisosBiblioteca (Tipo, Periodo, Matricula, Detalle) VALUES (?, ?, ?, ?)',
      [tipo, periodo ?? null, matricula ?? null, JSON.stringify(detalle)],
    );
    const [fila] = await bd_ciaa.Consultar(
      'SELECT * FROM AvisosBiblioteca WHERE id_aviso = ?',
      [alta.insertId],
    );
    return DesdeFila(fila);
  },

  /*
   * Función: Listar
   * Objetivo: Listar los avisos recibidos, del más reciente al más antiguo.
   * Entrada: { tipo } (opcional)
   * Salida: Promesa con los avisos
   */
  async Listar({ tipo } = {})
  {
    const filas = await bd_ciaa.Consultar(
      `SELECT * FROM AvisosBiblioteca ${tipo ? 'WHERE Tipo = ?' : ''}
        ORDER BY id_aviso DESC`,
      tipo ? [tipo] : [],
    );
    return filas.map(DesdeFila);
  },
};

export { ModeloAviso };
