import * as XLSX from 'xlsx';
import { api } from './apiClient';

/** Encabezados aceptados en la lista de Servicios Escolares (sin acentos ni mayúsculas). */
const COLUMNAS = {
  Nombre_Usuario: ['usuario', 'user', 'nombre de usuario'],
  Matricula_Nomina: ['matricula', 'matricula / no. de nomina', 'no. de nomina', 'nomina', 'matricula/nomina'],
  Nombre_Completo: ['nombre', 'nombre completo'],
  Correo: ['correo', 'correo institucional', 'email'],
};

const normalizar = (texto) => String(texto ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim()
  .toLowerCase();

export const UsuarioModel = {
  listar({ q, limit = 7, offset = 0 } = {}) {
    return api.get('/usuarios', { q, limit, offset });
  },

  obtener(id) {
    return api.get(`/usuarios/${id}`);
  },

  porMatricula(matricula) {
    return api.get(`/usuarios/matricula/${encodeURIComponent(matricula.trim())}`);
  },

  actualizar(id, datos) {
    return api.put(`/usuarios/${id}`, datos);
  },

  validarLista(filas) {
    return api.post('/usuarios/carga/validar', { filas });
  },

  crearDesdeLista(cuentas) {
    return api.post('/usuarios/carga', { cuentas });
  },

  revisarBajas(matriculas) {
    return api.post('/usuarios/bajas/revisar', { matriculas });
  },

  darDeBaja(ids) {
    return api.post('/usuarios/bajas', { ids });
  },

  /**
   * Lee la lista (.xlsx, .xls o .csv) en el navegador y devuelve filas
   * con los nombres de campo de la API. Fila = número de renglón en Excel.
   */
  async leerArchivoLista(archivo) {
    // Los CSV se leen como texto UTF-8: leídos como binario, SheetJS los
    // interpreta en Latin-1 y los acentos llegan dañados ("MÃ©ndez").
    const esCsv = /\.csv$/i.test(archivo.name) || archivo.type === 'text/csv';
    const libro = esCsv
      ? XLSX.read((await archivo.text()).replace(/^﻿/, ''), { type: 'string' })
      : XLSX.read(await archivo.arrayBuffer(), { type: 'array' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const renglones = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: false });
    if (renglones.length < 2) throw new Error('La lista no tiene registros.');

    const encabezados = renglones[0].map(normalizar);
    const indice = Object.fromEntries(
      Object.entries(COLUMNAS).map(([campo, alias]) => [campo, encabezados.findIndex((e) => alias.includes(e))]),
    );
    if (indice.Matricula_Nomina < 0) {
      throw new Error('No se encontró la columna «Matrícula / No. de nómina» en la lista.');
    }

    return renglones.slice(1)
      .map((r, i) => ({
        Fila: i + 2,
        Nombre_Usuario: indice.Nombre_Usuario >= 0 ? String(r[indice.Nombre_Usuario]).trim() : '',
        Matricula_Nomina: String(r[indice.Matricula_Nomina]).trim(),
        Nombre_Completo: indice.Nombre_Completo >= 0 ? String(r[indice.Nombre_Completo]).trim() : '',
        Correo: indice.Correo >= 0 ? String(r[indice.Correo]).trim() : '',
      }))
      .filter((f) => f.Matricula_Nomina || f.Nombre_Completo || f.Nombre_Usuario);
  },
};

/** Regla de contraseña del prototipo: 8+ caracteres, una mayúscula y un número. */
export function contrasenaValida(valor) {
  return valor.length >= 8 && /[A-ZÁÉÍÓÚÑ]/.test(valor) && /\d/.test(valor);
}
