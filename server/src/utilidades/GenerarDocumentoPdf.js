/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · GenerarDocumentoPdf.js
 * Función: Dibujar en PDF los documentos de circulación (recibo de préstamo, comprobante de
 *          multa y lista de alumnos deudores) con el mismo formato que el listado de libros.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Título, datos etiquetados, tabla opcional y notas
 * Salida: PDFDocument listo para enviar con pipe()
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                Objetivo
 *     COLORES               Colores del documento
 *     GenerarDocumentoPdf   Dibujar un documento con datos, tabla y notas
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Funciones de apoyo sin acceso a la base de datos; se pueden usar en cualquier capa.
 * (2) Los datos se acomodan en tres columnas; la tabla reparte el ancho de la hoja según el
 *     ancho relativo de cada columna.
 * ******************************************************************
 */

import PDFDocument from 'pdfkit';

/*
 * Constante: COLORES
 * Objetivo: Colores del documento (los mismos del listado de libros).
 */
const COLORES = {
  texto: '#1C2533',
  suave: '#6B7686',
  linea: '#DCE3EC',
  azul: '#10306B',
};

/*
 * Función: GenerarDocumentoPdf
 * Objetivo: Dibujar un documento con encabezado, datos etiquetados en tres columnas, una tabla
 *           opcional, notas y el pie con el número de página.
 * Entrada: { titulo, subtitulo, generado, datos: [[etiqueta, valor]], tabla: { columnas:
 *          [{ titulo, ancho }], filas: [[...]] }, notas: [texto] }
 * Salida: PDFDocument listo para enviar con pipe()
 */
function GenerarDocumentoPdf({ titulo, subtitulo, generado, datos = [], tabla, notas = [] })
{
  const documento = new PDFDocument({
    size: 'LETTER',
    margin: 48,
    bufferPages: true,
    info: { Title: titulo, Author: 'Biblioteca Universidad Ducky' },
  });
  const izquierda = documento.page.margins.left;
  const derecha = documento.page.width - documento.page.margins.right;
  const ancho = derecha - izquierda;
  const limite_inferior = documento.page.height - documento.page.margins.bottom - 24;

  documento
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORES.azul)
    .text('Biblio · Universidad Ducky', izquierda, 48);
  if (generado)
  {
    documento
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORES.suave)
      .text(generado, izquierda, 50, { width: ancho, align: 'right' });
  }
  documento.font('Helvetica-Bold').fontSize(18).fillColor(COLORES.texto).text(titulo, izquierda, 70);
  let posicion_y = documento.y + 2;
  if (subtitulo)
  {
    documento
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORES.suave)
      .text(subtitulo, izquierda, posicion_y, { width: ancho });
    posicion_y = documento.y;
  }
  posicion_y += 10;
  documento
    .moveTo(izquierda, posicion_y)
    .lineTo(derecha, posicion_y)
    .lineWidth(1)
    .strokeColor(COLORES.texto)
    .stroke();
  posicion_y += 14;

  // Datos etiquetados en tres columnas
  const ancho_dato = ancho / 3;
  for (let indice = 0; indice < datos.length; indice += 3)
  {
    const renglon = datos.slice(indice, indice + 3);
    let alto = 0;
    renglon.forEach(([etiqueta, valor], columna) =>
    {
      const posicion_x = izquierda + columna * ancho_dato;
      documento
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORES.suave)
        .text(etiqueta.toUpperCase(), posicion_x, posicion_y, {
          width: ancho_dato - 12,
          characterSpacing: 0.8,
        });
      documento
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(COLORES.texto)
        .text(String(valor ?? '—'), posicion_x, posicion_y + 12, { width: ancho_dato - 12 });
      alto = Math.max(alto, documento.y - posicion_y);
    });
    posicion_y += alto + 14;
  }

  // Tabla
  if (tabla)
  {
    const suma = tabla.columnas.reduce((total, columna) => total + columna.ancho, 0);
    const anchos = tabla.columnas.map((columna) => (columna.ancho / suma) * ancho);
    const DibujarEncabezados = (inicio) =>
    {
      let posicion_x = izquierda;
      documento.font('Helvetica').fontSize(8).fillColor(COLORES.suave);
      tabla.columnas.forEach((columna, indice) =>
      {
        documento.text(columna.titulo, posicion_x, inicio, { width: anchos[indice] - 6 });
        posicion_x += anchos[indice];
      });
      documento
        .moveTo(izquierda, inicio + 14)
        .lineTo(derecha, inicio + 14)
        .lineWidth(0.5)
        .strokeColor(COLORES.linea)
        .stroke();
      return inicio + 20;
    };
    posicion_y = DibujarEncabezados(posicion_y);
    tabla.filas.forEach((fila) =>
    {
      documento.font('Helvetica').fontSize(9);
      const alto =
        Math.max(
          ...fila.map((valor, indice) =>
            documento.heightOfString(String(valor), { width: anchos[indice] - 6 })),
        ) + 10;
      if (posicion_y + alto > limite_inferior)
      {
        documento.addPage();
        posicion_y = DibujarEncabezados(48);
      }
      let posicion_x = izquierda;
      fila.forEach((valor, indice) =>
      {
        documento
          .font(indice === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .fillColor(COLORES.texto)
          .text(String(valor), posicion_x, posicion_y + 3, { width: anchos[indice] - 6 });
        posicion_x += anchos[indice];
      });
      posicion_y += alto;
      documento
        .moveTo(izquierda, posicion_y - 2)
        .lineTo(derecha, posicion_y - 2)
        .lineWidth(0.5)
        .strokeColor(COLORES.linea)
        .stroke();
    });
    posicion_y += 10;
  }

  notas.forEach((nota, indice) =>
  {
    if (posicion_y + 20 > limite_inferior)
    {
      documento.addPage();
      posicion_y = 48;
    }
    documento
      .font(indice === 0 && tabla ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor(indice === 0 && tabla ? COLORES.texto : COLORES.suave)
      .text(nota, izquierda, posicion_y, { width: ancho });
    posicion_y = documento.y + 6;
  });

  // Pie de página en todas las hojas (sin margen inferior para que no cree otra hoja)
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
        documento.page.height - 52,
        { width: ancho, align: 'center', lineBreak: false },
      );
  }
  documento.end();
  return documento;
}

export { GenerarDocumentoPdf };
