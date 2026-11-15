/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · HooksDocumentos.js
 * Función: Vista previa de impresión de un documento (recibo, multa o lista de deudores) con
 *          impresión y descarga en PDF.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Funciones del modelo para cargar el documento y su PDF
 * Salida: Estado y acciones de la vista previa
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo             Objetivo
 *     DescargarArchivo   Guardar un archivo (Blob) con su nombre
 *     useVistaPrevia     Abrir, imprimir y descargar un documento
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no devuelve JSX; la vista es ModalDocumento.
 * (2) Imprimir usa la impresión del navegador: solo sale lo que está dentro de .imprimible.
 * (3) Los avisos de éxito se muestran en la pantalla (Alerta), no como ventanas emergentes.
 * ******************************************************************
 */

import { useState } from 'react';

/*
 * Función: DescargarArchivo
 * Objetivo: Guardar un archivo (Blob) en el equipo con el nombre indicado.
 * Entrada: blob, nombre
 * Salida: Ninguna
 */
export function DescargarArchivo(blob, nombre)
{
  const direccion = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = direccion;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(direccion), 1000);
}

/*
 * Hook: useVistaPrevia
 * Objetivo: Abrir la vista previa de un documento, imprimirlo o descargarlo en PDF y avisar
 *           el resultado a la pantalla.
 * Entrada: { CargarDatos(clave), CargarPdf(clave), NombreArchivo(datos), al_imprimir(datos),
 *          al_descargar(datos) }
 * Salida: Objeto { abierta, datos, cargando, descargando, error, Abrir, Cerrar, Imprimir,
 *         Descargar }
 */
export function useVistaPrevia({ CargarDatos, CargarPdf, NombreArchivo, al_imprimir, al_descargar })
{
  const [estado, SetEstado] = useState({
    clave: null,
    datos: null,
    cargando: false,
    descargando: false,
    error: null,
  });

  async function Abrir(clave, datos_listos = null)
  {
    SetEstado({
      clave,
      datos: datos_listos,
      cargando: !datos_listos,
      descargando: false,
      error: null,
    });
    if (datos_listos)
    {
      return;
    }
    try
    {
      const datos = await CargarDatos(clave);
      SetEstado((previo) => ({ ...previo, datos, cargando: false }));
    }
    catch (error)
    {
      SetEstado((previo) => ({ ...previo, error, cargando: false }));
    }
  }

  function Cerrar()
  {
    SetEstado({ clave: null, datos: null, cargando: false, descargando: false, error: null });
  }

  function Imprimir()
  {
    const datos = estado.datos;
    window.print();
    Cerrar();
    al_imprimir?.(datos);
  }

  async function Descargar()
  {
    SetEstado((previo) => ({ ...previo, descargando: true, error: null }));
    try
    {
      const blob = await CargarPdf(estado.clave);
      DescargarArchivo(blob, NombreArchivo(estado.datos));
      const datos = estado.datos;
      Cerrar();
      al_descargar?.(datos);
    }
    catch (error)
    {
      SetEstado((previo) => ({ ...previo, error, descargando: false }));
    }
  }

  return {
    abierta: estado.clave !== null,
    datos: estado.datos,
    cargando: estado.cargando,
    descargando: estado.descargando,
    error: estado.error,
    Abrir,
    Cerrar,
    Imprimir,
    Descargar,
  };
}
