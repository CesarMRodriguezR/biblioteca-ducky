/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-BL01 · ControladorCatalogo.js
 * Función: Búsqueda del catálogo, listado imprimible y ficha bibliográfica.
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
 *     POR_PAGINA               Libros por página del catálogo
 *     useControladorCatalogo   BD-SP02-BL01 Buscar libros: filtro por campo (que también…
 *     useControladorListado    BD-SP02-GL06 Generar listado: vista previa, impresión y PDF
 *     useControladorFicha      BD-SP02-GL05 Consultar ficha bibliográfica
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado, valida y llama al
 *     modelo.
 * (2) No devuelve JSX y no llama a la API directamente; usa los modelos de src/modelos.
 * (3) Los hooks solo se llaman en el nivel superior del componente, nunca dentro de condiciones
 *     o ciclos.
 * (4) Todo componente que lo use debe estar dentro de ProveedorSesion.
 * ******************************************************************
 */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ModeloLibro } from '../modelos/ModelosLibros.js';
import { CAMPOS_BUSQUEDA } from '../modelos/dominio.js';
import { useAccion, useCarga } from './HooksAsincronos.js';
import { useSesion } from './ControladorSesion.jsx';

/*
 * Constante: POR_PAGINA
 * Objetivo: Libros por página del catálogo.
 */
const POR_PAGINA = 6;

/*
 * Hook: useControladorCatalogo
 * Objetivo: BD-SP02-BL01 Buscar libros: filtro por campo (que también ordena los resultados),
 *           paginación de 6 y apertura del listado (BD-SP02-GL06) para quien tiene
 *           `gestionar_libros`.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorCatalogo()
{
  const { Puede } = useSesion();
  const [parametros, set_params] = useSearchParams();
  const texto_busqueda = parametros.get('q') ?? '';
  const campo = parametros.get('campo') ?? 'todos';
  const pagina = Number(parametros.get('pagina') ?? 1);
  const [texto, SetTexto] = useState(texto_busqueda);

  const filtros = { q: texto_busqueda || undefined, campo };
  const { datos, error, cargando } = useCarga(
    () => ModeloLibro.Buscar({ ...filtros, pagina, por_pagina: POR_PAGINA }),
    [texto_busqueda, campo, pagina],
  );
  const total = datos?.total ?? 0;

  const Actualizar = (cambios) =>
  {
    const siguiente = { q: texto_busqueda, campo, ...cambios };
    const limpio = {};
    if (siguiente.q)
    {
      limpio.q = siguiente.q;
    }
    if (siguiente.campo !== 'todos')
    {
      limpio.campo = siguiente.campo;
    }
    if (siguiente.pagina && siguiente.pagina > 1)
    {
      limpio.pagina = String(siguiente.pagina);
    }
    if (parametros.get('listado'))
    {
      limpio.listado = '1';
    }
    if (cambios.listado === null)
    {
      delete limpio.listado;
    }
    if (cambios.listado === '1')
    {
      limpio.listado = '1';
    }
    set_params(limpio);
  };

  const desde = total ? (pagina - 1) * POR_PAGINA + 1 : 0;
  const hasta = Math.min(pagina * POR_PAGINA, total);
  const etiqueta_campo =
    CAMPOS_BUSQUEDA.find((elemento) => elemento.valor === campo)?.etiqueta ?? 'Todos';
  const resumen = texto_busqueda
    ? `${total} ${total === 1 ? 'resultado' : 'resultados'} para «${texto_busqueda}»${campo !== 'todos' ? ` en ${etiqueta_campo}` : ''}`
    : `${total} libros activos (sin filtros)`;
  const orden_texto = `ordenados por ${campo === 'todos' ? 'título' : etiqueta_campo.toLowerCase()}`;

  return {
    libros: datos?.datos ?? [],
    total,
    resumen,
    rango: total ? `mostrando ${desde}–${hasta} · ${orden_texto}` : '',
    pagina,
    total_paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    q: texto_busqueda,
    campo,
    texto,
    SetTexto,
    error,
    cargando,
    puede_listar: Puede('gestionar_libros'),
    listado_abierto: parametros.get('listado') === '1' && Puede('gestionar_libros'),
    filtros,
    Buscar: () => Actualizar({ q: texto.trim(), pagina: 1 }),
    Limpiar: () =>
    {
      SetTexto('');
      Actualizar({ q: '', pagina: 1 });
    },
    ElegirCampo: (valor) => Actualizar({ campo: valor, pagina: 1 }),
    IrAPagina: (total_actual) => Actualizar({ pagina: total_actual }),
    AbrirListado: () => Actualizar({ pagina, listado: '1' }),
    CerrarListado: () => Actualizar({ pagina, listado: null }),
  };
}

/*
 * Hook: useControladorListado
 * Objetivo: BD-SP02-GL06 Generar listado: vista previa, impresión y PDF.
 * Entrada: filtros
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorListado(filtros)
{
  const { datos, error, cargando } = useCarga(
    () => ModeloLibro.Listado(filtros),
    [filtros.q, filtros.campo],
  );
  const pdf = useAccion(() => ModeloLibro.ListadoPdf(filtros));

  async function GuardarPdf()
  {
    const blob = await pdf.Ejecutar();
    const direccion = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    enlace.href = direccion;
    enlace.download = `Listado_libros_${fecha}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(direccion), 1000);
  }

  return {
    listado: datos,
    error: error ?? pdf.error,
    cargando,
    generando_pdf: pdf.enviando,
    Imprimir: () => window.print(),
    GuardarPdf: () => GuardarPdf().catch(() =>
    {}),
  };
}

/*
 * Hook: useControladorFicha
 * Objetivo: BD-SP02-GL05 Consultar ficha bibliográfica.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorFicha()
{
  const { id } = useParams();
  const navegar = useNavigate();
  const { Puede } = useSesion();
  const { datos, error, cargando } = useCarga(() => ModeloLibro.Obtener(id), [id]);

  return {
    libro: datos,
    error,
    cargando,
    gestiona: Puede('gestionar_libros'),
    no_encontrado: error?.status === 404,
    Editar: () => navegar(`/libros/${id}/editar`),
    Regresar: () => navegar(-1),
    RegresarCatalogo: () => navegar('/catalogo'),
  };
}
