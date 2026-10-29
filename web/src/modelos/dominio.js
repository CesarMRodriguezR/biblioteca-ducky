/*
 * ******************************************************************
 * Nombre del programa: WEB-DOMINIO · dominio.js
 * Función: Reglas y etiquetas del dominio que comparten las vistas: estados, colores de
 *          insignias, formatos y textos de apoyo.
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
 *     Módulo                Objetivo
 *     ESTADOS_COPIA         Etiqueta, tono y descripción de cada estado de copia
 *     MOTIVOS_BAJA          Motivos para retirar una copia
 *     TONOS_PERFIL          Color de insignia de cada perfil
 *     ESTADOS_SOLICITUD     Etiqueta y tono de cada estatus de solicitud de compra
 *     ESTADOS_USUARIO       Etiqueta y tono de cada estatus de usuario
 *     CAMPOS_BUSQUEDA       Filtros del catálogo: campo de búsqueda y de orden
 *     DescribirFuncion      Funciones con su etiqueta visible ("Etiqueta:…
 *     Iniciales             Obtener las iniciales de un nombre para el avatar
 *     EtiquetaRol           "Ana Sofía" con rol femenino si aplica en la etiqueta del…
 *     UbicacionTexto        Describir la ubicación de una copia (pasillo, estante,…
 *     DisponibilidadTexto   Describir cuántas copias están disponibles
 *     FormatoMoneda         Mostrar una cantidad en pesos mexicanos
 *     FormatoFecha          Mostrar una fecha en formato local corto
 *     TiempoRelativo        "Hace 12 min", "Hace 1 h", "Ayer, 17:40" o la fecha
 *     PALETA_PORTADAS       Colores de las portadas generadas
 *     COLOR_TEMA            Color de portada de cada tema
 *     ColorPortada          Elegir el color de la portada según el tema o el id del…
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

/*
 * Constante: ESTADOS_COPIA
 * Objetivo: Etiqueta, tono y descripción de cada estado de copia (las llaves son los valores
 *           de Ejemplares.Estatus del diagrama; «Inactivo» es una copia dada de baja).
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
  Inactivo: { etiqueta: 'Inactivo', tono: 'neutro', descripcion: 'Dada de baja del acervo' },
};

/*
 * Constante: MOTIVOS_BAJA
 * Objetivo: Motivos para retirar una copia.
 */
export const MOTIVOS_BAJA = [
  { valor: 'Perdido', etiqueta: 'Perdido', descripcion: 'No se localiza el ejemplar' },
  { valor: 'Robado', etiqueta: 'Robado', descripcion: 'Sustracción confirmada' },
  { valor: 'Danado', etiqueta: 'Dañado', descripcion: 'Deterioro irreparable' },
  { valor: 'Obsoleto', etiqueta: 'Obsoleto', descripcion: 'Edición retirada del acervo' },
];

/*
 * Constante: TONOS_PERFIL
 * Objetivo: Color de insignia de cada perfil.
 */
export const TONOS_PERFIL = {
  Administrador: 'advertencia',
  Bibliotecario: 'exito',
  Profesor: 'morado',
  Alumno: 'neutro',
  Colaborador: 'informacion',
};

/*
 * Constante: ESTADOS_SOLICITUD
 * Objetivo: Etiqueta y tono de cada estatus de solicitud de compra.
 */
export const ESTADOS_SOLICITUD = {
  Pendiente: { etiqueta: 'Pendiente', tono: 'advertencia' },
  'En revision': { etiqueta: 'En revisión', tono: 'informacion' },
  Aprobada: { etiqueta: 'Aprobada', tono: 'exito' },
  Rechazada: { etiqueta: 'Rechazada', tono: 'error' },
  Recibida: { etiqueta: 'Recibida', tono: 'neutro' },
};

/*
 * Constante: ESTADOS_USUARIO
 * Objetivo: Etiqueta y tono de cada estatus de usuario.
 */
export const ESTADOS_USUARIO = {
  Activo: { etiqueta: 'Válido', tono: 'exito' },
  Inactivo: { etiqueta: 'Inactivo', tono: 'neutro' },
};

/*
 * Constante: CAMPOS_BUSQUEDA
 * Objetivo: Filtros del catálogo. El filtro elegido es el campo donde se busca y también el
 *           orden de los resultados («Todos» ordena por título).
 */
export const CAMPOS_BUSQUEDA = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'titulo', etiqueta: 'Título' },
  { valor: 'autor', etiqueta: 'Autor' },
  { valor: 'editorial', etiqueta: 'Editorial' },
  { valor: 'isbn', etiqueta: 'ISBN' },
  { valor: 'anio', etiqueta: 'Año' },
  { valor: 'tema', etiqueta: 'Tema' },
];

