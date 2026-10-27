import { useCallback, useEffect, useRef, useState } from 'react';
import { LibroModel } from '../models/LibroModel';
import { CAMPOS_BUSQUEDA, primerNombre } from '../models/dominio';
import { useCarga } from './useCarga';
import { useSesion } from './SesionController';

const POR_PAGINA = 6;

/** Pantalla Inicio: saludo, buscador, filtros y recomendados. */
export function useInicioController(navigation) {
  const { usuario } = useSesion();
  const [texto, setTexto] = useState('');
  const recomendados = useCarga(() => LibroModel.recomendados(5), []);

  const irABuscar = (campo = 'todos') => navigation.navigate('Resultados', { q: texto.trim(), campo });

  return {
    saludo: `Hola, ${primerNombre(usuario?.Nombre_Completo)} — ¿Qué quieres leer hoy?`,
    texto,
    setTexto,
    campos: CAMPOS_BUSQUEDA,
    recomendados: recomendados.datos?.datos ?? [],
    cargando: recomendados.cargando,
    error: recomendados.error,
    recargar: recomendados.recargar,
    buscar: () => irABuscar('todos'),
    elegirCampo: irABuscar,
    abrirLibro: (libro) => navigation.navigate('Detalle', { id: libro.id_libro, titulo: libro.Titulo }),
  };
}

/**
 * Pantalla Buscar (resultados y búsqueda sin filtro). Carga de 6 en 6
 * conforme el usuario se desplaza, igual que la paginación de la web.
 */
export function useBusquedaController(route, navigation) {
  const [texto, setTexto] = useState(route.params?.q ?? '');
  const [filtros, setFiltros] = useState({ q: route.params?.q ?? '', campo: route.params?.campo ?? 'todos' });
  const [estado, setEstado] = useState({ libros: [], total: 0, pagina: 0, cargando: true, error: null });
  const solicitud = useRef(0);

  // Si se vuelve a esta pantalla desde Inicio con otra búsqueda, se aplica.
  useEffect(() => {
    const q = route.params?.q ?? '';
    setTexto(q);
    const campo = route.params?.campo ?? 'todos';
    setFiltros((f) => (f.q === q && f.campo === campo ? f : { q, campo }));
  }, [route.params?.q, route.params?.campo]);

  const cargarPagina = useCallback(async (pagina) => {
    const id = ++solicitud.current;
    setEstado((e) => ({ ...e, cargando: true, error: null, ...(pagina === 1 && { libros: [] }) }));
    try {
      const r = await LibroModel.buscar({ q: filtros.q || undefined, campo: filtros.campo, pagina, porPagina: POR_PAGINA });
      if (id !== solicitud.current) return;
      setEstado((e) => ({
        libros: pagina === 1 ? r.datos : [...e.libros, ...r.datos],
        total: r.total,
        pagina,
        cargando: false,
        error: null,
      }));
    } catch (error) {
      if (id === solicitud.current) setEstado((e) => ({ ...e, cargando: false, error }));
    }
  }, [filtros]);

  useEffect(() => { cargarPagina(1); }, [cargarPagina]);

  const hayMas = estado.libros.length < estado.total;
  const etiquetaCampo = CAMPOS_BUSQUEDA.find((c) => c.valor === filtros.campo)?.etiqueta;

  return {
    texto,
    setTexto,
    campo: filtros.campo,
    campos: CAMPOS_BUSQUEDA,
    sinFiltro: !filtros.q,
    resumen: filtros.q
      ? `${estado.total} ${estado.total === 1 ? 'resultado' : 'resultados'} para «${filtros.q}»${filtros.campo !== 'todos' ? ` en ${etiquetaCampo}` : ''}`
      : `${estado.total} libros activos · sin filtros`,
    ...estado,
    hayMas,
    buscar: () => setFiltros((f) => ({ ...f, q: texto.trim() })),
    elegirCampo: (campo) => setFiltros((f) => ({ ...f, campo, q: texto.trim() })),
    cargarMas: () => { if (hayMas && !estado.cargando) cargarPagina(estado.pagina + 1); },
    recargar: () => cargarPagina(1),
    abrirLibro: (libro) => navigation.navigate('Detalle', { id: libro.id_libro, titulo: libro.Titulo }),
  };
}

/**
 * Detalle de un libro. Quien gestiona libros (administrador y
 * bibliotecario) ve cada copia con su código; los demás, el conteo por estado.
 */
export function useDetalleController(route) {
  const { puede } = useSesion();
  const { id } = route.params;
  const { datos, error, cargando, recargar } = useCarga(() => LibroModel.obtener(id), [id]);

  return {
    libro: datos,
    error,
    cargando,
    recargar,
    gestiona: puede('gestionar_libros'),
    copias: datos?.ejemplares?.filter((e) => e.Estatus !== 'Baja') ?? [],
  };
}
