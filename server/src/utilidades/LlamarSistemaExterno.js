/*
 * ******************************************************************
 * Nombre del programa: API-EXTERNOS · LlamarSistemaExterno.js
 * Función: Hacer peticiones HTTP a los sistemas externos (CIAA, Empleados y Tesorería) con su
 *          clave y convertir sus fallas en errores claros para Biblio.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Sistema de ENTORNO.EXTERNOS, método, ruta y cuerpo
 * Salida: JSON de la respuesta o ErrorHttp 502/404
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                 Objetivo
 *     TIEMPO_ESPERA_MS       Tiempo máximo de espera de cada petición
 *     LlamarSistemaExterno   Hacer una petición a un sistema externo
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Lo usan los modelos ModeloCiaa, ModeloEmpleados y ModeloTesoreria; los controladores no
 *     llaman a los sistemas externos directamente.
 * (2) Las URLs y claves se leen de ENTORNO en cada llamada (las pruebas pueden cambiarlas).
 * ******************************************************************
 */

import { ErrorHttp } from './ErrorHttp.js';

/*
 * Constante: TIEMPO_ESPERA_MS
 * Objetivo: Tiempo máximo de espera de cada petición a un sistema externo.
 */
const TIEMPO_ESPERA_MS = 8000;

/*
 * Función: LlamarSistemaExterno
 * Objetivo: Hacer una petición a un sistema externo con su clave en X-Clave-Api.
 * Entrada: sistema ({ NOMBRE, URL, CLAVE }), metodo, ruta, cuerpo (opcional)
 * Salida: Promesa con el JSON de la respuesta; 404 del sistema → ErrorHttp 404; cualquier
 *         otra falla → ErrorHttp 502 con codigo SISTEMA_EXTERNO
 */
async function LlamarSistemaExterno(sistema, metodo, ruta, cuerpo)
{
  let respuesta;
  try
  {
    respuesta = await fetch(`${sistema.URL}${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'X-Clave-Api': sistema.CLAVE },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(TIEMPO_ESPERA_MS),
    });
  }
  catch
  {
    throw new ErrorHttp(502, `No se pudo conectar con ${sistema.NOMBRE}. Intenta más tarde.`, {
      codigo: 'SISTEMA_EXTERNO',
      sistema: sistema.NOMBRE,
    });
  }
  const texto = await respuesta.text();
  let datos = null;
  try
  {
    datos = texto ? JSON.parse(texto) : null;
  }
  catch
  {
    datos = null;
  }
  if (respuesta.status === 404)
  {
    throw ErrorHttp.NoEncontrado(datos?.error ?? `No encontrado en ${sistema.NOMBRE}`);
  }
  if (!respuesta.ok)
  {
    throw new ErrorHttp(
      502,
      `${sistema.NOMBRE} respondió con un error: ${datos?.error ?? respuesta.status}`,
      { codigo: 'SISTEMA_EXTERNO', sistema: sistema.NOMBRE },
    );
  }
  return datos;
}

export { LlamarSistemaExterno };
