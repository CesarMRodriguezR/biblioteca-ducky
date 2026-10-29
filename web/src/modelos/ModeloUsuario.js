/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ModeloUsuario.js
 * Función: Usuarios: consulta, cambio, y alta y baja según la lista que se genera con CIAA y
 *          Empleados.
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
 *     Módulo             Objetivo
 *     ModeloUsuario      Acceso a los usuarios
 *     ContrasenaValida   Regla de contraseña del prototipo: 8+ caracteres, una…
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
 * Módulo: ModeloUsuario
 * Objetivo: Acceso a los usuarios.
 */
export const ModeloUsuario = {
  /*
   * Función: Listar
   * Objetivo: Pedir los usuarios válidos con búsqueda y paginación.
   * Entrada: { q, limit?, offset? } (opcional)
   * Salida: Promesa con la respuesta de la API
   */
  Listar({ q: texto_busqueda, limit = 7, offset = 0 } = {})
  {
    return ClienteApi.Obtener('/usuarios', { q: texto_busqueda, limit, offset });
  },

  /*
   * Función: Obtener
   * Objetivo: Pedir un usuario por su id.
   * Entrada: id
   * Salida: Promesa con la respuesta de la API
   */
  Obtener(id)
  {
    return ClienteApi.Obtener(`/usuarios/${id}`);
  },

  /*
   * Función: PorMatricula
   * Objetivo: Pedir un usuario por su matrícula o número de nómina.
   * Entrada: matricula
   * Salida: Promesa con la respuesta de la API
   */
  PorMatricula(matricula)
  {
    return ClienteApi.Obtener(`/usuarios/matricula/${encodeURIComponent(matricula.trim())}`);
  },

  /*
   * Función: Actualizar
   * Objetivo: Guardar los cambios de un usuario.
   * Entrada: id, datos
   * Salida: Promesa con la respuesta de la API
   */
  Actualizar(id, datos)
  {
    return ClienteApi.Reemplazar(`/usuarios/${id}`, datos);
  },

  /*
   * Función: GenerarLista
   * Objetivo: Pedir la lista de altas y bajas que la API arma con CIAA y Empleados.
   * Entrada: Ninguna
   * Salida: Promesa con { generado_el, fuentes, altas: { validos, errores }, bajas }
   */
  GenerarLista()
  {
    return ClienteApi.Obtener('/usuarios/lista');
  },

  /*
   * Función: CrearDesdeLista
   * Objetivo: Crear las cuentas elegidas con su perfil.
   * Entrada: cuentas ([{ Matricula_Nomina, id_perfil }])
   * Salida: Promesa con la respuesta de la API
   */
  CrearDesdeLista(cuentas)
  {
    return ClienteApi.Enviar('/usuarios/carga', { cuentas });
  },

  /*
   * Función: DarDeBaja
   * Objetivo: Dar de baja a los usuarios elegidos.
   * Entrada: ids
   * Salida: Promesa con la respuesta de la API
   */
  DarDeBaja(ids)
  {
    return ClienteApi.Enviar('/usuarios/bajas', { ids });
  },
};

/*
 * Función: ContrasenaValida
 * Objetivo: Regla de contraseña del prototipo: 8+ caracteres, una mayúscula y un número.
 * Entrada: valor
 * Salida: true si cumple la regla
 */
export function ContrasenaValida(valor)
{
  return valor.length >= 8 && /[A-ZÁÉÍÓÚÑ]/.test(valor) && /\d/.test(valor);
}
