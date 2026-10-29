/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ModeloCiaa.js
 * Función: Obtener del CIAA (sistema externo de alumnos) los alumnos inscritos, tomando solo
 *          los datos que Biblio necesita.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Ninguna (la URL y la clave están en ENTORNO.EXTERNOS.CIAA)
 * Salida: Personas normalizadas para generar la lista de usuarios
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo       Objetivo
 *     ModeloCiaa   Acceso a la API del CIAA
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC cuya fuente de datos es una API externa, no MariaDB.
 * (2) El CIAA entrega más datos (carrera, teléfono, fecha de nacimiento…); Biblio se queda solo
 *     con matrícula, nombre, apellidos y correo institucional.
 * ******************************************************************
 */

import { ENTORNO } from '../configuracion/entorno.js';
import { LlamarSistemaExterno } from '../utilidades/LlamarSistemaExterno.js';

/*
 * Módulo: ModeloCiaa
 * Objetivo: Acceso a la API del CIAA.
 */
const ModeloCiaa = {
  /*
   * Función: ObtenerInscritos
   * Objetivo: Pedir al CIAA los alumnos inscritos y quedarse solo con lo necesario.
   * Entrada: Ninguna
   * Salida: Promesa con [{ Origen, Tipo, Matricula_Nomina, Nombre, Segundo_Nombre,
   *         Apellido_Paterno, Apellido_Materno, Correo }]
   */
  async ObtenerInscritos()
  {
    const { datos } = await LlamarSistemaExterno(
      ENTORNO.EXTERNOS.CIAA,
      'GET',
      '/alumnos?estatus=Inscrito',
    );
    return datos.map((alumno) => ({
      Origen: 'CIAA',
      Tipo: 'Alumno',
      Matricula_Nomina: String(alumno.Matricula ?? '').trim(),
      Nombre: alumno.Nombre ?? '',
      Segundo_Nombre: alumno.Segundo_Nombre ?? '',
      Apellido_Paterno: alumno.Apellido_Paterno ?? '',
      Apellido_Materno: alumno.Apellido_Materno ?? '',
      Correo: alumno.Correo_Institucional ?? null,
    }));
  },
};

export { ModeloCiaa };
