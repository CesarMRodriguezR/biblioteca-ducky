import { api } from './apiClient';

/** Catálogo de libros (solo lectura en la app móvil). */
export const LibroModel = {
  buscar({ q, campo = 'todos', orden = 'titulo', pagina = 1, porPagina = 6 } = {}) {
    return api.get('/libros', {
      q, campo, orden, limit: porPagina, offset: (pagina - 1) * porPagina,
    });
  },

  /** "Recomendados" de la pantalla de inicio: los títulos con más copias disponibles. */
  recomendados(cantidad = 5) {
    return api.get('/libros', { orden: 'disponibles', limit: cantidad, offset: 0 });
  },

  obtener(id) {
    return api.get(`/libros/${id}`);
  },
};
