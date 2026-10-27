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
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validar } from '../middlewares/validar.js';
import { autenticar, requiereFuncion as puede } from '../middlewares/auth.js';
import { esquemas as s } from '../validators/esquemas.js';

import { AuthController } from '../controllers/AuthController.js';
import { UsuarioController, PerfilController } from '../controllers/UsuarioController.js';
import { LibroController } from '../controllers/LibroController.js';
import { PrestamoController, MultaController, ListaEsperaController } from '../controllers/CirculacionController.js';
import { OrdenCompraController } from '../controllers/AdquisicionController.js';
import { ChatbotController } from '../controllers/ChatbotController.js';
import { PanelController } from '../controllers/PanelController.js';
import { crudController } from '../controllers/crudController.js';
import { EditorialModel, AutorModel, TemaModel, FuncionModel, PoliticaModel, NuevoLibroModel, FuenteChatbotModel } from '../models/catalogos.js';

const router = Router();
const conId = validar(s.idParam, 'params');

/**
 * Registra las rutas CRUD de un catálogo simple.
 * lectura: funciones que pueden consultar; escritura: funciones que pueden editar.
 */
function rutasCatalogo(ruta, model, nombre, esquema, { lectura, escritura }) {
  const c = crudController(model, nombre);
  router.get(ruta, autenticar, puede(...lectura), validar(s.paginacion, 'query'), h(c.listar));
  router.get(`${ruta}/:id`, autenticar, puede(...lectura), conId, h(c.obtener));
  router.post(ruta, autenticar, puede(...escritura), validar(esquema), h(c.crear));
  router.put(`${ruta}/:id`, autenticar, puede(...escritura), conId, validar(esquema.partial()), h(c.actualizar));
  router.delete(`${ruta}/:id`, autenticar, puede(...escritura), conId, h(c.eliminar));
}

// --- Salud -------------------------------------------------------------
router.get('/salud', (_req, res) => res.json({ estado: 'ok' }));

// --- Panel (inicio del administrador) ----------------------------------
router.get('/panel', autenticar, puede('gestionar_usuarios'), h(PanelController.resumen));

// --- Autenticación -----------------------------------------------------
router.post('/auth/login', validar(s.login), h(AuthController.login));
router.get('/auth/me', autenticar, h(AuthController.me));
router.put('/auth/contrasena', autenticar, validar(s.cambiarContrasena), h(AuthController.cambiarContrasena));

// --- Gestión de usuarios ----------------------------------------------
const admUsuarios = puede('gestionar_usuarios');
const consultaUsuarios = puede('gestionar_usuarios', 'gestionar_prestamos', 'gestionar_multas');
router.get('/usuarios', autenticar, consultaUsuarios, validar(s.usuarioFiltros, 'query'), h(UsuarioController.listar));
router.get('/usuarios/matricula/:matricula', autenticar, consultaUsuarios, h(UsuarioController.porMatricula));
router.post('/usuarios/carga/validar', autenticar, admUsuarios, validar(s.cargaValidar), h(UsuarioController.validarLista));
router.post('/usuarios/carga', autenticar, admUsuarios, validar(s.cargaConfirmar), h(UsuarioController.crearDesdeLista));
router.post('/usuarios/bajas/revisar', autenticar, admUsuarios, validar(s.bajasRevisar), h(UsuarioController.revisarBajas));
router.post('/usuarios/bajas', autenticar, admUsuarios, validar(s.bajasConfirmar), h(UsuarioController.darDeBaja));
router.get('/usuarios/:id', autenticar, consultaUsuarios, conId, h(UsuarioController.obtener));
router.post('/usuarios', autenticar, admUsuarios, validar(s.usuarioCrear), h(UsuarioController.crear));
router.put('/usuarios/:id', autenticar, admUsuarios, conId, validar(s.usuarioActualizar), h(UsuarioController.actualizar));

