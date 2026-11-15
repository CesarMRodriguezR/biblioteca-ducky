/*
 * ******************************************************************
 * Nombre del programa: API-RUTAS · rutas.js
 * Función: Registrar las rutas de la API: autenticación, permiso, validación y controlador de
 *          cada una.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Peticiones HTTP bajo /api
 * Salida: Router de Express
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo          Objetivo
 *     RutasCatalogo   Registra las rutas CRUD de un catálogo simple. lectura:…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Cada ruta declara en orden: Autenticar, Puede(funciones...), Validar(esquema) y
 *     ManejarAsincrono(controlador).
 * (2) Las funciones (permisos) son los códigos de la tabla Funciones; un perfil sin la función
 *     recibe 403.
 * ******************************************************************
 */

import expressPaquete from 'express';
const { Router } = expressPaquete;
import { ManejarAsincrono } from '../utilidades/ManejarAsincrono.js';
import { Validar } from '../intermediarios/Validar.js';
import {
  Autenticar,
  AutenticarTesoreria,
  RequiereFuncion as Puede,
} from '../intermediarios/autenticacion.js';
import { esquemas } from '../validaciones/esquemas.js';

import { ControladorAutenticacion } from '../controladores/ControladorAutenticacion.js';
import { ControladorUsuarios, ControladorPerfiles } from '../controladores/ControladorUsuarios.js';
import { ControladorLibros } from '../controladores/ControladorLibros.js';
import { ControladorOrdenesCompra } from '../controladores/ControladorOrdenesCompra.js';
import { ControladorPanel } from '../controladores/ControladorPanel.js';
import { ControladorPrestamos } from '../controladores/ControladorPrestamos.js';
import { ControladorDevoluciones } from '../controladores/ControladorDevoluciones.js';
import { ControladorAsistente } from '../controladores/ControladorAsistente.js';
import { CrearControladorCrud } from '../controladores/CrearControladorCrud.js';
import {
  ModeloEditorial,
  ModeloAutor,
  ModeloTema,
  ModeloFuncion,
  ModeloNuevoLibro,
} from '../modelos/ModelosCatalogo.js';

const rutas = Router();
const con_id = Validar(esquemas.id_param, 'params');

/*
 * Función: RutasCatalogo
 * Objetivo: Registra las rutas CRUD de un catálogo simple. lectura: funciones que pueden
 *           consultar; escritura: funciones que pueden editar.
 * Entrada: ruta, modelo, nombre, esquema, { lectura, escritura }
 * Salida: Ninguna (registra las rutas en el router)
 */
function RutasCatalogo(ruta, modelo, nombre, esquema, { lectura, escritura })
{
  const controlador = CrearControladorCrud(modelo, nombre);
  rutas.get(
    ruta,
    Autenticar,
    Puede(...lectura),
    Validar(esquemas.paginacion, 'query'),
    ManejarAsincrono(controlador.Listar),
  );
  rutas.get(`${ruta}/:id`, Autenticar, Puede(...lectura), con_id, ManejarAsincrono(controlador.Obtener));
  rutas.post(
    ruta,
    Autenticar,
    Puede(...escritura),
    Validar(esquema),
    ManejarAsincrono(controlador.Crear),
  );
  rutas.put(
    `${ruta}/:id`,
    Autenticar,
    Puede(...escritura),
    con_id,
    Validar(esquema.partial()),
    ManejarAsincrono(controlador.Actualizar),
  );
  rutas.delete(
    `${ruta}/:id`,
    Autenticar,
    Puede(...escritura),
    con_id,
    ManejarAsincrono(controlador.Eliminar),
  );
}

/*------------------------------------------------------------------
 * Sección: Salud
 * Objetivo: Ruta pública para comprobar que la API responde.
 *------------------------------------------------------------------*/
rutas.get('/salud', (_req, res) => res.json({ estado: 'ok' }));

/*------------------------------------------------------------------
 * Sección: Panel (inicio del administrador)
 * Objetivo: Indicadores y actividad reciente del panel.
 *------------------------------------------------------------------*/
