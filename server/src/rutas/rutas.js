/**
 * Rutas de la API. Cada ruta declara: autenticación, permiso (función del
 * perfil), validación y controlador. Mapa de módulos del diagrama:
 *   Gestión de Usuarios  → /auth, /usuarios, /perfiles, /funciones
 *   Panel                → /panel (indicadores y actividad reciente)
 *   Gestión de Libros    → /libros, /libros/:id/ejemplares, /editoriales,
 *                          /autores, /temas, /nuevos-libros, /ordenes-compra
 *   Búsqueda Libros      → GET /libros, GET /libros/:id, /libros/listado(.pdf)
 *   Préstamo Libros      → /prestamos, /lista-espera
 *   Devolución Préstamos → /prestamos/:id/devolucion, /multas
 *   Chatbot / Políticas  → /chatbot, /politicas
 */
import expressPaquete from 'express';
const { Router } = expressPaquete;
import { ManejarAsincrono } from '../utilidades/ManejarAsincrono.js';
import { Validar } from '../intermediarios/Validar.js';
import { Autenticar, RequiereFuncion as Puede } from '../intermediarios/autenticacion.js';
import { esquemas } from '../validaciones/esquemas.js';

import { ControladorAutenticacion } from '../controladores/ControladorAutenticacion.js';
import { ControladorUsuarios, ControladorPerfiles } from '../controladores/ControladorUsuarios.js';
import { ControladorLibros } from '../controladores/ControladorLibros.js';
import {
  ControladorPrestamos,
  ControladorMultas,
  ControladorListaEspera,
} from '../controladores/ControladorCirculacion.js';
import { ControladorOrdenesCompra } from '../controladores/ControladorOrdenesCompra.js';
import { ControladorChatbot } from '../controladores/ControladorChatbot.js';
import { ControladorPanel } from '../controladores/ControladorPanel.js';
import { CrearControladorCrud } from '../controladores/CrearControladorCrud.js';
import {
  ModeloEditorial,
  ModeloAutor,
  ModeloTema,
  ModeloFuncion,
  ModeloPolitica,
  ModeloNuevoLibro,
  ModeloFuenteChatbot,
} from '../modelos/ModelosCatalogo.js';

const rutas = Router();
const con_id = Validar(esquemas.id_param, 'params');

/**
 * Registra las rutas CRUD de un catálogo simple.
 * lectura: funciones que pueden consultar; escritura: funciones que pueden editar.
 */
function RutasCatalogo(ruta, model, nombre, esquema, { lectura, escritura }) 
{
  const controlador = CrearControladorCrud(model, nombre);
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

// --- Salud -------------------------------------------------------------
rutas.get('/salud', (_req, res) => res.json({ estado: 'ok' }));

// --- Panel (inicio del administrador) ----------------------------------
rutas.get(
  '/panel',
  Autenticar,
  Puede('gestionar_usuarios'),
  ManejarAsincrono(ControladorPanel.Resumen),
);

// --- Autenticación -----------------------------------------------------
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

// --- Gestión de usuarios ----------------------------------------------
const adm_usuarios = Puede('gestionar_usuarios');
const consulta_usuarios = Puede('gestionar_usuarios', 'gestionar_prestamos', 'gestionar_multas');
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
rutas.post(
  '/usuarios/carga/validar',
  Autenticar,
  adm_usuarios,
  Validar(esquemas.carga_validar),
  ManejarAsincrono(ControladorUsuarios.ValidarLista),
);
rutas.post(
  '/usuarios/carga',
  Autenticar,
  adm_usuarios,
  Validar(esquemas.carga_confirmar),
  ManejarAsincrono(ControladorUsuarios.CrearDesdeLista),
);
rutas.post(
  '/usuarios/bajas/revisar',
  Autenticar,
  adm_usuarios,
  Validar(esquemas.bajas_revisar),
  ManejarAsincrono(ControladorUsuarios.RevisarBajas),
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

// --- Catálogo de libros -----------------------------------------------
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
  Puede('generar_listado'),
  busqueda_libros,
  ManejarAsincrono(ControladorLibros.Listado),
);
rutas.get(
  '/libros/listado.pdf',
  Autenticar,
  Puede('generar_listado'),
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
  lectura: [...consulta_catalogo, 'solicitar_compra'],
  escritura: ['gestionar_libros', 'solicitar_compra'],
});
RutasCatalogo('/autores', ModeloAutor, 'Autor', esquemas.autor, {
  lectura: consulta_catalogo,
  escritura: ['gestionar_libros'],
});
RutasCatalogo('/temas', ModeloTema, 'Tema', esquemas.tema, {
  lectura: consulta_catalogo,
  escritura: ['gestionar_libros'],
});

