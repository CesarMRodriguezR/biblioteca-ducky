/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL · ControladorPrestamos.js
 * Función: Préstamos: menú, situación del lector, libro por ISBN, registro, recibo (también en
 *          PDF), renovación, préstamos vencidos y lista de espera.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Peticiones HTTP enrutadas desde rutas/rutas.js
 * Salida: Respuestas HTTP en formato JSON o PDF
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                 Objetivo
 *     DatosRecibo            Armar el recibo de un préstamo con quien lo atiende
 *     ControladorPrestamos   Manejadores de préstamos y lista de espera
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no contiene SQL; usa los modelos de src/modelos.
 * (2) Cada método se registra en rutas/rutas.js envuelto en ManejarAsincrono, que envía los
 *     errores a ManejarErrores.
 * (3) Los permisos (prestar_libros o devolver_libros) se revisan antes y los datos llegan
 *     validados por los esquemas zod.
 * (4) Si una renovación genera multa, se intenta enviar a Tesorería; si no responde, queda
 *     pendiente de sincronizar (Pagos de Tesorería).
 * ******************************************************************
 */

import { ModeloPrestamo } from '../modelos/ModeloPrestamo.js';
import { ModeloListaEspera } from '../modelos/ModeloListaEspera.js';
import { ModeloTesoreria } from '../modelos/ModeloTesoreria.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { FechaCorta, FechaLarga } from '../utilidades/fechas.js';
import { GenerarDocumentoPdf } from '../utilidades/GenerarDocumentoPdf.js';
import { FormatoMoneda, REGLAS, TextoUbicacion } from '../utilidades/ReglasCirculacion.js';

/*
 * Función: DatosRecibo
 * Objetivo: Armar el recibo de un préstamo; «Atendió» es quien entrega el recibo.
 * Entrada: id_prestamo, usuario (sesión)
 * Salida: Promesa con el préstamo, Atendio y la nota del reglamento
 */
async function DatosRecibo(id_prestamo, usuario)
{
  const prestamo = await ModeloPrestamo.BuscarPorId(id_prestamo);
  if (!prestamo)
  {
    throw ErrorHttp.NoEncontrado('No existe un préstamo con ese folio.');
  }
  return {
    ...prestamo,
    Atendio: usuario.Nombre_Completo,
    Nota:
      `Por cada día de retraso se cobra una multa de ${FormatoMoneda(REGLAS.MULTA_POR_DIA)}. ` +
      `Puedes renovar hasta ${prestamo.Max_Renovaciones} veces en el mostrador de la biblioteca.`,
  };
}

/*
 * Módulo: ControladorPrestamos
 * Objetivo: Manejadores de préstamos y lista de espera.
 */
const ControladorPrestamos = {
  /*
   * Función: Resumen
   * Objetivo: GET /prestamos/resumen — indicadores y últimos préstamos del menú Préstamos.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Resumen(_req, res)
  {
    res.json(await ModeloPrestamo.Resumen());
  },

  /*
   * Función: Lector
   * Objetivo: GET /circulacion/lectores/:matricula — situación del lector: préstamos, multas y
   *           condiciones para pedir un libro.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Lector(req, res)
  {
    res.json(await ModeloPrestamo.Situacion(req.params.matricula));
  },

  /*
   * Función: Libro
   * Objetivo: GET /prestamos/libros/:isbn — libro con sus copias y cuáles se pueden prestar.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Libro(req, res)
  {
    res.json(await ModeloPrestamo.BuscarLibro(req.params.isbn));
  },

  /*
   * Función: Registrar
   * Objetivo: POST /prestamos — registrar un préstamo.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: 201 con { prestamo, lista_espera }
   */
  async Registrar(req, res)
  {
    res.status(201).json(await ModeloPrestamo.Registrar(req.body));
  },

  /*
   * Función: Recibo
   * Objetivo: GET /prestamos/:id — datos del recibo de un préstamo.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Recibo(req, res)
  {
    res.json(await DatosRecibo(req.params.id, req.usuario));
  },

  /*
   * Función: ReciboPdf
   * Objetivo: GET /prestamos/:id/recibo.pdf — el recibo como archivo PDF.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con el PDF del recibo
   */
  async ReciboPdf(req, res)
  {
    const recibo = await DatosRecibo(req.params.id, req.usuario);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Recibo_${recibo.Folio}.pdf"`);
    GenerarDocumentoPdf({
      titulo: 'Recibo de préstamo',
      seccion: 'Biblioteca · Préstamos',
      generado: `Generado el ${FechaCorta(recibo.Fecha_Prestamo)} · ${recibo.Atendio}`,
      folio: recibo.Folio,
      renglones: [
        ['Lector', recibo.Nombre_Completo],
        [
          recibo.Nombre_Rol === 'Alumno' ? 'Matrícula' : 'Matrícula / Nómina',
          recibo.Matricula_Nomina,
        ],
        ['Perfil', recibo.Nombre_Rol],
        ['Libro', recibo.Titulo, true],
        ['Copia', `Copia ${recibo.num_copia} · Consulta Externa`],
        ['ISBN', recibo.ISBN],
        ['Ubicación', TextoUbicacion(recibo.ubicacion)],
        ['Fecha de préstamo', FechaLarga(recibo.Fecha_Prestamo)],
        ['Fecha de devolución', FechaLarga(recibo.Fecha_Entrega_Programada)],
        ['Entrega del recibo', 'Impreso'],
        ['Atendió', recibo.Atendio],
      ],
      notas: [recibo.Nota],
    }).pipe(res);
  },

  /*
   * Función: Renovar
   * Objetivo: POST /prestamos/:id/renovacion — renovar un préstamo (con multa si estaba
   *           vencido).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con { prestamo, renovacion, multa, enviada_tesoreria }
   */
  async Renovar(req, res)
  {
    const resultado = await ModeloPrestamo.Renovar(req.params.id);
    const enviada_tesoreria = await ModeloTesoreria.IntentarEnviarMulta(resultado.multa);
    res.json({ ...resultado, enviada_tesoreria });
  },

  /*
   * Función: Vencidos
   * Objetivo: GET /prestamos/vencidos?perfil=&matricula= — préstamos vencidos sin devolver.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con { lector, datos }
   */
  async Vencidos(req, res)
  {
    res.json(await ModeloPrestamo.Vencidos(req.consulta_valida));
  },

  /*
   * Función: ListaEspera
   * Objetivo: GET /lista-espera?q= — lista de espera de un libro buscado por su ISBN.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async ListaEspera(req, res)
  {
    res.json(await ModeloListaEspera.BuscarLibro(req.consulta_valida.q));
  },

  /*
   * Función: AgregarEspera
   * Objetivo: POST /lista-espera — agregar a un lector a la lista de espera de un libro.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: 201 con la lista actualizada y el lugar del lector
   */
  async AgregarEspera(req, res)
  {
    res.status(201).json(await ModeloListaEspera.Agregar(req.body.id_libro, req.body.matricula));
  },

  /*
   * Función: QuitarEspera
   * Objetivo: DELETE /lista-espera/:id — quitar a un lector de la lista de espera.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con la lista actualizada
   */
  async QuitarEspera(req, res)
  {
    res.json(await ModeloListaEspera.Quitar(req.params.id));
  },
};

export { ControladorPrestamos };