rutas.get(
  '/panel',
  Autenticar,
  Puede('gestionar_usuarios'),
  ManejarAsincrono(ControladorPanel.Resumen),
);

/*------------------------------------------------------------------
 * Sección: Autenticación
 * Objetivo: Inicio de sesión, datos de la sesión y cambio de contraseña.
 *------------------------------------------------------------------*/
rutas.post(
  '/auth/login',
  Validar(esquemas.login),
  ManejarAsincrono(ControladorAutenticacion.IniciarSesion),
);
rutas.get('/auth/me', Autenticar, ManejarAsincrono(ControladorAutenticacion.ObtenerSesion));
rutas.put(
  '/auth/contrasena',
  Autenticar,
  Validar(esquemas.cambiar_contrasena),
  ManejarAsincrono(ControladorAutenticacion.CambiarContrasena),
);

/*------------------------------------------------------------------
 * Sección: Gestión de usuarios
 * Objetivo: Consulta y cambio de usuarios, alta y baja según CIAA y Empleados, perfiles y
 *           funciones.
 *------------------------------------------------------------------*/
const adm_usuarios = Puede('gestionar_usuarios');
const consulta_usuarios = Puede('gestionar_usuarios', 'gestionar_libros');
rutas.get(
  '/usuarios',
  Autenticar,
  consulta_usuarios,
  Validar(esquemas.usuario_filtros, 'query'),
  ManejarAsincrono(ControladorUsuarios.Listar),
);
rutas.get(
  '/usuarios/matricula/:matricula',
  Autenticar,
  consulta_usuarios,
  ManejarAsincrono(ControladorUsuarios.PorMatricula),
);
rutas.get(
  '/usuarios/lista',
  Autenticar,
  adm_usuarios,
  ManejarAsincrono(ControladorUsuarios.GenerarLista),
);
rutas.post(
  '/usuarios/carga',
  Autenticar,
  adm_usuarios,
  Validar(esquemas.carga_confirmar),
  ManejarAsincrono(ControladorUsuarios.CrearDesdeLista),
);
rutas.post(
  '/usuarios/bajas',
  Autenticar,
  adm_usuarios,
  Validar(esquemas.bajas_confirmar),
  ManejarAsincrono(ControladorUsuarios.DarDeBaja),
);
rutas.get(
  '/usuarios/:id',
  Autenticar,
  consulta_usuarios,
  con_id,
  ManejarAsincrono(ControladorUsuarios.Obtener),
);
rutas.post(
  '/usuarios',
  Autenticar,
  adm_usuarios,
  Validar(esquemas.usuario_crear),
  ManejarAsincrono(ControladorUsuarios.Crear),
);
rutas.put(
  '/usuarios/:id',
  Autenticar,
  adm_usuarios,
  con_id,
  Validar(esquemas.usuario_actualizar),
  ManejarAsincrono(ControladorUsuarios.Actualizar),
);

rutas.get('/perfiles', Autenticar, adm_usuarios, ManejarAsincrono(ControladorPerfiles.Listar));
rutas.get(
  '/perfiles/:id',
  Autenticar,
  adm_usuarios,
  con_id,
  ManejarAsincrono(ControladorPerfiles.obtener),
);
rutas.post(
  '/perfiles',
  Autenticar,
  adm_usuarios,
  Validar(esquemas.perfil),
  ManejarAsincrono(ControladorPerfiles.crear),
);
rutas.put(
  '/perfiles/:id',
  Autenticar,
  adm_usuarios,
  con_id,
  Validar(esquemas.perfil.partial()),
  ManejarAsincrono(ControladorPerfiles.actualizar),
);
rutas.delete(
  '/perfiles/:id',
  Autenticar,
  adm_usuarios,
  con_id,
  ManejarAsincrono(ControladorPerfiles.eliminar),
);
rutas.put(
  '/perfiles/:id/funciones',
  Autenticar,
  adm_usuarios,
  con_id,
  Validar(esquemas.perfil_funciones),
  ManejarAsincrono(ControladorPerfiles.AsignarFunciones),
);