// --- Circulación -------------------------------------------------------
rutas.get(
  '/prestamos',
  Autenticar,
  Puede('solicitar_prestamo', 'gestionar_prestamos'),
  Validar(esquemas.prestamo_filtros, 'query'),
  ManejarAsincrono(ControladorPrestamos.Listar),
);
rutas.get(
  '/prestamos/:id',
  Autenticar,
  Puede('solicitar_prestamo', 'gestionar_prestamos'),
  con_id,
  ManejarAsincrono(ControladorPrestamos.Obtener),
);
rutas.post(
  '/prestamos',
  Autenticar,
  Puede('solicitar_prestamo', 'gestionar_prestamos'),
  Validar(esquemas.prestamo_crear),
  ManejarAsincrono(ControladorPrestamos.Crear),
);
rutas.post(
  '/prestamos/:id/devolucion',
  Autenticar,
  Puede('registrar_devolucion'),
  con_id,
  Validar(esquemas.devolucion),
  ManejarAsincrono(ControladorPrestamos.Devolver),
);
rutas.post(
  '/prestamos/:id/renovacion',
  Autenticar,
  Puede('renovar_prestamo', 'gestionar_prestamos'),
  con_id,
  ManejarAsincrono(ControladorPrestamos.Renovar),
);

rutas.get(
  '/multas',
  Autenticar,
  Validar(esquemas.multa_filtros, 'query'),
  ManejarAsincrono(ControladorMultas.Listar),
);
rutas.get('/multas/:id', Autenticar, con_id, ManejarAsincrono(ControladorMultas.Obtener));
rutas.post(
  '/multas',
  Autenticar,
  Puede('gestionar_multas'),
  Validar(esquemas.multa_crear),
  ManejarAsincrono(ControladorMultas.Crear),
);
rutas.post(
  '/multas/:id/pago',
  Autenticar,
  Puede('gestionar_multas'),
  con_id,
  Validar(esquemas.multa_pago),
  ManejarAsincrono(ControladorMultas.Pagar),
);

rutas.get(
  '/lista-espera',
  Autenticar,
  Puede('lista_espera', 'gestionar_prestamos'),
  Validar(esquemas.lista_espera_filtros, 'query'),
  ManejarAsincrono(ControladorListaEspera.Listar),
);
rutas.post(
  '/lista-espera',
  Autenticar,
  Puede('lista_espera'),
  Validar(esquemas.lista_espera_crear),
  ManejarAsincrono(ControladorListaEspera.Inscribir),
);
rutas.delete(
  '/lista-espera/:id',
  Autenticar,
  Puede('lista_espera', 'gestionar_prestamos'),
  con_id,
  ManejarAsincrono(ControladorListaEspera.Cancelar),
);

// --- Adquisiciones -----------------------------------------------------
RutasCatalogo('/nuevos-libros', ModeloNuevoLibro, 'Libro nuevo', esquemas.nuevo_libro, {
  lectura: ['solicitar_compra', 'gestionar_compras'],
  escritura: ['solicitar_compra', 'gestionar_compras'],
});

