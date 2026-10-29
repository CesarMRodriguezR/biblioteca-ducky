/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL06 · GenerarListadoPdf.js
 * Función: Generar el listado de libros en PDF (tamaño carta, horizontal) con paginación.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Filas de vw_catalogo y datos del encabezado
 * Salida: Documento PDF en flujo
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     COLORES             Colores del listado
 *     COLUMNAS            Columnas del listado con su título, ancho y valor
 *     FormatearFecha      Mostrar la fecha y hora de generación en formato local
 *     GenerarListadoPdf   Dibujar el listado de libros con encabezado, tabla y…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Funciones de apoyo sin acceso a la base de datos; se pueden usar en cualquier capa.
 * ******************************************************************
 */

import PDFDocument from 'pdfkit';

/*
 * Constante: COLORES
 * Objetivo: Colores del listado.
 */
const COLORES = {
  texto: '#1C2533',
  suave: '#6B7686',
  linea: '#DCE3EC',
  azul: '#10306B',
};

/*
 * Constante: COLUMNAS
 * Objetivo: Columnas del listado con su título, ancho y valor.
 */
const COLUMNAS = [
  { titulo: '#', ancho: 22, valor: (_l, indice) => String(indice + 1) },
  { titulo: 'Título', ancho: 120, valor: (libro) => libro.Titulo, negrita: true },
  { titulo: 'Autor', ancho: 88, valor: (libro) => libro.Autores_Apellidos || '' },
  { titulo: 'Editorial', ancho: 70, valor: (libro) => libro.Nombre_Editorial || '' },
  { titulo: 'ISBN', ancho: 92, valor: (libro) => libro.ISBN },
  { titulo: 'Año', ancho: 34, valor: (libro) => (libro.Anio ? String(libro.Anio) : '') },
  { titulo: 'Tema', ancho: 74, valor: (libro) => libro.Temas || '' },
  { titulo: 'Sinopsis', ancho: 168, valor: (libro) => libro.Sinopsis || '' },
  { titulo: 'Copias', ancho: 40, valor: (libro) => String(libro.Ejemplares_Totales ?? 0) },
];

/*
 * Función: FormatearFecha
 * Objetivo: Mostrar la fecha y hora de generación en formato local.
 * Entrada: fecha
 * Salida: Texto como «23 oct 2026, 14:05»
 */
function FormatearFecha(fecha)
{
  return fecha
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/*
 * Función: GenerarListadoPdf
 * Objetivo: Dibujar el listado de libros con encabezado, tabla y número de página.
 * Entrada: libros, { generado_por, filtro, fecha? }
 * Salida: PDFDocument listo para enviar con pipe()
 */
function GenerarListadoPdf(libros, { generado_por, filtro, fecha = new Date() })
{
  const documento = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margin: 40,
    bufferPages: true,
    info: { Title: 'Listado de libros', Author: 'Biblioteca Universidad Ducky' },
  });
  const izquierda = documento.page.margins.left;
  const derecha = documento.page.width - documento.page.margins.right;
  const limite_inferior = documento.page.height - documento.page.margins.bottom - 24;

  // Encabezado
  documento
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORES.suave)
    .text('BIBLIOTECA · CATÁLOGO', izquierda, 40, { characterSpacing: 1.2 });
  documento
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(COLORES.texto)
    .text('Listado de libros', izquierda, 54);
  documento
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORES.suave)
    .text(`Generado el ${FormatearFecha(fecha)} · ${generado_por}`, izquierda, 46, {
      align: 'right',
      width: derecha - izquierda,
    });
  documento
    .font('Helvetica')
    .fillColor(COLORES.texto)
    .text(`Filtro: ${filtro}`, izquierda, 60, { align: 'right', width: derecha - izquierda });
  documento
    .moveTo(izquierda, 82)
    .lineTo(derecha, 82)
    .lineWidth(1)
    .strokeColor(COLORES.texto)
    .stroke();

  const DibujarEncabezados = (posicion_inicial) =>
  {
    let posicion_x = izquierda;
    documento.font('Helvetica').fontSize(8).fillColor(COLORES.suave);
    COLUMNAS.forEach((elemento) =>
    {
      documento.text(elemento.titulo, posicion_x, posicion_inicial, { width: elemento.ancho - 6 });
      posicion_x += elemento.ancho;
    });
    documento
      .moveTo(izquierda, posicion_inicial + 14)
      .lineTo(derecha, posicion_inicial + 14)
      .lineWidth(0.5)
      .strokeColor(COLORES.linea)
      .stroke();
    return posicion_inicial + 20;
  };

  let posicion_y = DibujarEncabezados(92);

  libros.forEach((libro, indice) =>
  {
    const alturas = COLUMNAS.map((elemento) =>
    {
      documento.font(elemento.negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      return documento.heightOfString(elemento.valor(libro, indice), { width: elemento.ancho - 6 });
    });
    const alto = Math.max(...alturas) + 10;
    if (posicion_y + alto > limite_inferior)
    {
      documento.addPage();
      posicion_y = DibujarEncabezados(40);
    }
    let posicion_x = izquierda;
    COLUMNAS.forEach((elemento) =>
    {
      documento
        .font(elemento.negrita ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .fillColor(
          elemento.titulo === '#' || elemento.titulo === 'Sinopsis' ? COLORES.suave : COLORES.texto,
        )
        .text(elemento.valor(libro, indice), posicion_x, posicion_y + 3, {
          width: elemento.ancho - 6,
        });
      posicion_x += elemento.ancho;
    });
    posicion_y += alto;
    documento
      .moveTo(izquierda, posicion_y - 2)
      .lineTo(derecha, posicion_y - 2)
      .lineWidth(0.5)
      .strokeColor(COLORES.linea)
      .stroke();
  });

  if (posicion_y + 20 > limite_inferior)
  {
    documento.addPage();
    posicion_y = 40;
  }
  documento
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORES.texto)
    .text(
      `Total: ${libros.length} ${libros.length === 1 ? 'libro' : 'libros'}`,
      izquierda,
      posicion_y + 8,
    );

  // Pie de página en todas las hojas. El pie queda dentro del margen inferior: se quita el
  // margen mientras se escribe para que pdfkit no lo mande a una hoja nueva.
  const rango = documento.bufferedPageRange();
  for (let indice = 0; indice < rango.count; indice += 1)
  {
    documento.switchToPage(indice);
    documento.page.margins.bottom = 0;
    documento
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORES.suave)
      .text(
        `Página ${indice + 1} de ${rango.count} · Biblioteca Universidad Ducky`,
        izquierda,
        documento.page.height - 44, // 40 de margen + 4
        { width: derecha - izquierda, align: 'center', lineBreak: false },
      );
  }
  documento.end();
  return documento;
}

export { GenerarListadoPdf };
