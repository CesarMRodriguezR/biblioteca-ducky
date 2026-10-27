/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-BL01 · ControladorCatalogo.js
 * Función: Pantallas de inicio, búsqueda y detalle de libros del catálogo.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Parámetros de la ruta y acciones del usuario en la pantalla
 * Salida: Estado y acciones que consume la vista
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Hook                     Objetivo
 *     useControladorInicio     Pantalla Inicio: saludo, buscador, filtros y recomendados
 *     useControladorBusqueda   Pantalla Buscar (resultados y búsqueda sin filtro). Carga…
 *     useControladorDetalle    Detalle de un libro. Quien gestiona libros (administrador…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado y llama al modelo.
 * (2) No devuelve JSX y no llama a la API directamente; usa los modelos de src/modelos.
 * (3) Los hooks solo se llaman en el nivel superior del componente, nunca dentro de condiciones
 *     o ciclos.
 * (4) Toda pantalla que lo use debe estar dentro de ProveedorSesion.
 * ******************************************************************
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ModeloLibro } from '../modelos/ModeloLibro';
import { CAMPOS_BUSQUEDA, PrimerNombre } from '../modelos/dominio';
import { useCarga } from './HooksAsincronos';
import { useSesion } from './ControladorSesion';

const POR_PAGINA = 6;

/*
 * Hook: useControladorInicio
 * Objetivo: Pantalla Inicio: saludo, buscador, filtros y recomendados.
 * Entrada: navigation
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorInicio(navigation)
{
  const { usuario } = useSesion();
  const [texto, SetTexto] = useState('');
  const recomendados = useCarga(() => ModeloLibro.Recomendados(5), []);

  const IrABuscar = (campo = 'todos') =>
    navigation.navigate('Resultados', { q: texto.trim(), campo });

  return {
    saludo: `Hola, ${PrimerNombre(usuario?.Nombre_Completo)} — ¿Qué quieres leer hoy?`,
    texto,
    SetTexto,
    campos: CAMPOS_BUSQUEDA,
    recomendados: recomendados.datos?.datos ?? [],
    cargando: recomendados.cargando,
    error: recomendados.error,
    Recargar: recomendados.Recargar,
    Buscar: () => IrABuscar('todos'),
    ElegirCampo: IrABuscar,
    AbrirLibro: (libro) =>
      navigation.navigate('Detalle', { id: libro.id_libro, titulo: libro.Titulo }),
  };
}

/*
 * Hook: useControladorBusqueda
 * Objetivo: Pantalla Buscar (resultados y búsqueda sin filtro). Carga de 6 en 6 conforme el
 *           usuario se desplaza, igual que la paginación de la web.
 * Entrada: route, navigation
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorBusqueda(route, navigation)
{
  const [texto, SetTexto] = useState(route.params?.q ?? '');
  const [filtros, SetFiltros] = useState({
    q: route.params?.q ?? '',
    campo: route.params?.campo ?? 'todos',
  });
  const [estado, SetEstado] = useState({
    libros: [],
    total: 0,
    pagina: 0,
    cargando: true,
    error: null,
  });
  const solicitud = useRef(0);

  // Si se vuelve a esta pantalla desde Inicio con otra búsqueda, se aplica.
  useEffect(() =>
  {
    const texto_busqueda = route.params?.q ?? '';
    SetTexto(texto_busqueda);
    const campo = route.params?.campo ?? 'todos';
    SetFiltros((filtros_previo) =>
      filtros_previo.q === texto_busqueda && filtros_previo.campo === campo
        ? filtros_previo
        : { q: texto_busqueda, campo },
    );
  }, [route.params?.q, route.params?.campo]);

  const CargarPagina = useCallback(
    async (pagina) =>
    {
      const id = ++solicitud.current;
      SetEstado((estado_previo) => ({
        ...estado_previo,
        cargando: true,
        error: null,
        ...(pagina === 1 && { libros: [] }),
      }));
      try
      {
        const resultado = await ModeloLibro.Buscar({
          q: filtros.q || undefined,
          campo: filtros.campo,
          pagina,
          por_pagina: POR_PAGINA,
        });
        if (id !== solicitud.current)
        {
          return;
        }
        SetEstado((estado_previo) => ({
          libros: pagina === 1 ? resultado.datos : [...estado_previo.libros, ...resultado.datos],
          total: resultado.total,
          pagina,
          cargando: false,
          error: null,
        }));
      }
      catch (error)
      {
        if (id === solicitud.current)
        {
          SetEstado((estado_previo) => ({ ...estado_previo, cargando: false, error }));
        }
      }
    },
    [filtros],
  );

  useEffect(() =>
  {
    CargarPagina(1);
  }, [CargarPagina]);

  const hay_mas = estado.libros.length < estado.total;
  const etiqueta_campo = CAMPOS_BUSQUEDA.find(
    (elemento) => elemento.valor === filtros.campo,
  )?.etiqueta;

  return {
    texto,
    SetTexto,
    campo: filtros.campo,
    campos: CAMPOS_BUSQUEDA,
    sin_filtro: !filtros.q,
    resumen: filtros.q
      ? `${estado.total} ${estado.total === 1 ? 'resultado' : 'resultados'} para «${filtros.q}»${filtros.campo !== 'todos' ? ` en ${etiqueta_campo}` : ''}`
      : `${estado.total} libros activos · sin filtros`,
    ...estado,
    hay_mas,
    Buscar: () => SetFiltros((filtros_previo) => ({ ...filtros_previo, q: texto.trim() })),
    ElegirCampo: (campo) =>
      SetFiltros((filtros_previo) => ({ ...filtros_previo, campo, q: texto.trim() })),
    CargarMas: () =>
    {
      if (hay_mas && !estado.cargando)
      {
        CargarPagina(estado.pagina + 1);
      }
    },
    Recargar: () => CargarPagina(1),
    AbrirLibro: (libro) =>
      navigation.navigate('Detalle', { id: libro.id_libro, titulo: libro.Titulo }),
  };
}

/*
 * Hook: useControladorDetalle
 * Objetivo: Detalle de un libro. Quien gestiona libros (administrador y bibliotecario) ve cada
 *           copia con su código; los demás, el conteo por estado.
 * Entrada: route
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorDetalle(route)
{
  const { Puede } = useSesion();
  const { id } = route.params;
  const { datos, error, cargando, Recargar } = useCarga(() => ModeloLibro.Obtener(id), [id]);

  return {
    libro: datos,
    error,
    cargando,
    Recargar,
    gestiona: Puede('gestionar_libros'),
    copias: datos?.ejemplares?.filter((ejemplar) => ejemplar.Estatus !== 'Baja') ?? [],
  };
}
