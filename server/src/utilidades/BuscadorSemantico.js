/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB02 · BuscadorSemantico.js
 * Función: Reconocer, con un modelo de IA local (embeddings), cuál pregunta frecuente del
 *          perfil se parece a lo que el usuario escribió en el Asistente Biblio.
 * Autor: Equipo CCJMops
 * Fecha: 21/11/2026
 * Entrada: Mensaje del usuario y preguntas de su perfil con sus frases de ejemplo
 * Salida: id_pregunta de la pregunta parecida o null
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     MODELO              Modelo de embeddings multilingüe
 *     UMBRAL              Parecido mínimo para aceptar una pregunta
 *     Normalizar          Quitar acentos, signos y mayúsculas de un texto
 *     ObtenerExtractor    Cargar el modelo una sola vez
 *     Vectorizar          Convertir textos en vectores (con caché)
 *     BuscadorSemantico   Elegir la pregunta que corresponde a un mensaje
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Solo lo usa ModeloAsistente. El modelo no redacta: compara el mensaje con cada pregunta
 *     y sus frases de ejemplo (PreguntasChatbot.Frases_Ejemplo) y la respuesta sale tal cual
 *     de la BD, con su fuente.
 * (2) El modelo corre dentro de Node (transformers.js), sin servicios externos ni costo. La
 *     primera vez se descarga de Hugging Face (unos 120 MB) y queda en caché.
 * (3) Si una pregunta escrita no se reconoce, agrega frases de ejemplo en la BD; las pruebas
 *     reemplazan BuscadorSemantico.ElegirPregunta para no cargar el modelo.
 * ******************************************************************
 */

import { pipeline } from '@huggingface/transformers';
import { ErrorHttp } from './ErrorHttp.js';

/*
 * Constante: MODELO
 * Objetivo: Modelo de embeddings multilingüe (entiende español), cuantizado a 8 bits.
 */
const MODELO = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

/*
 * Constante: UMBRAL
 * Objetivo: Parecido mínimo (coseno, de 0 a 1) para aceptar una pregunta; por debajo, el
 *           asistente dice que no encontró información.
 */
const UMBRAL = 0.5;

let extractor = null;
const vectores = new Map();

/*
 * Función: Normalizar
 * Objetivo: Quitar acentos, signos y mayúsculas para que «para que sirve biblio» se compare
 *           igual que «¿Para qué sirve Biblio?».
 * Entrada: texto
 * Salida: Texto normalizado
 */
function Normalizar(texto)
{
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:"()]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/*
 * Función: ObtenerExtractor
 * Objetivo: Cargar el modelo una sola vez; si falla, el siguiente intento lo vuelve a cargar.
 * Entrada: Ninguna
 * Salida: Promesa con el extractor de embeddings
 */
function ObtenerExtractor()
{
  if (!extractor)
  {
    extractor = pipeline('feature-extraction', MODELO, { dtype: 'q8' }).catch((excepcion) =>
    {
      extractor = null;
      throw excepcion;
    });
  }
  return extractor;
}

/*
 * Función: Vectorizar
 * Objetivo: Convertir textos normalizados en vectores unitarios; guarda los ya calculados.
 * Entrada: textos (normalizados)
 * Salida: Promesa con un vector por texto
 */
async function Vectorizar(textos)
{
  const faltantes = [...new Set(textos.filter((texto) => !vectores.has(texto)))];
  if (faltantes.length)
  {
    const extraer = await ObtenerExtractor();
    const salida = await extraer(faltantes, { pooling: 'mean', normalize: true });
    salida.tolist().forEach((vector, indice) => vectores.set(faltantes[indice], vector));
  }
  return textos.map((texto) => vectores.get(texto));
}

/*
 * Módulo: BuscadorSemantico
 * Objetivo: Elegir con embeddings la pregunta frecuente que corresponde a un mensaje.
 */
const BuscadorSemantico = {
  /*
   * Función: ElegirPregunta
   * Objetivo: Comparar el mensaje con cada pregunta y sus frases de ejemplo, y quedarse con la
   *           más parecida si pasa el UMBRAL.
   * Entrada: mensaje, preguntas ([{ id_pregunta, Pregunta, Frases_Ejemplo }])
   * Salida: Promesa con el id_pregunta elegido o null; si el modelo no carga → ErrorHttp 503
   *         (codigo ASISTENTE_IA)
   */
  async ElegirPregunta(mensaje, preguntas)
  {
    const frases = preguntas.flatMap((pregunta) =>
      [pregunta.Pregunta, ...(pregunta.Frases_Ejemplo ?? '').split('|')]
        .filter((frase) => frase.trim())
        .map((frase) => ({ id_pregunta: String(pregunta.id_pregunta), texto: Normalizar(frase) })));
    if (!frases.length)
    {
      return null;
    }
    let vector_mensaje;
    let vectores_frases;
    try
    {
      [vector_mensaje] = await Vectorizar([Normalizar(mensaje)]);
      vectores_frases = await Vectorizar(frases.map((frase) => frase.texto));
    }
    catch
    {
      throw new ErrorHttp(503, 'El asistente aún no puede leer preguntas escritas. Elige una ' +
        'de las preguntas frecuentes.', { codigo: 'ASISTENTE_IA' });
    }
    let mejor = { id_pregunta: null, parecido: -1 };
    vectores_frases.forEach((vector, indice) =>
    {
      // Los vectores ya vienen normalizados: el producto punto es el coseno.
      const parecido = vector.reduce((suma, valor, posicion) =>
        suma + valor * vector_mensaje[posicion], 0);
      if (parecido > mejor.parecido)
      {
        mejor = { id_pregunta: frases[indice].id_pregunta, parecido };
      }
    });
    return mejor.parecido >= UMBRAL ? mejor.id_pregunta : null;
  },

  /*
   * Función: Precargar
   * Objetivo: Cargar el modelo al arrancar la API para que la primera pregunta no espere.
   * Entrada: Ninguna
   * Salida: Promesa que nunca falla (solo avisa en consola)
   */
  async Precargar()
  {
    try
    {
      await ObtenerExtractor();
      console.log('Asistente Biblio: modelo de embeddings listo');
    }
    catch (excepcion)
    {
      console.warn(`Asistente Biblio: no se pudo cargar el modelo (${excepcion.message})`);
    }
  },
};

export { BuscadorSemantico };