router.get('/perfiles', autenticar, admUsuarios, h(PerfilController.listar));
router.get('/perfiles/:id', autenticar, admUsuarios, conId, h(PerfilController.obtener));
router.post('/perfiles', autenticar, admUsuarios, validar(s.perfil), h(PerfilController.crear));
router.put('/perfiles/:id', autenticar, admUsuarios, conId, validar(s.perfil.partial()), h(PerfilController.actualizar));
router.delete('/perfiles/:id', autenticar, admUsuarios, conId, h(PerfilController.eliminar));
router.put('/perfiles/:id/funciones', autenticar, admUsuarios, conId, validar(s.perfilFunciones),
  h(PerfilController.asignarFunciones));

rutasCatalogo('/funciones', FuncionModel, 'Función', s.funcion, {
  lectura: ['gestionar_usuarios'], escritura: ['gestionar_usuarios'],
});

// --- Catálogo de libros -----------------------------------------------
const consultaCatalogo = ['buscar_libros', 'gestionar_libros'];
const admLibros = puede('gestionar_libros');

const busquedaLibros = validar(s.libroBusqueda, 'query');
router.get('/libros', autenticar, puede(...consultaCatalogo), busquedaLibros, h(LibroController.buscar));
router.get('/libros/listado', autenticar, puede('generar_listado'), busquedaLibros, h(LibroController.listado));
router.get('/libros/listado.pdf', autenticar, puede('generar_listado'), busquedaLibros, h(LibroController.listadoPdf));
router.get('/libros/isbn/:isbn', autenticar, admLibros, validar(s.isbnParam, 'params'), h(LibroController.porIsbn));
router.get('/libros/:id', autenticar, puede(...consultaCatalogo), conId, h(LibroController.obtener));
router.post('/libros', autenticar, admLibros, validar(s.libroCrear), h(LibroController.crear));
router.put('/libros/:id', autenticar, admLibros, conId, validar(s.libroActualizar), h(LibroController.actualizar));
router.patch('/libros/:id/estatus', autenticar, admLibros, conId, validar(s.libroEstatus), h(LibroController.cambiarEstatus));

const conCopia = validar(s.ejemplarParams, 'params');
router.get('/libros/:id/ejemplares', autenticar, admLibros, conId, h(LibroController.listarEjemplares));
router.post('/libros/:id/ejemplares', autenticar, admLibros, conId, validar(s.ejemplaresAgregar),
  h(LibroController.agregarEjemplares));
router.put('/libros/:id/ejemplares/:numCopia', autenticar, admLibros, conCopia,
  validar(s.ejemplarActualizar), h(LibroController.actualizarEjemplar));
router.post('/libros/:id/ejemplares/:numCopia/baja', autenticar, admLibros, conCopia,
  validar(s.ejemplarBaja), h(LibroController.retirarEjemplar));

rutasCatalogo('/editoriales', EditorialModel, 'Editorial', s.editorial,
  { lectura: [...consultaCatalogo, 'solicitar_compra'], escritura: ['gestionar_libros', 'solicitar_compra'] });
rutasCatalogo('/autores', AutorModel, 'Autor', s.autor,
  { lectura: consultaCatalogo, escritura: ['gestionar_libros'] });
rutasCatalogo('/temas', TemaModel, 'Tema', s.tema,
  { lectura: consultaCatalogo, escritura: ['gestionar_libros'] });

// --- Circulación -------------------------------------------------------
router.get('/prestamos', autenticar, puede('solicitar_prestamo', 'gestionar_prestamos'),
  validar(s.prestamoFiltros, 'query'), h(PrestamoController.listar));
router.get('/prestamos/:id', autenticar, puede('solicitar_prestamo', 'gestionar_prestamos'),
  conId, h(PrestamoController.obtener));
router.post('/prestamos', autenticar, puede('solicitar_prestamo', 'gestionar_prestamos'),
  validar(s.prestamoCrear), h(PrestamoController.crear));
router.post('/prestamos/:id/devolucion', autenticar, puede('registrar_devolucion'),
  conId, validar(s.devolucion), h(PrestamoController.devolver));
router.post('/prestamos/:id/renovacion', autenticar, puede('renovar_prestamo', 'gestionar_prestamos'),
  conId, h(PrestamoController.renovar));

