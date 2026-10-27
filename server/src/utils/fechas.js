'use strict';

/** Fecha local en formato YYYY-MM-DD. */
function hoy() {
  return formatear(new Date());
}

function formatear(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sumarDias(fechaIso, dias) {
  const [y, m, d] = fechaIso.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setDate(fecha.getDate() + dias);
  return formatear(fecha);
}

/** Días completos de b menos a (positivo si b es posterior). */
function diferenciaDias(aIso, bIso) {
  const [ay, am, ad] = aIso.split('-').map(Number);
  const [by, bm, bd] = bIso.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86400000);
}

module.exports = { hoy, formatear, sumarDias, diferenciaDias };
