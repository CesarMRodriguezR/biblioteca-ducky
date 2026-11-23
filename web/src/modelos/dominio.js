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
 *     ESTADOS_PRESTAMO      Tono de cada estado visible de un préstamo
 *     RESULTADOS_DEVOLUCION Tono del resultado de una devolución
 *     ESTADOS_MULTA         Tono del estado de pago de una multa
 *     MOTIVOS_MULTA         Motivos de multa del prototipo
 *     CONDICIONES_LIBRO     Condición del libro al recibirlo
 *     PERIODOS_EXAMEN       Periodos de exámenes de la lista de deudores
 *     FILTROS_PERFIL        Filtros por perfil de los préstamos vencidos
 *     FILTROS_HISTORIAL     Filtros del historial de préstamos de un usuario
 *     PERIODOS_PAGO         Filtros por periodo de los pagos de Tesorería
 *     MEDIOS_ENTREGA        Medios de entrega del recibo de préstamo
 *     HoyIso                Fecha local de hoy en formato AAAA-MM-DD
 *     EnPeriodo             Saber si una fecha cae en un periodo de PERIODOS_PAGO
 *     FechaCorta            Mostrar una fecha como DD/MM/AAAA
 *     FechaLarga            Mostrar una fecha con su día de la semana
 *     FolioMulta            Folio visible de una multa (M-0058)
 *     TelefonoTexto         Mostrar un teléfono de 10 dígitos con espacios
 *     IndicacionAdeudos     Qué debe hacer un lector para volver a pedir préstamos
 *     TextoRecibo           Texto del recibo para enviarlo por correo o WhatsApp
 *     EnlaceWhatsApp        Enlace de WhatsApp con el recibo escrito
 *     EnlaceCorreo          Enlace de correo con el recibo escrito
 *     GUIAS_MODULO          Nombre comprensible de la guía de cada módulo
 *     FuenteLegible         Fuente del Asistente Biblio en palabras comprensibles
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

/*
 * Constante: ESTADOS_PRESTAMO
 * Objetivo: Tono de cada estado visible de un préstamo (Vencido y Renovado se calculan).
 */
export const ESTADOS_PRESTAMO = {
  Activo: 'informacion',
  Renovado: 'exito',
  Vencido: 'error',
  Devuelto: 'exito',
  'Devuelto con retraso': 'advertencia',
  Perdido: 'error',
};

/*
 * Constante: RESULTADOS_DEVOLUCION
 * Objetivo: Tono del resultado de una devolución en el menú Devoluciones.
 */
export const RESULTADOS_DEVOLUCION = {
  'A tiempo': 'exito',
  'Con multa': 'error',
  Perdido: 'morado',
};

/*
 * Constante: ESTADOS_MULTA
 * Objetivo: Tono del estado de pago de una multa.
 */
export const ESTADOS_MULTA = {
  Pendiente: 'advertencia',
  Pagada: 'exito',
};

/*
 * Constante: MOTIVOS_MULTA
 * Objetivo: Motivos de multa del prototipo.
 */
export const MOTIVOS_MULTA = [
  { valor: 'Entrega extemporánea', etiqueta: 'Entrega extemporánea' },
  { valor: 'Daño del libro', etiqueta: 'Daño del libro' },
  { valor: 'Pérdida del libro', etiqueta: 'Pérdida del libro' },
];

/*
 * Constante: CONDICIONES_LIBRO
 * Objetivo: Condición del libro al recibirlo en una devolución.
 */
export const CONDICIONES_LIBRO = [
  { valor: 'Buen estado', etiqueta: 'Buen estado' },
  { valor: 'Dañado', etiqueta: 'Dañado' },
  { valor: 'Incompleto', etiqueta: 'Incompleto' },
];

/*
 * Constante: PERIODOS_EXAMEN
 * Objetivo: Periodos de exámenes del semestre para la lista de alumnos deudores.
 */
export const PERIODOS_EXAMEN = [
  { valor: 'Parciales · 09/11/2026 al 13/11/2026', etiqueta: 'Parciales · 09/11/2026 al 13/11/2026' },
  { valor: 'Finales · 07/12/2026 al 11/12/2026', etiqueta: 'Finales · 07/12/2026 al 11/12/2026' },
];

/*
 * Constante: FILTROS_PERFIL
 * Objetivo: Filtros por perfil de los préstamos vencidos (valor = Nombre_Rol).
 */
