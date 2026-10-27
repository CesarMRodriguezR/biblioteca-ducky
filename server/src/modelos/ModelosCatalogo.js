/**
 * Modelos de tablas simples (catálogos) que solo necesitan CRUD.
 */
import { ModeloBase } from './ModeloBase.js';

const ModeloEditorial = new ModeloBase({
  tabla: 'Editoriales',
  llave_primaria: 'id_editorial',
  columnas: ['Nombre_Editorial', 'Pais'],
  buscables: ['Nombre_Editorial', 'Pais'],
  ordenar_por: 'Nombre_Editorial',
});

const ModeloAutor = new ModeloBase({
  tabla: 'Autores',
  llave_primaria: 'id_autor',
  columnas: ['Nombre', 'Segundo_Nombre', 'Apellido_Paterno', 'Apellido_Materno'],
  buscables: ['Nombre', 'Apellido_Paterno', 'Apellido_Materno'],
  ordenar_por: 'Apellido_Paterno',
});

const ModeloTema = new ModeloBase({
  tabla: 'Temas',
  llave_primaria: 'id_tema',
  columnas: ['Nombre_Tema', 'Descripcion'],
  buscables: ['Nombre_Tema'],
  ordenar_por: 'Nombre_Tema',
});

const ModeloFuncion = new ModeloBase({
  tabla: 'Funciones',
  llave_primaria: 'id_funcion',
  columnas: ['Nombre_Funcion', 'Estatus', 'Descripcion_Funcion'],
  buscables: ['Nombre_Funcion', 'Descripcion_Funcion'],
});

const ModeloPolitica = new ModeloBase({
  tabla: 'Politicas',
  llave_primaria: 'id_politica',
  columnas: ['Informacion'],
  buscables: ['Informacion'],
});

const ModeloNuevoLibro = new ModeloBase({
  tabla: 'NuevosLibros',
  llave_primaria: 'id_libro_nuevo',
  columnas: ['ISBN', 'Titulo', 'Autor', 'Editorial', 'Precio', 'Anio', 'Tema', 'Sinopsis'],
  buscables: ['ISBN', 'Titulo', 'Autor', 'Editorial'],
  ordenar_por: 'Titulo',
});

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
