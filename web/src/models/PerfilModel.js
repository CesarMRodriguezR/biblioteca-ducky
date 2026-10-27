import { api } from './apiClient';

export const PerfilModel = {
  listar() {
    return api.get('/perfiles');
  },

  funciones() {
    return api.get('/funciones', { limit: 200 });
  },

  asignarFunciones(idPerfil, funciones) {
    return api.put(`/perfiles/${idPerfil}/funciones`, { funciones });
  },
};
