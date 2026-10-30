/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL · ModelosLibros.js
 * Función: Libros, ejemplares, editoriales, solicitudes de compra y resumen del panel.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos de las pantallas
 * Salida: Respuestas de la API o datos con formato para mostrar
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     ModeloLibro       Acceso a los libros
 *     ModeloEjemplar    Acceso a las copias de un libro
 *     ModeloEditorial   Acceso a las editoriales
 *     ModeloCompra      Acceso a las solicitudes de compra
 *     ModeloPanel       Acceso al resumen del panel
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: acceso a la API y reglas del dominio. No contiene JSX.
 * (2) Las peticiones pasan por ClienteApi, que agrega el token de sesión y convierte los
 *     errores en ErrorApi.
 * (3) La API debe ejecutarse en el puerto 3000; Vite redirige /api en desarrollo.
 * ******************************************************************
 */

import { ClienteApi } from './ClienteApi.js';

/*
 * Módulo: ModeloLibro
 * Objetivo: Acceso a los libros.
 */
export const ModeloLibro = {
  /*
   * Función: Buscar
   * Objetivo: Buscar libros por campo (que también da el orden) y página.
   * Entrada: { q, campo?, desde, hasta, pagina?, por_pagina?, inactivos } (opcional)
   * Salida: Promesa con { total, datos }
   */
  Buscar({
    q: texto_busqueda,
    campo = 'todos',
    desde,
    hasta,
    pagina = 1,
    por_pagina = 6,
    inactivos,
  } = {})
  {
    return ClienteApi.Obtener('/libros', {
      q: texto_busqueda,
      campo,
      desde,
      hasta,
      inactivos,
      limit: por_pagina,
      offset: (pagina - 1) * por_pagina,
    });
  },

  /*
   * Función: Obtener
   * Objetivo: Pedir la ficha de un libro.
   * Entrada: id
   * Salida: Promesa con la respuesta de la API
   */
  Obtener(id)
  {
    return ClienteApi.Obtener(`/libros/${id}`);
  },

  /*
   * Función: PorIsbn
   * Objetivo: Pedir la ficha de un libro por su ISBN.
   * Entrada: isbn
   * Salida: Promesa con la respuesta de la API
   */
  PorIsbn(isbn)
  {
    return ClienteApi.Obtener(`/libros/isbn/${encodeURIComponent(isbn.trim())}`);
  },

  /*
   * Función: SolicitadoPorIsbn
   * Objetivo: Pedir los datos de un libro solicitado en una orden de compra por su ISBN.
   * Entrada: isbn
   * Salida: Promesa con la respuesta de la API
   */
  SolicitadoPorIsbn(isbn)
  {
    return ClienteApi.Obtener(`/libros/solicitados/${encodeURIComponent(isbn.trim())}`);
  },

  /*
   * Función: Crear
   * Objetivo: Dar de alta una ficha bibliográfica.
   * Entrada: ficha
   * Salida: Promesa con la respuesta de la API
   */
  Crear(ficha)
  {
    return ClienteApi.Enviar('/libros', ficha);
  },

  /*
   * Función: Actualizar
   * Objetivo: Guardar los cambios de la ficha.
   * Entrada: id, cambios
   * Salida: Promesa con la respuesta de la API
   */
  Actualizar(id, cambios)
  {
    return ClienteApi.Reemplazar(`/libros/${id}`, cambios);
  },

  /*
   * Función: CambiarEstatus
   * Objetivo: Activar o inactivar un libro.
   * Entrada: id, Estatus
   * Salida: Promesa con la respuesta de la API
   */
  CambiarEstatus(id, Estatus)
  {
    return ClienteApi.Modificar(`/libros/${id}/estatus`, { Estatus });
  },

  /*
   * Función: Listado
   * Objetivo: Pedir el listado de libros para la vista previa.
   * Entrada: filtros
   * Salida: Promesa con la respuesta de la API
   */
  Listado(filtros)
  {
    return ClienteApi.Obtener('/libros/listado', filtros);
  },

  /*
   * Función: ListadoPdf
   * Objetivo: Pedir el listado de libros en PDF.
   * Entrada: filtros
   * Salida: Promesa con el archivo PDF
   */
  ListadoPdf(filtros)
  {
    return ClienteApi.ObtenerArchivo('/libros/listado.pdf', filtros);
  },
};

