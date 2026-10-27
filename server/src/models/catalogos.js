/**
 * Modelos de tablas simples (catálogos) que solo necesitan CRUD.
 */
import { BaseModel } from './BaseModel.js';

const EditorialModel = new BaseModel({
  table: 'Editoriales',
  primaryKey: 'id_editorial',
  columns: ['Nombre_Editorial', 'Pais'],
  searchable: ['Nombre_Editorial', 'Pais'],
  orderBy: 'Nombre_Editorial',
});

const AutorModel = new BaseModel({
  table: 'Autores',
  primaryKey: 'id_autor',
  columns: ['Nombre', 'Segundo_Nombre', 'Apellido_Paterno', 'Apellido_Materno'],
  searchable: ['Nombre', 'Apellido_Paterno', 'Apellido_Materno'],
  orderBy: 'Apellido_Paterno',
});

const TemaModel = new BaseModel({
  table: 'Temas',
  primaryKey: 'id_tema',
  columns: ['Nombre_Tema', 'Descripcion'],
  searchable: ['Nombre_Tema'],
  orderBy: 'Nombre_Tema',
});

const FuncionModel = new BaseModel({
  table: 'Funciones',
  primaryKey: 'id_funcion',
  columns: ['Nombre_Funcion', 'Estatus', 'Descripcion_Funcion'],
  searchable: ['Nombre_Funcion', 'Descripcion_Funcion'],
});

const PoliticaModel = new BaseModel({
  table: 'Politicas',
  primaryKey: 'id_politica',
  columns: ['Informacion'],
  searchable: ['Informacion'],
});

const NuevoLibroModel = new BaseModel({
  table: 'NuevosLibros',
  primaryKey: 'id_libro_nuevo',
  columns: ['ISBN', 'Titulo', 'Autor', 'Editorial', 'Precio', 'Anio', 'Tema', 'Sinopsis'],
  searchable: ['ISBN', 'Titulo', 'Autor', 'Editorial'],
  orderBy: 'Titulo',
});

const FuenteChatbotModel = new BaseModel({
  table: 'fuentesChatbot',
  primaryKey: 'id_fuentes',
  columns: ['Fuente'],
  searchable: ['Fuente'],
});

export { EditorialModel, AutorModel, TemaModel, FuncionModel, PoliticaModel, NuevoLibroModel, FuenteChatbotModel };
