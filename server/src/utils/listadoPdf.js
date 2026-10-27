/**
 * Genera el PDF "Listado de libros" (pantalla BD-SP02-GL06 del prototipo).
 * Carta horizontal, tabla con #, Título, Autor, Editorial, ISBN, Año,
 * Tema, Sinopsis y Copias; pie con "Página X de Y".
 */
import PDFDocument from 'pdfkit';

const COLORES = {
  texto: '#1C2533',
  suave: '#6B7686',
  linea: '#DCE3EC',
  azul: '#10306B',
};

const COLUMNAS = [
  { titulo: '#', ancho: 22, valor: (_l, i) => String(i + 1) },
  { titulo: 'Título', ancho: 120, valor: (l) => l.Titulo, negrita: true },
  { titulo: 'Autor', ancho: 88, valor: (l) => l.Autores_Apellidos || '' },
  { titulo: 'Editorial', ancho: 70, valor: (l) => l.Nombre_Editorial || '' },
  { titulo: 'ISBN', ancho: 92, valor: (l) => l.ISBN },
  { titulo: 'Año', ancho: 34, valor: (l) => (l.Anio ? String(l.Anio) : '') },
  { titulo: 'Tema', ancho: 74, valor: (l) => l.Temas || '' },
  { titulo: 'Sinopsis', ancho: 168, valor: (l) => l.Sinopsis || '' },
  { titulo: 'Copias', ancho: 40, valor: (l) => String(l.Ejemplares_Totales ?? 0) },
];

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

/**
 * @param {object[]} libros   Filas de vw_catalogo
 * @param {object}   meta     { generadoPor, filtro, fecha }
 * @returns {PDFKit.PDFDocument} documento listo para hacer pipe a la respuesta
 */
function generarListadoPdf(libros, { generadoPor, filtro, fecha = new Date() }) {
  const doc = new PDFDocument({
    size: 'LETTER', layout: 'landscape', margin: 40, bufferPages: true,
    info: { Title: 'Listado de libros', Author: 'Biblioteca Universidad Ducky' },
  });
  const izquierda = doc.page.margins.left;
  const derecha = doc.page.width - doc.page.margins.right;
  const limiteInferior = doc.page.height - doc.page.margins.bottom - 24;

  // Encabezado
  doc.font('Helvetica').fontSize(8).fillColor(COLORES.suave)
    .text('BIBLIOTECA · CATÁLOGO', izquierda, 40, { characterSpacing: 1.2 });
  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORES.texto).text('Listado de libros', izquierda, 54);
  doc.font('Helvetica').fontSize(9).fillColor(COLORES.suave)
    .text(`Generado el ${formatearFecha(fecha)} · ${generadoPor}`, izquierda, 46, { align: 'right', width: derecha - izquierda });
  doc.font('Helvetica').fillColor(COLORES.texto)
    .text(`Filtro: ${filtro}`, izquierda, 60, { align: 'right', width: derecha - izquierda });
  doc.moveTo(izquierda, 82).lineTo(derecha, 82).lineWidth(1).strokeColor(COLORES.texto).stroke();

  const dibujarEncabezados = (y) => {
    let x = izquierda;
    doc.font('Helvetica').fontSize(8).fillColor(COLORES.suave);
    COLUMNAS.forEach((c) => {
      doc.text(c.titulo, x, y, { width: c.ancho - 6 });
      x += c.ancho;
    });
    doc.moveTo(izquierda, y + 14).lineTo(derecha, y + 14).lineWidth(0.5).strokeColor(COLORES.linea).stroke();
    return y + 20;
  };

  let y = dibujarEncabezados(92);

  libros.forEach((libro, i) => {
    const alturas = COLUMNAS.map((c) => {
      doc.font(c.negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      return doc.heightOfString(c.valor(libro, i), { width: c.ancho - 6 });
    });
    const alto = Math.max(...alturas) + 10;
    if (y + alto > limiteInferior) {
      doc.addPage();
      y = dibujarEncabezados(40);
    }
    let x = izquierda;
    COLUMNAS.forEach((c) => {
      doc.font(c.negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
        .fillColor(c.titulo === '#' || c.titulo === 'Sinopsis' ? COLORES.suave : COLORES.texto)
        .text(c.valor(libro, i), x, y + 3, { width: c.ancho - 6 });
      x += c.ancho;
    });
    y += alto;
    doc.moveTo(izquierda, y - 2).lineTo(derecha, y - 2).lineWidth(0.5).strokeColor(COLORES.linea).stroke();
  });

  if (y + 20 > limiteInferior) { doc.addPage(); y = 40; }
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORES.texto)
    .text(`Total: ${libros.length} ${libros.length === 1 ? 'libro' : 'libros'}`, izquierda, y + 8);

  // Pie de página en todas las hojas
  const rango = doc.bufferedPageRange();
  for (let p = 0; p < rango.count; p += 1) {
    doc.switchToPage(p);
    doc.font('Helvetica').fontSize(8).fillColor(COLORES.suave).text(
      `Página ${p + 1} de ${rango.count} · Biblioteca Universidad Ducky`,
      izquierda,
      doc.page.height - doc.page.margins.bottom - 4,
      { width: derecha - izquierda, align: 'center', lineBreak: false },
    );
  }
  doc.end();
  return doc;
}

export { generarListadoPdf };