rutas.get(
  '/ordenes-compra',
  Autenticar,
  Puede('solicitar_compra', 'gestionar_compras'),
  Validar(esquemas.orden_filtros, 'query'),
  ManejarAsincrono(ControladorOrdenesCompra.Listar),
);
rutas.get(
  '/ordenes-compra/solicitudes',
  Autenticar,
  Puede('solicitar_compra', 'gestionar_compras'),
  ManejarAsincrono(ControladorOrdenesCompra.Solicitudes),
);
rutas.get(
  '/ordenes-compra/:id',
  Autenticar,
  Puede('solicitar_compra', 'gestionar_compras'),
  con_id,
  ManejarAsincrono(ControladorOrdenesCompra.Obtener),
);
rutas.post(
  '/ordenes-compra',
  Autenticar,
  Puede('solicitar_compra'),
  Validar(esquemas.orden_crear),
  ManejarAsincrono(ControladorOrdenesCompra.Crear),
);
rutas.patch(
  '/ordenes-compra/:id/estatus',
  Autenticar,
  Puede('gestionar_compras'),
  con_id,
  Validar(esquemas.orden_estatus),
  ManejarAsincrono(ControladorOrdenesCompra.CambiarEstatus),
);

// --- Políticas ---------------------------------------------------------
{
  const controlador = CrearControladorCrud(ModeloPolitica, 'Política');
  rutas.get('/politicas', Validar(esquemas.paginacion, 'query'), ManejarAsincrono(controlador.Listar)); // pública
  rutas.get('/politicas/:id', con_id, ManejarAsincrono(controlador.Obtener));
  rutas.post(
    '/politicas',
    Autenticar,
    Puede('gestionar_politicas'),
    Validar(esquemas.politica),
    ManejarAsincrono(controlador.Crear),
  );
  rutas.put(
    '/politicas/:id',
    Autenticar,
    Puede('gestionar_politicas'),
    con_id,
    Validar(esquemas.politica),
    ManejarAsincrono(controlador.Actualizar),
  );
  rutas.delete(
    '/politicas/:id',
    Autenticar,
    Puede('gestionar_politicas'),
    con_id,
    ManejarAsincrono(controlador.Eliminar),
  );
}

// --- Chatbot -----------------------------------------------------------
rutas.post(
  '/chatbot/preguntar',
  Autenticar,
  Puede('usar_chatbot'),
  Validar(esquemas.chatbot_preguntar),
  ManejarAsincrono(ControladorChatbot.Preguntar),
);
rutas.get(
  '/chatbot/frecuentes',
  Autenticar,
  Puede('usar_chatbot'),
  ManejarAsincrono(ControladorChatbot.Frecuentes),
);

const adm_chatbot = Puede('gestionar_chatbot');
rutas.get(
  '/chatbot/preguntas',
  Autenticar,
  adm_chatbot,
  ManejarAsincrono(ControladorChatbot.Listar),
);
rutas.get(
  '/chatbot/preguntas/:id',
  Autenticar,
  adm_chatbot,
  con_id,
  ManejarAsincrono(ControladorChatbot.Obtener),
);
rutas.post(
  '/chatbot/preguntas',
  Autenticar,
  adm_chatbot,
  Validar(esquemas.chatbot_pregunta_crear),
  ManejarAsincrono(ControladorChatbot.Crear),
);
rutas.put(
  '/chatbot/preguntas/:id',
  Autenticar,
  adm_chatbot,
  con_id,
  Validar(esquemas.chatbot_pregunta_actualizar),
  ManejarAsincrono(ControladorChatbot.Actualizar),
);
rutas.delete(
  '/chatbot/preguntas/:id',
  Autenticar,
  adm_chatbot,
  con_id,
  ManejarAsincrono(ControladorChatbot.Eliminar),
);

RutasCatalogo('/chatbot/fuentes', ModeloFuenteChatbot, 'Fuente', esquemas.fuente, {
  lectura: ['gestionar_chatbot'],
  escritura: ['gestionar_chatbot'],
});

export { rutas };