RutasCatalogo('/funciones', ModeloFuncion, 'Función', esquemas.funcion, {
  lectura: ['gestionar_usuarios'],
  escritura: ['gestionar_usuarios'],
});

/*------------------------------------------------------------------
 * Sección: Catálogo de libros
 * Objetivo: Búsqueda, listado, ficha, alta, edición, estatus y copias de los libros;
 *           catálogos de editoriales, autores y temas.
 *------------------------------------------------------------------*/
const consulta_catalogo = ['buscar_libros', 'gestionar_libros'];
const adm_libros = Puede('gestionar_libros');

const busqueda_libros = Validar(esquemas.libro_busqueda, 'query');
rutas.get(
  '/libros',
  Autenticar,
  Puede(...consulta_catalogo),
  busqueda_libros,
  ManejarAsincrono(ControladorLibros.Buscar),
);
rutas.get(
  '/libros/listado',
  Autenticar,
  Puede('gestionar_libros'),
  busqueda_libros,
  ManejarAsincrono(ControladorLibros.Listado),
);
rutas.get(
  '/libros/listado.pdf',
  Autenticar,
  Puede('gestionar_libros'),
  busqueda_libros,
  ManejarAsincrono(ControladorLibros.ListadoPdf),
);
rutas.get(
  '/libros/isbn/:isbn',
  Autenticar,
  adm_libros,
  Validar(esquemas.isbn_param, 'params'),
  ManejarAsincrono(ControladorLibros.PorIsbn),
);
rutas.get(
  '/libros/solicitados/:isbn',
  Autenticar,
  adm_libros,
  Validar(esquemas.isbn_param, 'params'),
  ManejarAsincrono(ControladorLibros.SolicitadoPorIsbn),
);
rutas.get(
  '/libros/:id',
  Autenticar,
  Puede(...consulta_catalogo),
  con_id,
  ManejarAsincrono(ControladorLibros.Obtener),
);
rutas.post(
  '/libros',
  Autenticar,
  adm_libros,
  Validar(esquemas.libro_crear),
  ManejarAsincrono(ControladorLibros.Crear),
);
rutas.put(
  '/libros/:id',
  Autenticar,
  adm_libros,
  con_id,
  Validar(esquemas.libro_actualizar),
  ManejarAsincrono(ControladorLibros.Actualizar),
);
rutas.patch(
  '/libros/:id/estatus',
  Autenticar,
  adm_libros,
  con_id,
  Validar(esquemas.libro_estatus),
  ManejarAsincrono(ControladorLibros.CambiarEstatus),
);

const con_copia = Validar(esquemas.ejemplar_params, 'params');
rutas.get(
  '/libros/:id/ejemplares',
  Autenticar,
  adm_libros,
  con_id,
  ManejarAsincrono(ControladorLibros.ListarEjemplares),
);
rutas.post(
  '/libros/:id/ejemplares',
  Autenticar,
  adm_libros,
  con_id,
  Validar(esquemas.ejemplares_agregar),
  ManejarAsincrono(ControladorLibros.AgregarEjemplares),
);
rutas.put(
  '/libros/:id/ejemplares/:num_copia',
  Autenticar,
  adm_libros,
  con_copia,
  Validar(esquemas.ejemplar_actualizar),
  ManejarAsincrono(ControladorLibros.ActualizarEjemplar),
);
rutas.post(
  '/libros/:id/ejemplares/:num_copia/baja',
  Autenticar,
  adm_libros,
  con_copia,
  Validar(esquemas.ejemplar_baja),
  ManejarAsincrono(ControladorLibros.RetirarEjemplar),
);

