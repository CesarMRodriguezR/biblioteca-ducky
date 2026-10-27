import { api } from './apiClient';

/** Libros, ejemplares, editoriales y solicitudes de compra. */
export const LibroModel = {
  buscar({ q, campo = 'todos', orden = 'titulo', desde, hasta, pagina = 1, porPagina = 6, inactivos } = {}) {
    return api.get('/libros', {
      q, campo, orden, desde, hasta, inactivos, limit: porPagina, offset: (pagina - 1) * porPagina,
    });
  },

  obtener(id) {
    return api.get(`/libros/${id}`);
  },

  porIsbn(isbn) {
    return api.get(`/libros/isbn/${encodeURIComponent(isbn.trim())}`);
  },

  crear(ficha) {
    return api.post('/libros', ficha);
  },

  actualizar(id, cambios) {
    return api.put(`/libros/${id}`, cambios);
  },

  cambiarEstatus(id, Estatus) {
    return api.patch(`/libros/${id}/estatus`, { Estatus });
  },

  listado(filtros) {
    return api.get('/libros/listado', filtros);
  },

  listadoPdf(filtros) {
    return api.getBlob('/libros/listado.pdf', filtros);
  },
};

export const EjemplarModel = {
  agregar(idLibro, { cantidad, Pasillo, Estante, Nivel }) {
    return api.post(`/libros/${idLibro}/ejemplares`, { cantidad, Pasillo, Estante, Nivel });
  },

  cambiarEstado(idLibro, numCopia, Estatus) {
    return api.put(`/libros/${idLibro}/ejemplares/${numCopia}`, { Estatus });
  },

  retirar(idLibro, numCopia, Motivo_Baja) {
    return api.post(`/libros/${idLibro}/ejemplares/${numCopia}/baja`, { Motivo_Baja });
  },
};

export const EditorialModel = {
  listar() {
    return api.get('/editoriales', { limit: 200 });
  },
  crear(datos) {
    return api.post('/editoriales', datos);
  },
  actualizar(id, datos) {
    return api.put(`/editoriales/${id}`, datos);
  },
  eliminar(id) {
    return api.delete(`/editoriales/${id}`);
  },
};

export const CompraModel = {
  solicitudes() {
    return api.get('/ordenes-compra/solicitudes');
  },

  /** Solicitud de un título que aún no está en el catálogo. */
  solicitarNuevo({ Num_Ejemplares, ...libro }) {
    return api.post('/ordenes-compra', { librosNuevos: [{ nuevo: libro, Num_Ejemplares }] });
  },

  /** Solicitud de más copias de un libro registrado. */
  solicitarCopias(idLibro, Num_Ejemplares) {
    return api.post('/ordenes-compra', { librosExistentes: [{ id_libro: idLibro, Num_Ejemplares }] });
  },
};

export const PanelModel = {
  resumen() {
    return api.get('/panel');
  },
};