export const FILTROS_PERFIL = [
  { valor: '', etiqueta: 'Todos', plural: 'todos' },
  { valor: 'Alumno', etiqueta: 'Alumnos', plural: 'alumnos' },
  { valor: 'Profesor', etiqueta: 'Profesores', plural: 'profesores' },
  { valor: 'Colaborador', etiqueta: 'Colaboradores', plural: 'colaboradores' },
  { valor: 'Bibliotecario', etiqueta: 'Bibliotecarios', plural: 'bibliotecarios' },
  { valor: 'Administrador', etiqueta: 'Administradores', plural: 'administradores' },
];

/*
 * Constante: FILTROS_HISTORIAL
 * Objetivo: Filtros del historial de préstamos de un usuario (valor = Estado_Visible).
 */
export const FILTROS_HISTORIAL = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'Devuelto', etiqueta: 'Devuelto' },
  { valor: 'Devuelto con retraso', etiqueta: 'Devuelto con retraso' },
];

/*
 * Constante: PERIODOS_PAGO
 * Objetivo: Filtros por periodo de los pagos de Tesorería (los aplica EnPeriodo).
 */
export const PERIODOS_PAGO = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: 'Últimos 7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'todos', etiqueta: 'Todos' },
];

/*
 * Constante: MEDIOS_ENTREGA
 * Objetivo: Medios de entrega del recibo de préstamo; Imprimir es el predeterminado.
 */
export const MEDIOS_ENTREGA = {
  Imprimir: 'Impreso',
  Correo: 'Correo electrónico',
  WhatsApp: 'WhatsApp',
};

/*
 * Constante: DIAS_SEMANA
 * Objetivo: Nombres de los días de la semana (0 = domingo, como Date.getDay).
 */
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/*
 * Función: HoyIso
 * Objetivo: Fecha local de hoy en formato AAAA-MM-DD (toISOString usaría la hora UTC).
 * Entrada: Ninguna
 * Salida: Texto AAAA-MM-DD
 */