RutasCatalogo('/editoriales', ModeloEditorial, 'Editorial', esquemas.editorial, {
  lectura: consulta_catalogo,
  escritura: ['gestionar_libros'],
});
RutasCatalogo('/autores', ModeloAutor, 'Autor', esquemas.autor, {
  lectura: consulta_catalogo,
  escritura: ['gestionar_libros'],
});
RutasCatalogo('/temas', ModeloTema, 'Tema', esquemas.tema, {
  lectura: consulta_catalogo,
  escritura: ['gestionar_libros'],
});

/*------------------------------------------------------------------
 * Sección: Adquisiciones
 * Objetivo: Libros nuevos y órdenes de compra.
 *------------------------------------------------------------------*/
RutasCatalogo('/nuevos-libros', ModeloNuevoLibro, 'Libro nuevo', esquemas.nuevo_libro, {
  lectura: ['gestionar_libros'],
  escritura: ['gestionar_libros'],
});

rutas.get(
  '/ordenes-compra',
  Autenticar,
  Puede('gestionar_libros'),
  Validar(esquemas.orden_filtros, 'query'),
  ManejarAsincrono(ControladorOrdenesCompra.Listar),
);
rutas.get(
  '/ordenes-compra/solicitudes',
  Autenticar,
  Puede('gestionar_libros'),
  ManejarAsincrono(ControladorOrdenesCompra.Solicitudes),
);
rutas.get(
  '/ordenes-compra/:id',
  Autenticar,
  Puede('gestionar_libros'),
  con_id,
  ManejarAsincrono(ControladorOrdenesCompra.Obtener),
);
rutas.post(
  '/ordenes-compra',
  Autenticar,
  Puede('gestionar_libros'),
  Validar(esquemas.orden_crear),
  ManejarAsincrono(ControladorOrdenesCompra.Crear),
);
rutas.patch(
  '/ordenes-compra/:id/estatus',
  Autenticar,
  Puede('gestionar_libros'),
  con_id,
  Validar(esquemas.orden_estatus),
  ManejarAsincrono(ControladorOrdenesCompra.CambiarEstatus),
);
// Aviso de Tesorería (sistema externo): aceptó o rechazó una solicitud.
rutas.post(
  '/tesoreria/notificaciones',
  AutenticarTesoreria,
  Validar(esquemas.respuesta_tesoreria),
  ManejarAsincrono(ControladorOrdenesCompra.RecibirRespuestaTesoreria),
);
// Aviso de Tesorería (sistema externo): se pagó una multa en caja.
rutas.post(
  '/tesoreria/pagos',
  AutenticarTesoreria,
  Validar(esquemas.pago_tesoreria),
  ManejarAsincrono(ControladorDevoluciones.RecibirPago),
);

/*------------------------------------------------------------------
 * Sección: Préstamos
 * Objetivo: Situación del lector, registro, recibo, renovación, vencidos y lista de espera.
 *------------------------------------------------------------------*/
