/**
 * Reglas y etiquetas del dominio que comparten las vistas: estados,
 * colores de insignias, formatos de fecha y textos de apoyo.
 */

export const ESTADOS_COPIA = {
  Disponible: { etiqueta: 'Disponible', tono: 'exito', descripcion: 'Se consulta dentro de la biblioteca' },
  'Consulta externa': { etiqueta: 'Consulta externa', tono: 'informacion', descripcion: 'Se puede llevar a casa' },
  'En prestamo': { etiqueta: 'En préstamo', tono: 'advertencia', descripcion: 'Regresa a la biblioteca al devolverse' },
  Apartado: { etiqueta: 'Apartado', tono: 'morado', descripcion: 'Reservado para la lista de espera' },
  Baja: { etiqueta: 'Baja', tono: 'error', descripcion: 'Retirado del acervo' },
};

export const MOTIVOS_BAJA = [
  { valor: 'Perdido', etiqueta: 'Perdido', descripcion: 'No se localiza el ejemplar' },
  { valor: 'Robado', etiqueta: 'Robado', descripcion: 'Sustracción confirmada' },
  { valor: 'Danado', etiqueta: 'Dañado', descripcion: 'Deterioro irreparable' },
  { valor: 'Obsoleto', etiqueta: 'Obsoleto', descripcion: 'Edición retirada del acervo' },
];

export const TONOS_PERFIL = {
  Administrador: 'advertencia',
  Bibliotecario: 'exito',
  Profesor: 'morado',
  Alumno: 'neutro',
  Colaborador: 'informacion',
};

export const ESTADOS_SOLICITUD = {
  Pendiente: { etiqueta: 'Pendiente', tono: 'advertencia' },
  'En revision': { etiqueta: 'En revisión', tono: 'informacion' },
  Aprobada: { etiqueta: 'Aprobada', tono: 'exito' },
  Rechazada: { etiqueta: 'Rechazada', tono: 'error' },
  Recibida: { etiqueta: 'Recibida', tono: 'neutro' },
};

export const ESTADOS_USUARIO = {
  Activo: { etiqueta: 'Válido', tono: 'exito' },
  Inactivo: { etiqueta: 'Inactivo', tono: 'neutro' },
  Bloqueado: { etiqueta: 'Bloqueado', tono: 'error' },
};

export const CAMPOS_BUSQUEDA = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'titulo', etiqueta: 'Título' },
  { valor: 'autor', etiqueta: 'Autor' },
  { valor: 'editorial', etiqueta: 'Editorial' },
  { valor: 'isbn', etiqueta: 'ISBN' },
  { valor: 'anio', etiqueta: 'Año' },
  { valor: 'tema', etiqueta: 'Tema' },
];

export const ORDENES_CATALOGO = [
  { valor: 'titulo', etiqueta: 'Título (A–Z)' },
  { valor: 'autor', etiqueta: 'Autor (A–Z)' },
  { valor: 'anio_desc', etiqueta: 'Más recientes' },
  { valor: 'anio_asc', etiqueta: 'Más antiguos' },
  { valor: 'disponibles', etiqueta: 'Más disponibles' },
];

/** Funciones con su etiqueta visible ("Etiqueta: descripción" en la BD). */
export function describirFuncion(funcion) {
  const [etiqueta, ...resto] = String(funcion.Descripcion_Funcion || funcion.Nombre_Funcion).split(':');
  return { etiqueta: etiqueta.trim(), descripcion: resto.join(':').trim() };
}

export function iniciales(nombre = '') {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** "Ana Sofía" con rol femenino si aplica en la etiqueta del pie del menú. */
export function etiquetaRol(usuario) {
  return usuario?.Nombre_Rol ?? '';
}

export function ubicacionTexto({ Pasillo, Estante, Nivel }, seccion) {
  const partes = [];
  if (Pasillo) partes.push(`Pasillo ${Pasillo}`);
  if (Estante) partes.push(`Estante ${Estante}`);
  if (Nivel) partes.push(`Nivel ${Nivel}`);
  if (seccion) partes.push(`Sección ${seccion}`);
  return partes.join(' · ');
}

export function disponibilidadTexto(libro) {
  const total = libro.Ejemplares_Totales ?? 0;
  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  return `${disponibles} de ${total} disponibles`;
}

export function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor || 0));
}

export function formatoFecha(iso) {
  if (!iso) return '';
  const fecha = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso.replace(' ', 'T'));
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

/** "Hace 12 min", "Hace 1 h", "Ayer, 17:40" o la fecha. */
export function tiempoRelativo(iso, ahora = new Date()) {
  const fecha = new Date(String(iso).replace(' ', 'T'));
  const minutos = Math.round((ahora - fecha) / 60000);
  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  const mismoDia = fecha.toDateString() === ahora.toDateString();
  if (mismoDia) return `Hace ${horas} h`;
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
  return formatoFecha(iso);
}

/** Paleta de portadas generadas (no hay imágenes de portada en la BD). */
const PALETA_PORTADAS = ['#10306b', '#0f1f45', '#c99a2e', '#1d7a4a', '#1a6fb0', '#9a5b00', '#3b2a7a', '#7a1f2b'];
const COLOR_TEMA = { Computación: null, Redes: '#1a6fb0', Matemáticas: '#9a5b00', Física: '#1d7a4a' };

export function colorPortada(libro) {
  const porTema = COLOR_TEMA[libro.Temas?.split(',')[0]?.trim()];
  if (porTema) return porTema;
  return PALETA_PORTADAS[(libro.id_libro ?? 0) % PALETA_PORTADAS.length];
}
