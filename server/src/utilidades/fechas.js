/*
 * ******************************************************************
 * Nombre del programa: API-FECHAS · fechas.js
 * Función: Operaciones con fechas en formato AAAA-MM-DD (hoy, sumar días, diferencia) y su
 *          formato para mostrar (09/11/2026, Lunes 09/11/2026).
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Fechas en texto o Date
 * Salida: Fechas en texto o número de días
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo           Objetivo
 *     Hoy              Fecha local en formato YYYY-MM-DD
 *     Formatear        Convertir un Date a texto AAAA-MM-DD
 *     SumarDias        Sumar días a una fecha
 *     DiferenciaDias   Días completos de b menos a (positivo si b es posterior)
 *     DIAS_SEMANA      Nombres de los días de la semana
 *     FechaCorta       Mostrar una fecha como DD/MM/AAAA
 *     FechaLarga       Mostrar una fecha con su día de la semana
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Funciones de apoyo sin acceso a la base de datos; se pueden usar en cualquier capa.
 * ******************************************************************
 */

/*
 * Función: Hoy
 * Objetivo: Fecha local en formato YYYY-MM-DD.
 * Entrada: Ninguna
 * Salida: Texto AAAA-MM-DD
 */
function Hoy()
{
  return Formatear(new Date());
}

/*
 * Función: Formatear
 * Objetivo: Convertir un Date a texto AAAA-MM-DD.
 * Entrada: fecha
 * Salida: Texto AAAA-MM-DD
 */
function Formatear(fecha)
{
  const posicion_y = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${posicion_y}-${mes}-${dia}`;
}

/*
 * Función: SumarDias
 * Objetivo: Sumar días a una fecha.
 * Entrada: fecha_iso, dias
 * Salida: Texto AAAA-MM-DD
 */
function SumarDias(fecha_iso, dias)
{
  const [posicion_y, mes, dia] = fecha_iso.split('-').map(Number);
  const fecha = new Date(posicion_y, mes - 1, dia);
  fecha.setDate(fecha.getDate() + dias);
  return Formatear(fecha);
}

/*
 * Función: DiferenciaDias
 * Objetivo: Días completos de b menos a (positivo si b es posterior).
 * Entrada: a_iso, b_iso
 * Salida: Número de días
 */
function DiferenciaDias(a_iso, b_iso)
{
  const [ay, am, ad] = a_iso.split('-').map(Number);
  const [by, bm, bd] = b_iso.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86400000);
}

/*
 * Constante: DIAS_SEMANA
 * Objetivo: Nombres de los días de la semana (0 = domingo, como Date.getDay).
 */
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/*
 * Función: FechaCorta
 * Objetivo: Mostrar una fecha AAAA-MM-DD como DD/MM/AAAA.
 * Entrada: fecha_iso
 * Salida: Texto DD/MM/AAAA (— si no hay fecha)
 */
function FechaCorta(fecha_iso)
{
  if (!fecha_iso)
  {
    return '—';
  }
  const [anio, mes, dia] = fecha_iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

/*
 * Función: FechaLarga
 * Objetivo: Mostrar una fecha AAAA-MM-DD con su día de la semana.
 * Entrada: fecha_iso
 * Salida: Texto como «Lunes 09/11/2026»
 */
function FechaLarga(fecha_iso)
{
  const [anio, mes, dia] = fecha_iso.slice(0, 10).split('-').map(Number);
  return `${DIAS_SEMANA[new Date(anio, mes - 1, dia).getDay()]} ${FechaCorta(fecha_iso)}`;
}

export { Hoy, Formatear, SumarDias, DiferenciaDias, FechaCorta, FechaLarga };
