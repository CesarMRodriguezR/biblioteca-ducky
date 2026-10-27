/**
 * Reglas y etiquetas del dominio que comparten las pantallas
 * (equivalente a web/src/models/dominio.js).
 */

export const ESTADOS_COPIA = {
  Disponible: { etiqueta: 'Disponible', tono: 'exito', descripcion: 'Se consulta dentro de la biblioteca' },
  'Consulta externa': { etiqueta: 'Consulta externa', tono: 'informacion', descripcion: 'Se puede llevar a casa' },
  'En prestamo': { etiqueta: 'En préstamo', tono: 'advertencia', descripcion: 'Regresa a la biblioteca al devolverse' },
  Apartado: { etiqueta: 'Apartado', tono: 'morado', descripcion: 'Reservado para la lista de espera' },
  Baja: { etiqueta: 'Baja', tono: 'error', descripcion: 'Retirado del acervo' },
};

/** Filtros de búsqueda del prototipo móvil (los mismos campos que la API). */
export const CAMPOS_BUSQUEDA = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'titulo', etiqueta: 'Título' },
  { valor: 'autor', etiqueta: 'Autor' },
  { valor: 'isbn', etiqueta: 'ISBN/Clave' },
  { valor: 'editorial', etiqueta: 'Editorial' },
  { valor: 'anio', etiqueta: 'Año' },
  { valor: 'tema', etiqueta: 'Tema' },
];

export function iniciales(nombre = '') {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export function primerNombre(nombre = '') {
  return nombre.split(/\s+/)[0] ?? '';
}

/** Los alumnos se identifican con matrícula; el personal con número de empleado. */
export function etiquetaIdentificador(usuario) {
  return usuario?.Nombre_Rol === 'Alumno' ? 'Matrícula' : 'Número de empleado';
}

export function ubicacionTexto({ Pasillo, Estante, Nivel }, seccion) {
  return [
    Pasillo && `Pasillo ${Pasillo}`,
    Estante && `Estante ${Estante}`,
    Nivel && `Nivel ${Nivel}`,
    seccion && `Sección ${seccion}`,
  ].filter(Boolean).join(' · ');
}

export function disponiblesTexto(libro) {
  const n = libro.Ejemplares_Disponibles ?? 0;
  if (!n) return 'Sin ejemplares';
  return `${n} ${n === 1 ? 'disponible' : 'disponibles'}`;
}

export function copiasTexto(n) {
  return `${n} ${n === 1 ? 'copia' : 'copias'}`;
}

/** Portadas generadas (la BD no guarda imágenes de portada). */
const PALETA = ['#10306b', '#0f1f45', '#c99a2e', '#1d7a4a', '#1a6fb0', '#9a5b00', '#3b2a7a', '#7a1f2b'];
const COLOR_TEMA = { Redes: '#1a6fb0', Matemáticas: '#9a5b00', Física: '#1d7a4a' };

export function temaPrincipal(libro) {
  return libro.Temas?.split(',')[0]?.trim() || libro.Tema?.split(',')[0]?.trim() || '';
}

export function colorPortada(libro) {
  return COLOR_TEMA[temaPrincipal(libro)] ?? PALETA[(libro.id_libro ?? 0) % PALETA.length];
}
