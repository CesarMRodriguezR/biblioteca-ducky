/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · ModelosCirculacion.js
 * Función: Préstamos, lista de espera, devoluciones, multas y pagos de Tesorería.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Datos de las pantallas de circulación
 * Salida: Respuestas de la API
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     ModeloLector        Situación de un lector (préstamos, multas y condiciones)
 *     ModeloPrestamo      Acceso a los préstamos
 *     ModeloListaEspera   Acceso a la lista de espera
 *     ModeloDevolucion    Acceso a las devoluciones
 *     ModeloMulta         Acceso a las multas, deudores y pagos
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: acceso a la API. No contiene JSX.
 * (2) Las peticiones pasan por ClienteApi, que agrega el token de sesión y convierte los
 *     errores en ErrorApi (con codigo y detalles para las reglas de negocio).
 * ******************************************************************
 */

import { ClienteApi } from './ClienteApi.js';

/*
 * Módulo: ModeloLector
 * Objetivo: Situación de un lector (préstamos, multas y condiciones).
 */
export const ModeloLector = {
  /*
   * Función: Situacion
   * Objetivo: Pedir la situación de un lector por matrícula o número de nómina.
   * Entrada: matricula
   * Salida: Promesa con { lector, resumen, condiciones, puede_prestar, reglas, activos,
   *         historial, multas }
   */
  Situacion(matricula)
  {
    return ClienteApi.Obtener(`/circulacion/lectores/${encodeURIComponent(matricula.trim())}`);
  },
};

/*
 * Módulo: ModeloPrestamo
 * Objetivo: Acceso a los préstamos.
 */
export const ModeloPrestamo = {
  /*
   * Función: Resumen
   * Objetivo: Pedir los indicadores y últimos préstamos del menú.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  Resumen()
  {
    return ClienteApi.Obtener('/prestamos/resumen');
  },

  /*
   * Función: Libro
   * Objetivo: Pedir un libro por ISBN con sus copias para préstamo.
   * Entrada: isbn
   * Salida: Promesa con la respuesta de la API
   */
  Libro(isbn)
  {
    return ClienteApi.Obtener(`/prestamos/libros/${encodeURIComponent(isbn.trim())}`);
  },

  /*
   * Función: Registrar
   * Objetivo: Registrar un préstamo.
   * Entrada: { matricula, id_libro, num_copia }
   * Salida: Promesa con { prestamo, lista_espera }
   */
  Registrar(datos)
  {
    return ClienteApi.Enviar('/prestamos', datos);
  },

  /*
   * Función: Recibo
   * Objetivo: Pedir el recibo de un préstamo.
   * Entrada: id_prestamo
   * Salida: Promesa con la respuesta de la API
   */
  Recibo(id_prestamo)
  {
    return ClienteApi.Obtener(`/prestamos/${id_prestamo}`);
  },

  /*
   * Función: ReciboPdf
   * Objetivo: Pedir el recibo en PDF.
   * Entrada: id_prestamo
   * Salida: Promesa con el archivo PDF
   */
  ReciboPdf(id_prestamo)
  {
    return ClienteApi.ObtenerArchivo(`/prestamos/${id_prestamo}/recibo.pdf`);
  },

  /*
   * Función: Renovar
   * Objetivo: Renovar un préstamo.
   * Entrada: id_prestamo
   * Salida: Promesa con { prestamo, renovacion, multa }
   */
  Renovar(id_prestamo)
  {
    return ClienteApi.Enviar(`/prestamos/${id_prestamo}/renovacion`);
  },

  /*
   * Función: Vencidos
   * Objetivo: Pedir los préstamos vencidos de un perfil o de un lector.
   * Entrada: { perfil, matricula }
   * Salida: Promesa con { lector, datos }
   */
  Vencidos(filtros)
  {
    return ClienteApi.Obtener('/prestamos/vencidos', filtros);
  },
};

/*
 * Módulo: ModeloListaEspera
 * Objetivo: Acceso a la lista de espera.
 */