/*
 * Función: DescribirFuncion
 * Objetivo: Funciones con su etiqueta visible ("Etiqueta: descripción" en la BD).
 * Entrada: funcion
 * Salida: { etiqueta, descripcion }
 */
export function DescribirFuncion(funcion)
{
  const [etiqueta, ...resto] = String(funcion.Descripcion_Funcion || funcion.Nombre_Funcion).split(
    ':',
  );
  return { etiqueta: etiqueta.trim(), descripcion: resto.join(':').trim() };
}

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
 * Función: EtiquetaRol
 * Objetivo: "Ana Sofía" con rol femenino si aplica en la etiqueta del pie del menú.
 * Entrada: usuario
 * Salida: Texto del rol
 */
export function EtiquetaRol(usuario)
{
  return usuario?.Nombre_Rol ?? '';
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
  const partes = [];
  if (Pasillo)
  {
    partes.push(`Pasillo ${Pasillo}`);
  }
  if (Estante)
  {
    partes.push(`Estante ${Estante}`);
  }
  if (Nivel)
  {
    partes.push(`Nivel ${Nivel}`);
  }
  if (seccion)
  {
    partes.push(`Sección ${seccion}`);
  }
  return partes.join(' · ');
}

/*
 * Función: DisponibilidadTexto
 * Objetivo: Describir cuántas copias están disponibles.
 * Entrada: libro
 * Salida: Texto como «3 de 5 disponibles»
 */
export function DisponibilidadTexto(libro)
{
  const total = libro.Ejemplares_Totales ?? 0;
  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  return `${disponibles} de ${total} disponibles`;
}

/*
 * Función: FormatoMoneda
 * Objetivo: Mostrar una cantidad en pesos mexicanos.
 * Entrada: valor
 * Salida: Texto con formato de moneda
 */
export function FormatoMoneda(valor)
{
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(valor || 0),
  );
}

/*
 * Función: FormatoFecha
 * Objetivo: Mostrar una fecha en formato local corto.
 * Entrada: iso
 * Salida: Texto como «23 oct 2026»
 */
export function FormatoFecha(iso)
{
  if (!iso)
  {
    return '';
  }
  const fecha = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso.replace(' ', 'T'));
  return fecha
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/*
 * Función: TiempoRelativo
 * Objetivo: "Hace 12 min", "Hace 1 h", "Ayer, 17:40" o la fecha.
 * Entrada: iso, ahora (opcional)
 * Salida: Texto del tiempo transcurrido
 */
export function TiempoRelativo(iso, ahora = new Date())
{
  const fecha = new Date(String(iso).replace(' ', 'T'));
  const minutos = Math.round((ahora - fecha) / 60000);
  if (minutos < 1)
  {
    return 'Hace un momento';
  }
  if (minutos < 60)
  {
    return `Hace ${minutos} min`;
  }
  const horas = Math.round(minutos / 60);
  const mismo_dia = fecha.toDateString() === ahora.toDateString();
  if (mismo_dia)
  {
    return `Hace ${horas} h`;
  }
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  const hora = fecha.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  if (fecha.toDateString() === ayer.toDateString())
  {
    return `Ayer, ${hora}`;
  }
  return FormatoFecha(iso);
}

/*
 * Constante: PALETA_PORTADAS
 * Objetivo: Colores de las portadas generadas.
 */
const PALETA_PORTADAS = [
  '#10306b',
  '#0f1f45',
  '#c99a2e',
  '#1d7a4a',
  '#1a6fb0',
  '#9a5b00',
  '#3b2a7a',
  '#7a1f2b',
];
/*
 * Constante: COLOR_TEMA
 * Objetivo: Color de portada de cada tema.
 */
const COLOR_TEMA = {
  Computación: null,
  Redes: '#1a6fb0',
  Matemáticas: '#9a5b00',
  Física: '#1d7a4a',
};

/*
 * Función: ColorPortada
 * Objetivo: Elegir el color de la portada según el tema o el id del libro.
 * Entrada: libro
 * Salida: Color hexadecimal
 */
export function ColorPortada(libro)
{
  const por_tema = COLOR_TEMA[libro.Temas?.split(',')[0]?.trim()];
  if (por_tema)
  {
    return por_tema;
  }
  return PALETA_PORTADAS[(libro.id_libro ?? 0) % PALETA_PORTADAS.length];
}
