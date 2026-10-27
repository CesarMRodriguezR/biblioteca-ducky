/** Fecha local en formato YYYY-MM-DD. */
function Hoy() 
{
  return Formatear(new Date());
}

function Formatear(fecha) 
{
  const posicion_y = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${posicion_y}-${mes}-${dia}`;
}

function SumarDias(fecha_iso, dias) 
{
  const [posicion_y, mes, dia] = fecha_iso.split('-').map(Number);
  const fecha = new Date(posicion_y, mes - 1, dia);
  fecha.setDate(fecha.getDate() + dias);
  return Formatear(fecha);
}

/** Días completos de b menos a (positivo si b es posterior). */
function DiferenciaDias(a_iso, b_iso) 
{
  const [ay, am, ad] = a_iso.split('-').map(Number);
  const [by, bm, bd] = b_iso.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86400000);
}

export { Hoy, Formatear, SumarDias, DiferenciaDias };