/*
 * Módulo: ModeloEjemplar
 * Objetivo: Acceso a las copias de un libro.
 */
export const ModeloEjemplar = {
  /*
   * Función: Agregar
   * Objetivo: Agregar copias con su ubicación.
   * Entrada: id_libro, { cantidad, Pasillo, Estante, Nivel, Seccion }
   * Salida: Promesa con la respuesta de la API
   */
  Agregar(id_libro, { cantidad, Pasillo, Estante, Nivel, Seccion })
  {
    return ClienteApi.Enviar(`/libros/${id_libro}/ejemplares`, {
      cantidad,
      Pasillo,
      Estante,
      Nivel,
      Seccion,
    });
  },

  /*
   * Función: CambiarEstado
   * Objetivo: Cambiar el estado de una copia.
   * Entrada: id_libro, num_copia, Estatus
   * Salida: Promesa con la respuesta de la API
   */
  CambiarEstado(id_libro, num_copia, Estatus)
  {
    return ClienteApi.Reemplazar(`/libros/${id_libro}/ejemplares/${num_copia}`, { Estatus });
  },

  /*
   * Función: Retirar
   * Objetivo: Retirar una copia con motivo.
   * Entrada: id_libro, num_copia, Motivo_Baja
   * Salida: Promesa con la respuesta de la API
   */
  Retirar(id_libro, num_copia, Motivo_Baja)
  {
    return ClienteApi.Enviar(`/libros/${id_libro}/ejemplares/${num_copia}/baja`, { Motivo_Baja });
  },
};

/*
 * Módulo: ModeloEditorial
 * Objetivo: Acceso a las editoriales.
 */
export const ModeloEditorial = {
  /*
   * Función: Listar
   * Objetivo: Pedir las editoriales.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  Listar()
  {
    return ClienteApi.Obtener('/editoriales', { limit: 200 });
  },
  /*
   * Función: Crear
   * Objetivo: Dar de alta una editorial.
   * Entrada: datos
   * Salida: Promesa con la respuesta de la API
   */
  Crear(datos)
  {
    return ClienteApi.Enviar('/editoriales', datos);
  },
  /*
   * Función: Actualizar
   * Objetivo: Guardar los cambios de una editorial.
   * Entrada: id, datos
   * Salida: Promesa con la respuesta de la API
   */
  Actualizar(id, datos)
  {
    return ClienteApi.Reemplazar(`/editoriales/${id}`, datos);
  },
  /*
   * Función: Eliminar
   * Objetivo: Eliminar una editorial.
   * Entrada: id
   * Salida: Promesa con la respuesta de la API
   */
  Eliminar(id)
  {
    return ClienteApi.Eliminar(`/editoriales/${id}`);
  },
};

/*
 * Módulo: ModeloCompra
 * Objetivo: Acceso a las solicitudes de compra.
 */
export const ModeloCompra = {
  /*
   * Función: Solicitudes
   * Objetivo: Pedir las solicitudes pendientes.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  Solicitudes()
  {
    return ClienteApi.Obtener('/ordenes-compra/solicitudes');
  },

  /*
   * Función: SolicitarNuevo
   * Objetivo: Solicitud de un título que aún no está en el catálogo.
   * Entrada: { Num_Ejemplares, ...libro }
   * Salida: Promesa con la respuesta de la API
   */
  SolicitarNuevo({ Num_Ejemplares, ...libro })
  {
    return ClienteApi.Enviar('/ordenes-compra', {
      libros_nuevos: [{ nuevo: libro, Num_Ejemplares }],
    });
  },

  /*
   * Función: SolicitarCopias
   * Objetivo: Solicitud de más copias de un libro registrado.
   * Entrada: id_libro, Num_Ejemplares
   * Salida: Promesa con la respuesta de la API
   */
  SolicitarCopias(id_libro, Num_Ejemplares)
  {
    return ClienteApi.Enviar('/ordenes-compra', {
      libros_existentes: [{ id_libro, Num_Ejemplares }],
    });
  },
};

/*
 * Módulo: ModeloPanel
 * Objetivo: Acceso al resumen del panel.
 */
export const ModeloPanel = {
  /*
   * Función: Resumen
   * Objetivo: Pedir los indicadores del panel.
   * Entrada: Ninguna
   * Salida: Promesa con la respuesta de la API
   */
  Resumen()
  {
    return ClienteApi.Obtener('/panel');
  },
};
