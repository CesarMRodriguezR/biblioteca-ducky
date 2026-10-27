/*
 * ******************************************************************
 * Nombre del programa: API-CATALOGOS · ModelosCatalogo.js
 * Función: Modelos de las tablas simples (catálogos) que solo necesitan altas, bajas y cambios.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos validados por los controladores
 * Salida: Filas de la base de datos MariaDB o ErrorHttp si se rompe una regla
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                Objetivo
 *     ModeloEditorial       Editoriales
 *     ModeloAutor           Autores
 *     ModeloTema            Temas
 *     ModeloFuncion         Funciones (permisos)
 *     ModeloPolitica        Políticas de la biblioteca
 *     ModeloNuevoLibro      Libros nuevos solicitados en órdenes de compra
 *     ModeloFuenteChatbot   Fuentes de las respuestas del chatbot
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: contiene la lógica de negocio y el acceso a la base de datos.
 * (2) Toda consulta es parametrizada (?); nunca se concatenan datos del usuario en el SQL.
 * (3) Requiere la base de datos creada con database/01_schema.sql y la conexión de
 *     configuracion/conexion.js.
 * (4) Las operaciones que modifican varias tablas usan EjecutarEnTransaccion.
 * (5) Para un catálogo nuevo basta con crear otra instancia de ModeloBase con su tabla y
 *     columnas.
 * ******************************************************************
 */

import { ModeloBase } from './ModeloBase.js';

/*
 * Variable: ModeloEditorial
 * Objetivo: Editoriales.
 */
const ModeloEditorial = new ModeloBase({
  tabla: 'Editoriales',
  llave_primaria: 'id_editorial',
  columnas: ['Nombre_Editorial', 'Pais'],
  buscables: ['Nombre_Editorial', 'Pais'],
  ordenar_por: 'Nombre_Editorial',
});

/*
 * Variable: ModeloAutor
 * Objetivo: Autores.
 */
const ModeloAutor = new ModeloBase({
  tabla: 'Autores',
  llave_primaria: 'id_autor',
  columnas: ['Nombre', 'Segundo_Nombre', 'Apellido_Paterno', 'Apellido_Materno'],
  buscables: ['Nombre', 'Apellido_Paterno', 'Apellido_Materno'],
  ordenar_por: 'Apellido_Paterno',
});

/*
 * Variable: ModeloTema
 * Objetivo: Temas.
 */
const ModeloTema = new ModeloBase({
  tabla: 'Temas',
  llave_primaria: 'id_tema',
  columnas: ['Nombre_Tema', 'Descripcion'],
  buscables: ['Nombre_Tema'],
  ordenar_por: 'Nombre_Tema',
});

/*
 * Variable: ModeloFuncion
 * Objetivo: Funciones (permisos).
 */
const ModeloFuncion = new ModeloBase({
  tabla: 'Funciones',
  llave_primaria: 'id_funcion',
  columnas: ['Nombre_Funcion', 'Estatus', 'Descripcion_Funcion'],
  buscables: ['Nombre_Funcion', 'Descripcion_Funcion'],
});

/*
 * Variable: ModeloPolitica
 * Objetivo: Políticas de la biblioteca.
 */
const ModeloPolitica = new ModeloBase({
  tabla: 'Politicas',
  llave_primaria: 'id_politica',
  columnas: ['Informacion'],
  buscables: ['Informacion'],
});

/*
 * Variable: ModeloNuevoLibro
 * Objetivo: Libros nuevos solicitados en órdenes de compra.
 */
const ModeloNuevoLibro = new ModeloBase({
  tabla: 'NuevosLibros',
  llave_primaria: 'id_libro_nuevo',
  columnas: ['ISBN', 'Titulo', 'Autor', 'Editorial', 'Precio', 'Anio', 'Tema', 'Sinopsis'],
  buscables: ['ISBN', 'Titulo', 'Autor', 'Editorial'],
  ordenar_por: 'Titulo',
});

/*
 * Variable: ModeloFuenteChatbot
 * Objetivo: Fuentes de las respuestas del chatbot.
 */
const ModeloFuenteChatbot = new ModeloBase({
  tabla: 'fuentesChatbot',
  llave_primaria: 'id_fuentes',
  columnas: ['Fuente'],
  buscables: ['Fuente'],
});

export {
  ModeloEditorial,
  ModeloAutor,
  ModeloTema,
  ModeloFuncion,
  ModeloPolitica,
  ModeloNuevoLibro,
  ModeloFuenteChatbot,
};
