/*
 * ******************************************************************
 * Nombre del programa: CIAA · ControladorCiaa.js
 * Función: Atender la API del CIAA: listar, consultar y corregir alumnos.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Peticiones HTTP de /ciaa/api
 * Salida: Respuestas HTTP en formato JSON
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     ControladorCiaa   Manejadores de la API de alumnos
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se registra en rutas/RutasCiaa.js envuelto en ManejarAsincrono.
 * ******************************************************************
 */

import { ModeloAlumno } from '../modelos/ModeloAlumno.js';
import { ModeloAviso } from '../modelos/ModeloAviso.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

/*
 * Módulo: ControladorCiaa
 * Objetivo: Manejadores de la API de alumnos.
 */
const ControladorCiaa = {
  /*
   * Función: Listar
   * Objetivo: GET /alumnos?estatus=Inscrito — alumnos, opcionalmente por estatus.
   * Entrada: req, res
   * Salida: Respuesta JSON { total, datos }
   */
  async Listar(req, res)
  {
    const datos = await ModeloAlumno.Listar({ estatus: req.query.estatus });
    res.json({ total: datos.length, datos });
  },

  /*
   * Función: Obtener
   * Objetivo: GET /alumnos/:matricula — un alumno.
   * Entrada: req, res
   * Salida: Respuesta JSON con el alumno
   */
  async Obtener(req, res)
  {
    const alumno = await ModeloAlumno.BuscarPorMatricula(req.params.matricula);
    if (!alumno)
    {
      throw new ErrorHttp(404, `No existe el alumno con matrícula ${req.params.matricula}`);
    }
    res.json(alumno);
  },

  /*
   * Función: Actualizar
   * Objetivo: PUT /alumnos/:matricula — corregir los datos de un alumno.
   * Entrada: req, res
   * Salida: Respuesta JSON con el alumno corregido
   */
  async Actualizar(req, res)
  {
    res.json(await ModeloAlumno.Actualizar(req.params.matricula, req.body ?? {}));
  },

  /*
   * Función: RecibirAviso
   * Objetivo: POST /avisos — guardar un aviso de la biblioteca (lista de deudores o libro
   *           perdido).
   * Entrada: req, res
   * Salida: 201 con el aviso guardado
   */
  async RecibirAviso(req, res)
  {
    const { tipo, periodo, matricula, detalle } = req.body ?? {};
    if (!ModeloAviso.TIPOS_AVISO.includes(tipo))
    {
      throw new ErrorHttp(400, `El tipo de aviso debe ser: ${ModeloAviso.TIPOS_AVISO.join(' o ')}`);
    }
    if (!detalle || typeof detalle !== 'object')
    {
      throw new ErrorHttp(400, 'El aviso debe traer su detalle');
    }
    res.status(201).json(await ModeloAviso.Registrar({ tipo, periodo, matricula, detalle }));
  },

  /*
   * Función: ListarAvisos
   * Objetivo: GET /avisos?tipo= — avisos recibidos de la biblioteca.
   * Entrada: req, res
   * Salida: Respuesta JSON { total, datos }
   */
  async ListarAvisos(req, res)
  {
    const datos = await ModeloAviso.Listar({ tipo: req.query.tipo });
    res.json({ total: datos.length, datos });
  },
};

export { ControladorCiaa };