export const ModeloListaEspera = {
  /*
   * Función: Buscar
   * Objetivo: Pedir la lista de espera de un libro por su ISBN.
   * Entrada: texto
   * Salida: Promesa con la respuesta de la API
   */
  Buscar(texto)
  {
    return ClienteApi.Obtener('/lista-espera', { q: texto.trim() });
  },

  /*
   * Función: Agregar
   * Objetivo: Agregar a un lector a la lista de espera de un libro.
   * Entrada: id_libro, matricula
   * Salida: Promesa con la lista actualizada y el lugar del lector
   */
  Agregar(id_libro, matricula)
  {
    return ClienteApi.Enviar('/lista-espera', { id_libro, matricula: matricula.trim() });
  },

  /*
   * Función: Quitar
   * Objetivo: Quitar a un lector de la lista de espera.
   * Entrada: id_lista_espera
   * Salida: Promesa con la lista actualizada
   */
  Quitar(id_lista_espera)
  {
    return ClienteApi.Eliminar(`/lista-espera/${id_lista_espera}`);
  },
};

/*
 * Módulo: ModeloDevolucion
 * Objetivo: Acceso a las devoluciones.
 */
export const ModeloDevolucion = {
  /*
   * Función: Resumen
   * Objetivo: Pedir los indicadores y últimas devoluciones del menú.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  Resumen()
  {
    return ClienteApi.Obtener('/devoluciones/resumen');
  },

  /*
   * Función: Registrar
   * Objetivo: Registrar la devolución de un préstamo.
   * Entrada: { id_prestamo, condicion }
   * Salida: Promesa con { prestamo, dias_retraso, multa, lista_espera }
   */
  Registrar(datos)
  {
    return ClienteApi.Enviar('/devoluciones', datos);
  },

  /*
   * Función: ReportarPerdido
   * Objetivo: Reportar como perdido el libro de un préstamo.
   * Entrada: id_prestamo
   * Salida: Promesa con { prestamo, multa, enviada_tesoreria, avisado_servicios }
   */
  ReportarPerdido(id_prestamo)
  {
    return ClienteApi.Enviar(`/prestamos/${id_prestamo}/perdido`);
  },
};

/*
 * Módulo: ModeloMulta
 * Objetivo: Acceso a las multas, deudores y pagos.
 */
export const ModeloMulta = {
  /*
   * Función: Resumen
   * Objetivo: Pedir los indicadores y multas recientes del menú.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  Resumen()
  {
    return ClienteApi.Obtener('/multas/resumen');
  },

  /*
   * Función: Generar
   * Objetivo: Generar la multa de un préstamo.
   * Entrada: { id_prestamo, motivo, justificacion }
   * Salida: Promesa con { prestamo, multa }
   */
  Generar(datos)
  {
    return ClienteApi.Enviar('/multas', datos);
  },

  /*
   * Función: Obtener
   * Objetivo: Pedir una multa (comprobante).
   * Entrada: id_multa
   * Salida: Promesa con la respuesta de la API
   */
  Obtener(id_multa)
  {
    return ClienteApi.Obtener(`/multas/${id_multa}`);
  },

  /*
   * Función: ComprobantePdf
   * Objetivo: Pedir el comprobante de la multa en PDF.
   * Entrada: id_multa
   * Salida: Promesa con el archivo PDF
   */
  ComprobantePdf(id_multa)
  {
    return ClienteApi.ObtenerArchivo(`/multas/${id_multa}/comprobante.pdf`);
  },

  /*
   * Función: Deudores
   * Objetivo: Pedir la lista de alumnos deudores de un periodo de exámenes.
   * Entrada: periodo
   * Salida: Promesa con { periodo, generado_el, total_adeudo, datos }
   */
  Deudores(periodo)
  {
    return ClienteApi.Obtener('/multas/deudores', { periodo });
  },

  /*
   * Función: DeudoresPdf
   * Objetivo: Pedir la lista de alumnos deudores en PDF.
   * Entrada: periodo
   * Salida: Promesa con el archivo PDF
   */
  DeudoresPdf(periodo)
  {
    return ClienteApi.ObtenerArchivo('/multas/deudores.pdf', { periodo });
  },

  /*
   * Función: EnviarDeudores
   * Objetivo: Enviar la lista de alumnos deudores a Servicios Escolares.
   * Entrada: periodo
   * Salida: Promesa con { periodo, total }
   */
  EnviarDeudores(periodo)
  {
    return ClienteApi.Enviar('/multas/deudores/envio', { periodo });
  },

  /*
   * Función: Pagos
   * Objetivo: Sincronizar con Tesorería y pedir los pagos recibidos.
   * Entrada: Ninguna
   * Salida: Promesa con { disponible, enviadas, aplicados, pagos, pendientes }
   */
  Pagos()
  {
    return ClienteApi.Obtener('/multas/pagos');
  },
};