export function HoyIso()
{
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/*
 * Función: EnPeriodo
 * Objetivo: Saber si una fecha (AAAA-MM-DD, con o sin hora) cae en un periodo de
 *           PERIODOS_PAGO, contado desde hoy.
 * Entrada: fecha, periodo (valor de PERIODOS_PAGO)
 * Salida: true si la fecha está en el periodo
 */
export function EnPeriodo(fecha, periodo)
{
  const dia = String(fecha ?? '').slice(0, 10);
  const hoy = HoyIso();
  if (periodo === 'hoy')
  {
    return dia === hoy;
  }
  if (periodo === 'semana')
  {
    const inicio = new Date(`${hoy}T00:00:00`);
    inicio.setDate(inicio.getDate() - 6);
    const mes = String(inicio.getMonth() + 1).padStart(2, '0');
    const desde = `${inicio.getFullYear()}-${mes}-${String(inicio.getDate()).padStart(2, '0')}`;
    return dia >= desde && dia <= hoy;
  }
  if (periodo === 'mes')
  {
    return dia.slice(0, 7) === hoy.slice(0, 7);
  }
  return true;
}

/*
 * Función: FechaCorta
 * Objetivo: Mostrar una fecha AAAA-MM-DD como DD/MM/AAAA.
 * Entrada: iso
 * Salida: Texto DD/MM/AAAA (— si no hay fecha)
 */
export function FechaCorta(iso)
{
  if (!iso)
  {
    return '—';
  }
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

/*
 * Función: FechaLarga
 * Objetivo: Mostrar una fecha AAAA-MM-DD con su día de la semana.
 * Entrada: iso
 * Salida: Texto como «Lunes 09/11/2026»
 */
export function FechaLarga(iso)
{
  if (!iso)
  {
    return '—';
  }
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return `${DIAS_SEMANA[new Date(anio, mes - 1, dia).getDay()]} ${FechaCorta(iso)}`;
}

/*
 * Función: FolioMulta
 * Objetivo: Folio visible de una multa a partir de su id.
 * Entrada: id_multa
 * Salida: Texto como M-0058
 */
export function FolioMulta(id_multa)
{
  return `M-${String(id_multa).padStart(4, '0')}`;
}

/*
 * Función: TelefonoTexto
 * Objetivo: Mostrar un teléfono de 10 dígitos agrupado (81 1234 5601).
 * Entrada: telefono
 * Salida: Texto del teléfono (— si no hay)
 */
export function TelefonoTexto(telefono)
{
  if (!telefono)
  {
    return '—';
  }
  return telefono.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1 $2 $3');
}

/*
 * Función: IndicacionAdeudos
 * Objetivo: Qué debe hacer un lector para volver a pedir préstamos según lo que no cumple.
 * Entrada: resumen ({ Multas_Pendientes, Prestamos_Vencidos, Prestamos_Activos,
 *          Maximo_Prestamos })
 * Salida: Texto con las acciones pendientes
 */
export function IndicacionAdeudos(resumen)
{
  const pasos = [];
  if (resumen.Prestamos_Vencidos)
  {
    pasos.push('devolver los libros vencidos');
  }
  if (resumen.Multas_Pendientes)
  {
    pasos.push('pagar sus multas en Tesorería');
  }
  if (!pasos.length && resumen.Prestamos_Activos >= resumen.Maximo_Prestamos)
  {
    pasos.push('devolver alguno de sus libros');
  }
  return pasos.length ? `Debe ${pasos.join(' y ')} antes de pedir otro.` : '';
}

/*
 * Función: TextoRecibo
 * Objetivo: Texto del recibo de préstamo para enviarlo por correo o WhatsApp.
 * Entrada: recibo, medio (texto de MEDIOS_ENTREGA)
 * Salida: Texto con los datos del préstamo
 */
export function TextoRecibo(recibo, medio)
{
  return [
    `Biblio · Universidad Ducky — Recibo de préstamo ${recibo.Folio}`,
    `Lector: ${recibo.Nombre_Completo} (${recibo.Matricula_Nomina})`,
    `Libro: ${recibo.Titulo} · Copia ${recibo.num_copia} · ISBN ${recibo.ISBN}`,
    `Ubicación: ${UbicacionTexto(recibo.ubicacion ?? {}, null) || '—'}`,
    `Fecha de préstamo: ${FechaLarga(recibo.Fecha_Prestamo)}`,
    `Fecha de devolución: ${FechaLarga(recibo.Fecha_Entrega_Programada)}`,
    `Entrega del recibo: ${medio}`,
    `Atendió: ${recibo.Atendio}`,
    recibo.Nota,
  ].join('\n');
}

/*
 * Función: EnlaceWhatsApp
 * Objetivo: Enlace de WhatsApp (wa.me) al teléfono del lector con el texto escrito. Los
 *           teléfonos se guardan sin lada; se agrega la de México (52).
 * Entrada: telefono, texto
 * Salida: URL de WhatsApp
 */
export function EnlaceWhatsApp(telefono, texto)
{
  return `https://wa.me/52${telefono}?text=${encodeURIComponent(texto)}`;
}

/*
 * Función: EnlaceCorreo
 * Objetivo: Enlace mailto al correo del lector con asunto y cuerpo.
 * Entrada: correo, asunto, cuerpo
 * Salida: URL mailto
 */
export function EnlaceCorreo(correo, asunto, cuerpo)
{
  return `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

/*
 * Constante: GUIAS_MODULO
 * Objetivo: Nombre comprensible de la guía de cada módulo de las historias de usuario
 *           (BD-SP03-PL01 → PL).
 */
export const GUIAS_MODULO = {
  GU: 'Guía de usuarios y perfiles',
  GL: 'Guía del catálogo de libros',
  BL: 'Guía de búsqueda de libros',
  PL: 'Guía de préstamos',
  DL: 'Guía de devoluciones y multas',
  CB: 'Guía del Asistente Biblio',
};

/*
 * Función: FuenteLegible
 * Objetivo: Expresar la fuente de una respuesta del Asistente Biblio (FuentesChatbot.Fuente,
 *           que nombra el artefacto del proyecto) en palabras que cualquier usuario entienda.
 *           «Historia de usuario BD-SP03-PL01 · Registro de préstamo» → «Guía de préstamos ·
 *           Registro de préstamo»; «Propuesta de Negocio · Alcance» → «Información general de
 *           Biblio · Alcance». Otra fuente se muestra tal cual.
 * Entrada: fuente
 * Salida: Texto de la fuente para mostrar
 */
export function FuenteLegible(fuente)
{
  const [documento, ...resto] = fuente.split(' · ');
  const tema = resto.join(' · ');
  if (documento === 'Propuesta de Negocio')
  {
    return `Información general de Biblio · ${tema}`;
  }
  const modulo = documento.match(/^Historia de usuario BD-SP\d+-([A-Z]+)\d+$/)?.[1];
  return GUIAS_MODULO[modulo] && tema ? `${GUIAS_MODULO[modulo]} · ${tema}` : fuente;
}
