/*
 * ******************************************************************
 * Nombre del programa: API-UBICACION · CodigoUbicacion.js
 * Función: Generar el código de ubicación de un ejemplar a partir de pasillo, estante, nivel y
 *          sección, interpretarlo para mostrarlo y armar el código visible de cada copia.
 * Autor: Equipo CCJMops
 * Fecha: 28/10/2026
 * Entrada: Componentes de la ubicación o el código guardado en Ejemplares.Ubicacion
 * Salida: Código de ubicación, sus componentes o el código visible de la copia
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                          Objetivo
 *     COMPONENTES_UBICACION           Componentes del código, en orden, con su prefijo
 *     SEPARADOR_UBICACION             Carácter que separa los componentes del código
 *     GenerarCodigoUbicacion          Armar el código a partir de sus componentes
 *     InterpretarCodigoUbicacion      Separar un código en sus componentes
 *     CodigoEjemplar                  Código visible de una copia (EJ-00101)
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) El diagrama guarda la ubicación en una sola columna (Ejemplares.Ubicacion). El código
 *     tiene la forma P{pasillo}-E{estante}-N{nivel}-S{seccion}; por ejemplo, pasillo 2,
 *     estante Q, nivel 3 y sección X → «P2-EQ-N3-SX».
 * (2) Ningún componente puede llevar el separador «-»; las validaciones (zod) lo impiden.
 * (3) El código visible de la copia no se guarda: se calcula con id_libro y num_copia.
 * ******************************************************************
 */

/*
 * Constante: COMPONENTES_UBICACION
 * Objetivo: Componentes del código de ubicación, en orden, con su prefijo de una letra.
 */
const COMPONENTES_UBICACION = [
  { campo: 'Pasillo', prefijo: 'P' },
  { campo: 'Estante', prefijo: 'E' },
  { campo: 'Nivel', prefijo: 'N' },
  { campo: 'Seccion', prefijo: 'S' },
];

/*
 * Constante: SEPARADOR_UBICACION
 * Objetivo: Carácter que separa los componentes del código.
 */
const SEPARADOR_UBICACION = '-';

/*
 * Función: GenerarCodigoUbicacion
 * Objetivo: Armar el código de ubicación con los componentes que tengan valor.
 * Entrada: { Pasillo, Estante, Nivel, Seccion }
 * Salida: Texto como «P4-EB-N2-SComputación» (vacío si no hay ningún componente)
 */
function GenerarCodigoUbicacion(ubicacion = {})
{
  return COMPONENTES_UBICACION.map(({ campo, prefijo }) =>
  {
    const valor = String(ubicacion[campo] ?? '').trim();
    return valor ? `${prefijo}${valor}` : null;
  })
    .filter(Boolean)
    .join(SEPARADOR_UBICACION);
}

/*
 * Función: InterpretarCodigoUbicacion
 * Objetivo: Separar un código de ubicación en sus componentes según el prefijo de cada parte.
 * Entrada: codigo
 * Salida: { Pasillo, Estante, Nivel, Seccion } (null en los que no vienen en el código)
 */
function InterpretarCodigoUbicacion(codigo)
{
  const ubicacion = { Pasillo: null, Estante: null, Nivel: null, Seccion: null };
  String(codigo ?? '')
    .split(SEPARADOR_UBICACION)
    .forEach((parte) =>
    {
      const componente = COMPONENTES_UBICACION.find(({ prefijo }) => parte.startsWith(prefijo));
      if (componente && parte.length > 1)
      {
        ubicacion[componente.campo] = parte.slice(1);
      }
    });
  return ubicacion;
}

/*
 * Función: CodigoEjemplar
 * Objetivo: Código visible de una copia: EJ- + id_libro × 100 + num_copia (EJ-00101 es la copia
 *           1 del libro 1). Las copias van de 1 a 99 por libro, así que no se repite.
 * Entrada: id_libro, num_copia
 * Salida: Texto como «EJ-00101»
 */
function CodigoEjemplar(id_libro, num_copia)
{
  return `EJ-${String(Number(id_libro) * 100 + Number(num_copia)).padStart(5, '0')}`;
}

export {
  COMPONENTES_UBICACION,
  SEPARADOR_UBICACION,
  GenerarCodigoUbicacion,
  InterpretarCodigoUbicacion,
  CodigoEjemplar,
};