router.get('/multas', autenticar, validar(s.multaFiltros, 'query'), h(MultaController.listar));
router.get('/multas/:id', autenticar, conId, h(MultaController.obtener));
router.post('/multas', autenticar, puede('gestionar_multas'), validar(s.multaCrear), h(MultaController.crear));
router.post('/multas/:id/pago', autenticar, puede('gestionar_multas'), conId, validar(s.multaPago),
  h(MultaController.pagar));

router.get('/lista-espera', autenticar, puede('lista_espera', 'gestionar_prestamos'),
  validar(s.listaEsperaFiltros, 'query'), h(ListaEsperaController.listar));
router.post('/lista-espera', autenticar, puede('lista_espera'), validar(s.listaEsperaCrear),
  h(ListaEsperaController.inscribir));
router.delete('/lista-espera/:id', autenticar, puede('lista_espera', 'gestionar_prestamos'),
  conId, h(ListaEsperaController.cancelar));

// --- Adquisiciones -----------------------------------------------------
rutasCatalogo('/nuevos-libros', NuevoLibroModel, 'Libro nuevo', s.nuevoLibro,
  { lectura: ['solicitar_compra', 'gestionar_compras'], escritura: ['solicitar_compra', 'gestionar_compras'] });

router.get('/ordenes-compra', autenticar, puede('solicitar_compra', 'gestionar_compras'),
  validar(s.ordenFiltros, 'query'), h(OrdenCompraController.listar));
router.get('/ordenes-compra/solicitudes', autenticar, puede('solicitar_compra', 'gestionar_compras'),
  h(OrdenCompraController.solicitudes));
router.get('/ordenes-compra/:id', autenticar, puede('solicitar_compra', 'gestionar_compras'),
  conId, h(OrdenCompraController.obtener));
router.post('/ordenes-compra', autenticar, puede('solicitar_compra'), validar(s.ordenCrear),
  h(OrdenCompraController.crear));
router.patch('/ordenes-compra/:id/estatus', autenticar, puede('gestionar_compras'), conId,
  validar(s.ordenEstatus), h(OrdenCompraController.cambiarEstatus));

// --- Políticas ---------------------------------------------------------
{
  const c = crudController(PoliticaModel, 'Política');
  router.get('/politicas', validar(s.paginacion, 'query'), h(c.listar)); // pública
  router.get('/politicas/:id', conId, h(c.obtener));
  router.post('/politicas', autenticar, puede('gestionar_politicas'), validar(s.politica), h(c.crear));
  router.put('/politicas/:id', autenticar, puede('gestionar_politicas'), conId, validar(s.politica), h(c.actualizar));
  router.delete('/politicas/:id', autenticar, puede('gestionar_politicas'), conId, h(c.eliminar));
}

// --- Chatbot -----------------------------------------------------------
router.post('/chatbot/preguntar', autenticar, puede('usar_chatbot'), validar(s.chatbotPreguntar),
  h(ChatbotController.preguntar));
router.get('/chatbot/frecuentes', autenticar, puede('usar_chatbot'), h(ChatbotController.frecuentes));

const admChatbot = puede('gestionar_chatbot');
router.get('/chatbot/preguntas', autenticar, admChatbot, h(ChatbotController.listar));
router.get('/chatbot/preguntas/:id', autenticar, admChatbot, conId, h(ChatbotController.obtener));
router.post('/chatbot/preguntas', autenticar, admChatbot, validar(s.chatbotPreguntaCrear), h(ChatbotController.crear));
router.put('/chatbot/preguntas/:id', autenticar, admChatbot, conId, validar(s.chatbotPreguntaActualizar),
  h(ChatbotController.actualizar));
router.delete('/chatbot/preguntas/:id', autenticar, admChatbot, conId, h(ChatbotController.eliminar));

rutasCatalogo('/chatbot/fuentes', FuenteChatbotModel, 'Fuente', s.fuente,
  { lectura: ['gestionar_chatbot'], escritura: ['gestionar_chatbot'] });

export { router };
