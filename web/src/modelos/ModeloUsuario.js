/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ModeloUsuario.js
 * Función: Usuarios: consulta, cambio, carga y baja por lista, y lectura del archivo de
 *          Servicios Escolares.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos de las pantallas
 * Salida: Respuestas de la API o datos con formato para mostrar
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo             Objetivo
 *     COLUMNAS           Encabezados aceptados en la lista de Servicios Escolares…
 *     Normalizar         Quitar acentos, mayúsculas y espacios extra de un encabezado
 *     ModeloUsuario      Acceso a los usuarios
 *     ContrasenaValida   Regla de contraseña del prototipo: 8+ caracteres, una…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: acceso a la API y reglas del dominio. No contiene JSX.
 * (2) Las peticiones pasan por ClienteApi, que agrega el token de sesión y convierte los
 *     errores en ErrorApi.
 * (3) La API debe ejecutarse en el puerto 3000; Vite redirige /api en desarrollo.
 * ******************************************************************
 */

import * as XLSX from 'xlsx';
import { ClienteApi } from './ClienteApi.js';

/*
 * Constante: COLUMNAS
 * Objetivo: Encabezados aceptados en la lista de Servicios Escolares (sin acentos ni
 *           mayúsculas).
 */
const COLUMNAS = {
  Nombre_Usuario: ['usuario', 'user', 'nombre de usuario'],
  Matricula_Nomina: [
    'matricula',
    'matricula / no. de nomina',
    'no. de nomina',
    'nomina',
    'matricula/nomina',
  ],
  Nombre_Completo: ['nombre', 'nombre completo'],
  Correo: ['correo', 'correo institucional', 'email'],
};

/*
 * Función: Normalizar
 * Objetivo: Quitar acentos, mayúsculas y espacios extra de un encabezado.
 * Entrada: texto
 * Salida: Texto normalizado
 */
const Normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

/*
 * Módulo: ModeloUsuario
 * Objetivo: Acceso a los usuarios.
 */
export const ModeloUsuario = {
  /*
   * Función: Listar
   * Objetivo: Pedir los usuarios válidos con búsqueda y paginación.
   * Entrada: { q, limit?, offset? } (opcional)
   * Salida: Promesa con la respuesta de la API
   */
  Listar({ q: texto_busqueda, limit = 7, offset = 0 } = {})
  {
    return ClienteApi.Obtener('/usuarios', { q: texto_busqueda, limit, offset });
  },

  /*
   * Función: Obtener
   * Objetivo: Pedir un usuario por su id.
   * Entrada: id
   * Salida: Promesa con la respuesta de la API
   */
  Obtener(id)
  {
    return ClienteApi.Obtener(`/usuarios/${id}`);
  },

  /*
   * Función: PorMatricula
   * Objetivo: Pedir un usuario por su matrícula o número de nómina.
   * Entrada: matricula
   * Salida: Promesa con la respuesta de la API
   */
  PorMatricula(matricula)
  {
    return ClienteApi.Obtener(`/usuarios/matricula/${encodeURIComponent(matricula.trim())}`);
  },

  /*
   * Función: Actualizar
   * Objetivo: Guardar los cambios de un usuario.
   * Entrada: id, datos
   * Salida: Promesa con la respuesta de la API
   */
  Actualizar(id, datos)
  {
    return ClienteApi.Reemplazar(`/usuarios/${id}`, datos);
  },

  /*
   * Función: ValidarLista
   * Objetivo: Enviar las filas de la lista para su revisión.
   * Entrada: filas
   * Salida: Promesa con la respuesta de la API
   */
  ValidarLista(filas)
  {
    return ClienteApi.Enviar('/usuarios/carga/validar', { filas });
  },

  /*
   * Función: CrearDesdeLista
   * Objetivo: Crear las cuentas de las filas válidas con su perfil.
   * Entrada: cuentas
   * Salida: Promesa con la respuesta de la API
   */
  CrearDesdeLista(cuentas)
  {
    return ClienteApi.Enviar('/usuarios/carga', { cuentas });
  },

  /*
   * Función: RevisarBajas
   * Objetivo: Pedir los usuarios que ya no aparecen en la lista.
   * Entrada: matriculas
   * Salida: Promesa con la respuesta de la API
   */
  RevisarBajas(matriculas)
  {
    return ClienteApi.Enviar('/usuarios/bajas/revisar', { matriculas });
  },

  /*
   * Función: DarDeBaja
   * Objetivo: Dar de baja a los usuarios elegidos.
   * Entrada: ids
   * Salida: Promesa con la respuesta de la API
   */
  DarDeBaja(ids)
  {
    return ClienteApi.Enviar('/usuarios/bajas', { ids });
  },

  /*
   * Función: LeerArchivoLista
   * Objetivo: Lee la lista (.xlsx, .xls o .csv) en el navegador y devuelve filas con los
   *           nombres de campo de la API. Fila = número de renglón en Excel.
   * Entrada: archivo
   * Salida: Promesa con las filas de la lista
   */
  async LeerArchivoLista(archivo)
  {
    // Los CSV se leen como texto UTF-8: leídos como binario, SheetJS los
    // interpreta en Latin-1 y los acentos llegan dañados ("MÃ©ndez").
    const es_csv = /\.csv$/i.test(archivo.name) || archivo.type === 'text/csv';
    const libro = es_csv
      ? XLSX.read((await archivo.text()).replace(/^﻿/, ''), { type: 'string' })
      : XLSX.read(await archivo.arrayBuffer(), { type: 'array' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const renglones = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: false });
    if (renglones.length < 2)
    {
      throw new Error('La lista no tiene registros.');
    }

    const encabezados = renglones[0].map(Normalizar);
    const indice = Object.fromEntries(
      Object.entries(COLUMNAS).map(([campo, alias]) => [
        campo,
        encabezados.findIndex((encabezado) => alias.includes(encabezado)),
      ]),
    );
    if (indice.Matricula_Nomina < 0)
    {
      throw new Error('No se encontró la columna «Matrícula / No. de nómina» en la lista.');
    }

    return renglones
      .slice(1)
      .map((renglon, posicion) => ({
        Fila: posicion + 2,
        Nombre_Usuario:
          indice.Nombre_Usuario >= 0 ? String(renglon[indice.Nombre_Usuario]).trim() : '',
        Matricula_Nomina: String(renglon[indice.Matricula_Nomina]).trim(),
        Nombre_Completo:
          indice.Nombre_Completo >= 0 ? String(renglon[indice.Nombre_Completo]).trim() : '',
        Correo: indice.Correo >= 0 ? String(renglon[indice.Correo]).trim() : '',
      }))
      .filter(
        (renglon) => renglon.Matricula_Nomina || renglon.Nombre_Completo || renglon.Nombre_Usuario,
      );
  },
};

/*
 * Función: ContrasenaValida
 * Objetivo: Regla de contraseña del prototipo: 8+ caracteres, una mayúscula y un número.
 * Entrada: valor
 * Salida: true si cumple la regla
 */
export function ContrasenaValida(valor)
{
  return valor.length >= 8 && /[A-ZÁÉÍÓÚÑ]/.test(valor) && /\d/.test(valor);
}