const prestar = Puede('prestar_libros');
const devolver = Puede('devolver_libros');
const circulacion = Puede('prestar_libros', 'devolver_libros');
rutas.get(
  '/circulacion/lectores/:matricula',
  Autenticar,
  circulacion,
  Validar(esquemas.matricula_param, 'params'),
  ManejarAsincrono(ControladorPrestamos.Lector),
);
rutas.get('/prestamos/resumen', Autenticar, prestar, ManejarAsincrono(ControladorPrestamos.Resumen));
rutas.get(
  '/prestamos/vencidos',
  Autenticar,
  circulacion,
  Validar(esquemas.vencidos_filtros, 'query'),
  ManejarAsincrono(ControladorPrestamos.Vencidos),
);
rutas.get(
  '/prestamos/libros/:isbn',
  Autenticar,
  prestar,
  Validar(esquemas.isbn_param, 'params'),
  ManejarAsincrono(ControladorPrestamos.Libro),
);
rutas.post(
  '/prestamos',
  Autenticar,
  prestar,
  Validar(esquemas.prestamo_crear),
  ManejarAsincrono(ControladorPrestamos.Registrar),
);
rutas.get('/prestamos/:id', Autenticar, prestar, con_id, ManejarAsincrono(ControladorPrestamos.Recibo));
rutas.get(
  '/prestamos/:id/recibo.pdf',
  Autenticar,
  prestar,
  con_id,
  ManejarAsincrono(ControladorPrestamos.ReciboPdf),
);
rutas.post(
  '/prestamos/:id/renovacion',
  Autenticar,
  prestar,
  con_id,
  ManejarAsincrono(ControladorPrestamos.Renovar),
);
rutas.post(
  '/prestamos/:id/perdido',
  Autenticar,
  devolver,
  con_id,
  ManejarAsincrono(ControladorDevoluciones.ReportarPerdido),
);
rutas.get(
  '/lista-espera',
  Autenticar,
  prestar,
  Validar(esquemas.lista_espera_busqueda, 'query'),
  ManejarAsincrono(ControladorPrestamos.ListaEspera),
);
rutas.post(
  '/lista-espera',
  Autenticar,
  prestar,
  Validar(esquemas.lista_espera_agregar),
  ManejarAsincrono(ControladorPrestamos.AgregarEspera),
);
rutas.delete(
  '/lista-espera/:id',
  Autenticar,
  prestar,
  con_id,
  ManejarAsincrono(ControladorPrestamos.QuitarEspera),
);

/*------------------------------------------------------------------
 * Sección: Devoluciones, multas y adeudos
 * Objetivo: Registro de devoluciones, multas, lista de alumnos deudores y pagos de Tesorería.
 *------------------------------------------------------------------*/
rutas.get(
  '/devoluciones/resumen',
  Autenticar,
  devolver,
  ManejarAsincrono(ControladorDevoluciones.Resumen),
);
rutas.post(
  '/devoluciones',
  Autenticar,
  devolver,
  Validar(esquemas.devolucion_crear),
  ManejarAsincrono(ControladorDevoluciones.Registrar),
);
rutas.get(
  '/multas/resumen',
  Autenticar,
  devolver,
  ManejarAsincrono(ControladorDevoluciones.ResumenMultas),
);
const con_periodo = Validar(esquemas.deudores_periodo, 'query');
rutas.get(
  '/multas/deudores',
  Autenticar,
  devolver,
  con_periodo,
  ManejarAsincrono(ControladorDevoluciones.Deudores),
);
rutas.get(
  '/multas/deudores.pdf',
  Autenticar,
  devolver,
  con_periodo,
  ManejarAsincrono(ControladorDevoluciones.DeudoresPdf),
);
rutas.post(
  '/multas/deudores/envio',
  Autenticar,
  devolver,
  Validar(esquemas.deudores_periodo),
  ManejarAsincrono(ControladorDevoluciones.EnviarDeudores),
);
rutas.get('/multas/pagos', Autenticar, devolver, ManejarAsincrono(ControladorDevoluciones.Pagos));
rutas.post(
  '/multas',
  Autenticar,
  devolver,
  Validar(esquemas.multa_crear),
  ManejarAsincrono(ControladorDevoluciones.GenerarMulta),
);
rutas.get(
  '/multas/:id',
  Autenticar,
  devolver,
  con_id,
  ManejarAsincrono(ControladorDevoluciones.ObtenerMulta),
);
rutas.get(
  '/multas/:id/comprobante.pdf',
  Autenticar,
  devolver,
  con_id,
  ManejarAsincrono(ControladorDevoluciones.MultaPdf),
);

/*------------------------------------------------------------------
 * Sección: Asistente Biblio
 * Objetivo: Preguntas frecuentes según las funciones del perfil.
 *------------------------------------------------------------------*/
const asistente = Puede('usar_asistente');
rutas.get(
  '/asistente/preguntas',
  Autenticar,
  asistente,
  ManejarAsincrono(ControladorAsistente.Preguntas),
);
rutas.get(
  '/asistente/preguntas/:id',
  Autenticar,
  asistente,
  con_id,
  ManejarAsincrono(ControladorAsistente.Responder),
);

export { rutas };
