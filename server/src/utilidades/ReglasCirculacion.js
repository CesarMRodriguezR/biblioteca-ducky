/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · ReglasCirculacion.js
 * Función: Reglas del reglamento de préstamo (días, renovaciones, límites y multas), cálculo de
 *          días hábiles y formato de los folios de préstamo y multa.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Perfil del lector, fechas AAAA-MM-DD e identificadores
 * Salida: Números, fechas y textos calculados
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo               Objetivo
 *     REGLAS               Valores del reglamento de préstamo
 *     DiasPrestamo         Días hábiles que dura un préstamo según el perfil
 *     MaximoRenovaciones   Renovaciones permitidas según el perfil
 *     SumarDiasHabiles     Sumar días sin contar sábados ni domingos
 *     DiasRetraso          Días naturales de retraso respecto a la fecha programada
 *     FolioPrestamo        Folio visible de un préstamo (PR-000231)
 *     FolioMulta           Folio visible de una multa (M-0058)
 *     FormatoMoneda        Mostrar un monto como $1,450.00
 *     TextoUbicacion       Mostrar la ubicación como «Pasillo 5 · Estante QA76.76»
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Funciones de apoyo sin acceso a la base de datos; se pueden usar en cualquier capa.
 * (2) El reglamento también está en texto en la tabla Politicas (lo muestra el Asistente);
 *     si cambia una regla, actualiza los dos lugares.
 * ******************************************************************
 */

import { DiferenciaDias, Formatear } from './fechas.js';

/*
 * Constante: REGLAS
 * Objetivo: Valores del reglamento de préstamo.
 */
const REGLAS = {
  MAXIMO_PRESTAMOS: 2,
  MULTA_POR_DIA: 10,
  MULTA_POR_DANO: 250,
  DIAS_PROFESOR: 10,
  DIAS_GENERAL: 5,
  RENOVACIONES_PROFESOR: 3,
  RENOVACIONES_GENERAL: 2,
};

/*
 * Función: DiasPrestamo
 * Objetivo: Días hábiles que dura un préstamo: 10 para profesores y 5 para los demás perfiles.
 * Entrada: nombre_rol
 * Salida: Número de días hábiles
 */
function DiasPrestamo(nombre_rol)
{
  return nombre_rol === 'Profesor' ? REGLAS.DIAS_PROFESOR : REGLAS.DIAS_GENERAL;
}

/*
 * Función: MaximoRenovaciones
 * Objetivo: Renovaciones permitidas por préstamo: 3 para profesores y 2 para los demás.
 * Entrada: nombre_rol
 * Salida: Número de renovaciones
 */
function MaximoRenovaciones(nombre_rol)
{
  return nombre_rol === 'Profesor' ? REGLAS.RENOVACIONES_PROFESOR : REGLAS.RENOVACIONES_GENERAL;
}

/*
 * Función: SumarDiasHabiles
 * Objetivo: Sumar días hábiles a una fecha sin contar sábados ni domingos.
 * Entrada: fecha_iso, dias
 * Salida: Texto AAAA-MM-DD
 */
function SumarDiasHabiles(fecha_iso, dias)
{
  const [anio, mes, dia] = fecha_iso.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  let restantes = dias;
  while (restantes > 0)
  {
    fecha.setDate(fecha.getDate() + 1);
    if (fecha.getDay() !== 0 && fecha.getDay() !== 6)
    {
      restantes -= 1;
    }
  }
  return Formatear(fecha);
}

/*
 * Función: DiasRetraso
 * Objetivo: Días naturales de retraso de una entrega respecto a la fecha programada (0 si se
 *           entrega a tiempo).
 * Entrada: fecha_programada, fecha_entrega
 * Salida: Número de días
 */
function DiasRetraso(fecha_programada, fecha_entrega)
{
  return Math.max(0, DiferenciaDias(fecha_programada, fecha_entrega));
}

/*
 * Función: FolioPrestamo
 * Objetivo: Folio visible de un préstamo a partir de su id.
 * Entrada: id_prestamo
 * Salida: Texto como PR-000231
 */
function FolioPrestamo(id_prestamo)
{
  return `PR-${String(id_prestamo).padStart(6, '0')}`;
}

/*
 * Función: FolioMulta
 * Objetivo: Folio visible de una multa a partir de su id.
 * Entrada: id_multa
 * Salida: Texto como M-0058
 */
function FolioMulta(id_multa)
{
  return `M-${String(id_multa).padStart(4, '0')}`;
}

/*
 * Función: FormatoMoneda
 * Objetivo: Mostrar un monto en pesos con separador de miles y dos decimales.
 * Entrada: monto
 * Salida: Texto como $1,450.00
 */
function FormatoMoneda(monto)
{
  return `$${Number(monto ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/*
 * Función: TextoUbicacion
 * Objetivo: Mostrar el pasillo y el estante de una ubicación interpretada.
 * Entrada: ubicacion ({ Pasillo, Estante })
 * Salida: Texto como «Pasillo 5 · Estante QA76.76» (— si no hay datos)
 */
function TextoUbicacion(ubicacion)
{
  const partes = [];
  if (ubicacion?.Pasillo)
  {
    partes.push(`Pasillo ${ubicacion.Pasillo}`);
  }
  if (ubicacion?.Estante)
  {
    partes.push(`Estante ${ubicacion.Estante}`);
  }
  return partes.join(' · ') || '—';
}

export {
  REGLAS,
  DiasPrestamo,
  MaximoRenovaciones,
  SumarDiasHabiles,
  DiasRetraso,
  FolioPrestamo,
  FolioMulta,
  FormatoMoneda,
  TextoUbicacion,
};
