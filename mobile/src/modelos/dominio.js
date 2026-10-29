/*
 * ******************************************************************
 * Nombre del programa: MOVIL-DOMINIO · dominio.js
 * Función: Reglas y textos del dominio que comparten las pantallas: estados de copia,
 *          ubicación, disponibilidad y portadas.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos de la API
 * Salida: Textos, etiquetas y colores para mostrar
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                  Objetivo
 *     Iniciales               Obtener las iniciales de un nombre para el avatar
 *     PrimerNombre            Obtener el primer nombre para el saludo
 *     EtiquetaIdentificador   Los alumnos se identifican con matrícula; el personal con…
 *     UbicacionTexto          Describir la ubicación de una copia (pasillo, estante,…
 *     DisponiblesTexto        Describir cuántas copias están disponibles
 *     CopiasTexto             Escribir el número de copias en singular o plural
 *     TemaPrincipal           Obtener el primer tema del libro
 *     ColorPortada            Elegir el color de la portada según el tema o el id del…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: acceso a la API y reglas del dominio. No contiene JSX.
 * (2) Las peticiones pasan por ClienteApi, que agrega el token guardado en SecureStore y
 *     convierte los errores en ErrorApi.
 * (3) La dirección de la API se toma de EXPO_PUBLIC_API_URL (archivo .env); en el teléfono debe
 *     ser la IP de la computadora.
 * ******************************************************************
 */

/**
 * Reglas y etiquetas del dominio que comparten las pantallas
 * (equivalente a web/src/models/dominio.js).
 */

export const ESTADOS_COPIA = {
  Disponible: {
    etiqueta: 'Disponible',
    tono: 'exito',
    descripcion: 'Se consulta dentro de la biblioteca',
  },
  'Consulta Externa': {
    etiqueta: 'Consulta externa',
    tono: 'informacion',
    descripcion: 'Se puede llevar a casa',
  },
  'En préstamo': {
    etiqueta: 'En préstamo',
    tono: 'advertencia',
    descripcion: 'Regresa a la biblioteca al devolverse',
  },
  Inactivo: { etiqueta: 'Baja', tono: 'error', descripcion: 'Retirado del acervo' },
};

/** Filtros de búsqueda del prototipo móvil (los mismos campos que la API); el filtro también
 *  ordena los resultados. */
export const CAMPOS_BUSQUEDA = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'titulo', etiqueta: 'Título' },
  { valor: 'autor', etiqueta: 'Autor' },
  { valor: 'isbn', etiqueta: 'ISBN/Clave' },
  { valor: 'editorial', etiqueta: 'Editorial' },
  { valor: 'anio', etiqueta: 'Año' },
  { valor: 'tema', etiqueta: 'Tema' },
];

/*
 * Función: Iniciales
 * Objetivo: Obtener las iniciales de un nombre para el avatar.
 * Entrada: nombre (opcional)
 * Salida: Texto de dos letras
 */
export function Iniciales(nombre = '')
{
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

/*
 * Función: PrimerNombre
 * Objetivo: Obtener el primer nombre para el saludo.
 * Entrada: nombre (opcional)
 * Salida: Texto con el primer nombre
 */
export function PrimerNombre(nombre = '')
{
  return nombre.split(/\s+/)[0] ?? '';
}

/*
 * Función: EtiquetaIdentificador
 * Objetivo: Los alumnos se identifican con matrícula; el personal con número de empleado.
 * Entrada: usuario
 * Salida: Texto «Matrícula» o «Número de nómina»
 */
export function EtiquetaIdentificador(usuario)
{
  return usuario?.Nombre_Rol === 'Alumno' ? 'Matrícula' : 'Número de empleado';
}

/*
 * Función: UbicacionTexto
 * Objetivo: Describir la ubicación de una copia (pasillo, estante, nivel y sección).
 *           La API entrega los componentes ya interpretados del código de ubicación.
 * Entrada: { Pasillo, Estante, Nivel, Seccion }, seccion (opcional, si no viene en el objeto)
 * Salida: Texto de la ubicación
 */
export function UbicacionTexto({ Pasillo, Estante, Nivel, Seccion }, seccion = Seccion)
{
  return [
    Pasillo && `Pasillo ${Pasillo}`,
    Estante && `Estante ${Estante}`,
    Nivel && `Nivel ${Nivel}`,
    seccion && `Sección ${seccion}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/*
 * Función: DisponiblesTexto
 * Objetivo: Describir cuántas copias están disponibles.
 * Entrada: libro
 * Salida: Texto como «3 de 5 disponibles»
 */
export function DisponiblesTexto(libro)
{
  const total = libro.Ejemplares_Disponibles ?? 0;
  if (!total)
  {
    return 'Sin ejemplares';
  }
  return `${total} ${total === 1 ? 'disponible' : 'disponibles'}`;
}

/*
 * Función: CopiasTexto
 * Objetivo: Escribir el número de copias en singular o plural.
 * Entrada: total
 * Salida: Texto como «1 copia» o «4 copias»
 */
export function CopiasTexto(total)
{
  return `${total} ${total === 1 ? 'copia' : 'copias'}`;
}

/** Portadas generadas (la BD no guarda imágenes de portada). */
const PALETA = [
  '#10306b',
  '#0f1f45',
  '#c99a2e',
  '#1d7a4a',
  '#1a6fb0',
  '#9a5b00',
  '#3b2a7a',
  '#7a1f2b',
];
const COLOR_TEMA = { Redes: '#1a6fb0', Matemáticas: '#9a5b00', Física: '#1d7a4a' };

/*
 * Función: TemaPrincipal
 * Objetivo: Obtener el primer tema del libro.
 * Entrada: libro
 * Salida: Nombre del tema
 */
export function TemaPrincipal(libro)
{
  return libro.Temas?.split(',')[0]?.trim() || libro.Tema?.split(',')[0]?.trim() || '';
}

/*
 * Función: ColorPortada
 * Objetivo: Elegir el color de la portada según el tema o el id del libro.
 * Entrada: libro
 * Salida: Color hexadecimal
 */
export function ColorPortada(libro)
{
  return COLOR_TEMA[TemaPrincipal(libro)] ?? PALETA[(libro.id_libro ?? 0) % PALETA.length];
}
