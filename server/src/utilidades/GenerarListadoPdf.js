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

function FormatearFecha(fecha) 
{
  return fecha
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/**
 * @param {object[]} libros   Filas de vw_catalogo
 * @param {object}   meta     { generado_por, filtro, fecha }
 * @returns {PDFKit.PDFDocument} documento listo para hacer pipe a la respuesta
 */
function GenerarListadoPdf(libros, { generado_por, filtro, fecha = new Date() }) 
{
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margin: 40,
    bufferPages: true,
    info: { Title: 'Listado de libros', Author: 'Biblioteca Universidad Ducky' },
  });
  const izquierda = doc.page.margins.left;
  const derecha = doc.page.width - doc.page.margins.right;
  const limite_inferior = doc.page.height - doc.page.margins.bottom - 24;

  // Encabezado
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORES.suave)
    .text('BIBLIOTECA · CATÁLOGO', izquierda, 40, { characterSpacing: 1.2 });
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(COLORES.texto)
    .text('Listado de libros', izquierda, 54);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORES.suave)
    .text(`Generado el ${FormatearFecha(fecha)} · ${generado_por}`, izquierda, 46, {
      align: 'right',
      width: derecha - izquierda,
    });
  doc
    .font('Helvetica')
    .fillColor(COLORES.texto)
    .text(`Filtro: ${filtro}`, izquierda, 60, { align: 'right', width: derecha - izquierda });
  doc.moveTo(izquierda, 82).lineTo(derecha, 82).lineWidth(1).strokeColor(COLORES.texto).stroke();

  const DibujarEncabezados = (posicion_inicial) => 
  {
    let posicion_x = izquierda;
    doc.font('Helvetica').fontSize(8).fillColor(COLORES.suave);
    COLUMNAS.forEach((elemento) => 
    {
      doc.text(elemento.titulo, posicion_x, posicion_inicial, { width: elemento.ancho - 6 });
      posicion_x += elemento.ancho;
    });
    doc
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
      doc.font(elemento.negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      return doc.heightOfString(elemento.valor(libro, indice), { width: elemento.ancho - 6 });
    });
    const alto = Math.max(...alturas) + 10;
    if (posicion_y + alto > limite_inferior) 
    {
      doc.addPage();
      posicion_y = DibujarEncabezados(40);
    }
    let posicion_x = izquierda;
    COLUMNAS.forEach((elemento) => 
    {
      doc
        .font(elemento.negrita ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .fillColor(elemento.titulo === '#' || elemento.titulo === 'Sinopsis' ? COLORES.suave : COLORES.texto)
        .text(elemento.valor(libro, indice), posicion_x, posicion_y + 3, {
          width: elemento.ancho - 6,
        });
      posicion_x += elemento.ancho;
    });
    posicion_y += alto;
    doc
      .moveTo(izquierda, posicion_y - 2)
      .lineTo(derecha, posicion_y - 2)
      .lineWidth(0.5)
      .strokeColor(COLORES.linea)
      .stroke();
  });

  if (posicion_y + 20 > limite_inferior) 
  {
    doc.addPage();
    posicion_y = 40;
  }
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORES.texto)
    .text(`Total: ${libros.length} ${libros.length === 1 ? 'libro' : 'libros'}`, izquierda, posicion_y + 8);

  // Pie de página en todas las hojas
  const rango = doc.bufferedPageRange();
  for (let indice = 0; indice < rango.count; indice += 1) 
  {
    doc.switchToPage(indice);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORES.suave)
      .text(
        `Página ${indice + 1} de ${rango.count} · Biblioteca Universidad Ducky`,
        izquierda,
        doc.page.height - doc.page.margins.bottom - 4,
        { width: derecha - izquierda, align: 'center', lineBreak: false },
      );
  }
  doc.end();
  return doc;
}

export { GenerarListadoPdf };
