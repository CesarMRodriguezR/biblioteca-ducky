import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LibroModel } from '../models/LibroModel';
import { CAMPOS_BUSQUEDA } from '../models/dominio';
import { useAccion, useCarga } from './useAsync';
import { useSesion } from './SesionController';

const POR_PAGINA = 6;

/**
 * BD-SP02-BL01 Buscar libros: búsqueda por campo, orden, paginación de 6
 * y apertura del listado (BD-SP02-GL06) para quien tiene `generar_listado`.
 */
export function useCatalogoController() {
  const { puede } = useSesion();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const campo = params.get('campo') ?? 'todos';
  const orden = params.get('orden') ?? 'titulo';
  const pagina = Number(params.get('pagina') ?? 1);
  const [texto, setTexto] = useState(q);

  const filtros = { q: q || undefined, campo, orden };
  const { datos, error, cargando } = useCarga(
    () => LibroModel.buscar({ ...filtros, pagina, porPagina: POR_PAGINA }),
    [q, campo, orden, pagina],
  );
  const total = datos?.total ?? 0;

  const actualizar = (cambios) => {
    const siguiente = { q, campo, orden, ...cambios };
    const limpio = {};
    if (siguiente.q) limpio.q = siguiente.q;
    if (siguiente.campo !== 'todos') limpio.campo = siguiente.campo;
    if (siguiente.orden !== 'titulo') limpio.orden = siguiente.orden;
    if (siguiente.pagina && siguiente.pagina > 1) limpio.pagina = String(siguiente.pagina);
    if (params.get('listado')) limpio.listado = '1';
    if (cambios.listado === null) delete limpio.listado;
    if (cambios.listado === '1') limpio.listado = '1';
    setParams(limpio);
  };

  const desde = total ? (pagina - 1) * POR_PAGINA + 1 : 0;
  const hasta = Math.min(pagina * POR_PAGINA, total);
  const etiquetaCampo = CAMPOS_BUSQUEDA.find((c) => c.valor === campo)?.etiqueta ?? 'Todos';
  const resumen = q
    ? `${total} ${total === 1 ? 'resultado' : 'resultados'} para «${q}»${campo !== 'todos' ? ` en ${etiquetaCampo}` : ''}`
    : `${total} libros activos (sin filtros)`;

  return {
    libros: datos?.datos ?? [],
    total,
    resumen,
    rango: total ? `mostrando ${desde}–${hasta}` : '',
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    q,
    campo,
    orden,
    texto,
    setTexto,
    error,
    cargando,
    puedeListar: puede('generar_listado'),
    listadoAbierto: params.get('listado') === '1' && puede('generar_listado'),
    filtros,
    buscar: () => actualizar({ q: texto.trim(), pagina: 1 }),
    limpiar: () => { setTexto(''); actualizar({ q: '', pagina: 1 }); },
    elegirCampo: (valor) => actualizar({ campo: valor, pagina: 1 }),
    elegirOrden: (valor) => actualizar({ orden: valor, pagina: 1 }),
    irAPagina: (n) => actualizar({ pagina: n }),
    abrirListado: () => actualizar({ pagina, listado: '1' }),
    cerrarListado: () => actualizar({ pagina, listado: null }),
  };
}

/** BD-SP02-GL06 Generar listado: vista previa, impresión y PDF. */
export function useListadoController(filtros) {
  const { datos, error, cargando } = useCarga(
    () => LibroModel.listado(filtros),
    [filtros.q, filtros.campo, filtros.orden],
  );
  const pdf = useAccion(() => LibroModel.listadoPdf(filtros));

  async function guardarPdf() {
    const blob = await pdf.ejecutar();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    enlace.href = url;
    enlace.download = `Listado_libros_${fecha}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return {
    listado: datos,
    error: error ?? pdf.error,
    cargando,
    generandoPdf: pdf.enviando,
    imprimir: () => window.print(),
    guardarPdf: () => guardarPdf().catch(() => {}),
  };
}

/** BD-SP02-GL05 Consultar ficha bibliográfica. */
export function useFichaController() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { puede } = useSesion();
  const { datos, error, cargando } = useCarga(() => LibroModel.obtener(id), [id]);

  return {
    libro: datos,
    error,
    cargando,
    gestiona: puede('gestionar_libros'),
    noEncontrado: error?.status === 404,
    editar: () => navegar(`/libros/${id}/editar`),
    regresar: () => navegar(-1),
  };
}
