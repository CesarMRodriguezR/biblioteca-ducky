/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL · ControladorDevoluciones.js
 * Función: Devoluciones, libros perdidos, multas (también en PDF), lista de alumnos deudores y
 *          pagos de Tesorería.
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
 *     Módulo                    Objetivo
 *     AvisarPerdido             Avisar a Servicios Escolares que un alumno perdió un libro
 *     EstadoPago                Estado de un pago según lo que aún debe el lector
 *     BuscarMulta               Obtener el recibo de una multa o responder 404
 *     RenglonesMulta            Renglones del recibo de multa
 *     ControladorDevoluciones   Manejadores de devoluciones, multas y pagos
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no contiene SQL; usa los modelos de src/modelos.
 * (2) Cada método se registra en rutas/rutas.js envuelto en ManejarAsincrono, que envía los
 *     errores a ManejarErrores.
 * (3) Toda multa nueva se intenta enviar a Tesorería; si no responde, queda pendiente de
 *     sincronizar y se reenvía al abrir Pagos de Tesorería.
 * (4) RecibirPago no usa sesión: lo llama Tesorería con la clave de integración.
 * ******************************************************************
 */

import { ModeloDevolucion } from '../modelos/ModeloDevolucion.js';
import { ModeloMulta } from '../modelos/ModeloMulta.js';
import { ModeloTesoreria } from '../modelos/ModeloTesoreria.js';
import { ModeloCiaa } from '../modelos/ModeloCiaa.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { FechaCorta, Hoy } from '../utilidades/fechas.js';
import { GenerarDocumentoPdf } from '../utilidades/GenerarDocumentoPdf.js';
import { FolioMulta, FormatoMoneda } from '../utilidades/ReglasCirculacion.js';

/*
 * Función: AvisarPerdido
 * Objetivo: Avisar a Servicios Escolares (CIAA) que un alumno perdió un libro.
 * Entrada: prestamo, multa
 * Salida: Promesa con true si el CIAA recibió el aviso (false si no es alumno o no respondió)
 */
async function AvisarPerdido(prestamo, multa)
{
  if (prestamo.Nombre_Rol !== 'Alumno')
  {
    return false;
  }
  try
  {
    await ModeloCiaa.EnviarAviso({
      tipo: 'Libro perdido',
      matricula: prestamo.Matricula_Nomina,
      detalle: {
        Folio_Prestamo: prestamo.Folio,
        Titulo: prestamo.Titulo,
        Copia: prestamo.num_copia,
        Folio_Multa: multa.Folio,
        Monto: multa.Cantidad_a_Pagar,
      },
    });
    return true;
  }
  catch (error)
  {
    if (error.details?.codigo !== 'SISTEMA_EXTERNO')
    {
      throw error;
    }
    return false;
  }
}

/*
 * Función: EstadoPago
 * Objetivo: Estado de un pago según lo que aún debe el lector: parcial si le queda algo
 *           pendiente; si ya no debe nada y es alumno, sale de la lista de deudores.
 * Entrada: deuda ({ total, Nombre_Rol } o undefined)
 * Salida: Texto del estado
 */
function EstadoPago(deuda)
{
  if (deuda && deuda.total > 0)
  {
    return `Parcial · falta ${FormatoMoneda(deuda.total)}`;
  }
  return deuda?.Nombre_Rol === 'Alumno' ? 'Aplicado · salió de deudores' : 'Aplicado';
}

/*
 * Función: BuscarMulta
 * Objetivo: Obtener el recibo de una multa o responder 404; «Atendió» es quien lo entrega.
 * Entrada: id_multa, usuario (sesión)
 * Salida: Promesa con la multa, Atendio y la nota del recibo
 */
async function BuscarMulta(id_multa, usuario)
{
  const multa = await ModeloMulta.BuscarPorId(id_multa);
  if (!multa)
  {
    throw ErrorHttp.NoEncontrado('No existe una multa con ese folio.');
  }
  return {
    ...multa,
    Atendio: usuario.Nombre_Completo,
    Nota: multa.Fecha_Pagado
      ? `La multa se pagó en Tesorería el ${FechaCorta(multa.Fecha_Pagado)}.`
      : `La multa se registró a nombre de ${multa.Nombre_Completo}. El pago se realiza en ` +
        'Tesorería.',
  };
}

/*
 * Función: RenglonesMulta
 * Objetivo: Renglones del recibo de multa (los mismos que muestra la web).
 * Entrada: multa (de BuscarMulta)
 * Salida: Arreglo de [etiqueta, valor, resaltado]
 */
function RenglonesMulta(multa)
{
  const perdida = multa.Motivo === 'Pérdida del libro';
  return [
    ['Folio de multa', multa.Folio],
    ['Lector', multa.Nombre_Completo],
    [multa.Nombre_Rol === 'Alumno' ? 'Matrícula' : 'Matrícula / Nómina', multa.Matricula_Nomina],
    ['Perfil', multa.Nombre_Rol],
    ...(multa.Titulo
      ? [
        ['Libro', multa.Titulo, true],
        ['Copia', `Copia ${multa.num_copia}${perdida ? ' · marcada como Perdida' : ''}`],
      ]
      : []),
    ['Motivo', multa.Motivo],
    ...(perdida ? [] : [['Justificación', multa.Justificacion]]),
    ['Fecha', FechaCorta(multa.Fecha_Multa)],
    ...(perdida && multa.Precio
      ? [['Precio de última compra', `${FormatoMoneda(multa.Precio)} MXN`]]
      : []),
    ['Monto de la multa', `${FormatoMoneda(multa.Cantidad_a_Pagar)} MXN`, true],
    [
      'Estado',
      multa.Fecha_Pagado ? `Pagada el ${FechaCorta(multa.Fecha_Pagado)}` : 'Pendiente de pago',
    ],
    ['Atendió', multa.Atendio],
  ];
}

/*
 * Módulo: ControladorDevoluciones
 * Objetivo: Manejadores de devoluciones, multas y pagos.
 */
const ControladorDevoluciones = {
  /*
   * Función: Resumen
   * Objetivo: GET /devoluciones/resumen — indicadores y últimas devoluciones.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async Resumen(_req, res)
  {
    res.json(await ModeloDevolucion.Resumen());
  },

  /*
   * Función: Registrar
   * Objetivo: POST /devoluciones — registrar la devolución de un préstamo.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: 201 con la devolución, la multa (si hubo retraso) y la lista de espera
   */
  async Registrar(req, res)
  {
    const resultado = await ModeloDevolucion.Registrar(req.body);
    const enviada_tesoreria = await ModeloTesoreria.IntentarEnviarMulta(resultado.multa);
    res.status(201).json({ ...resultado, enviada_tesoreria });
  },

  /*
   * Función: ReportarPerdido
   * Objetivo: POST /prestamos/:id/perdido — reportar un libro perdido: genera la multa por
   *           reposición y avisa a Tesorería y a Servicios Escolares.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con { prestamo, multa, enviada_tesoreria, avisado_servicios }
   */
  async ReportarPerdido(req, res)
  {
    const resultado = await ModeloDevolucion.ReportarPerdido(req.params.id);
    const [enviada_tesoreria, avisado_servicios] = await Promise.all([
      ModeloTesoreria.IntentarEnviarMulta(resultado.multa),
      AvisarPerdido(resultado.prestamo, resultado.multa),
    ]);
    res.json({ ...resultado, enviada_tesoreria, avisado_servicios });
  },

  /*
   * Función: ResumenMultas
   * Objetivo: GET /multas/resumen — indicadores y multas recientes del menú Multas y adeudos.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async ResumenMultas(_req, res)
  {
    res.json(await ModeloMulta.Resumen(Hoy()));
  },

  /*
   * Función: GenerarMulta
   * Objetivo: POST /multas — generar la multa de un préstamo (extemporánea, daño o pérdida).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: 201 con { prestamo, multa, enviada_tesoreria }
   */
  async GenerarMulta(req, res)
  {
    const resultado = await ModeloDevolucion.GenerarMulta(req.body);
    const enviada_tesoreria = await ModeloTesoreria.IntentarEnviarMulta(resultado.multa);
    res.status(201).json({ ...resultado, enviada_tesoreria });
  },

  /*
   * Función: ObtenerMulta
   * Objetivo: GET /multas/:id — datos de una multa (comprobante).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP en formato JSON
   */
  async ObtenerMulta(req, res)
  {
    res.json(await BuscarMulta(req.params.id, req.usuario));
  },

  /*
   * Función: MultaPdf
   * Objetivo: GET /multas/:id/comprobante.pdf — comprobante de la multa en PDF.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con el PDF
   */
  async MultaPdf(req, res)
  {
    const multa = await BuscarMulta(req.params.id, req.usuario);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Multa_${multa.Folio}.pdf"`);
    GenerarDocumentoPdf({
      titulo: 'Recibo de multa',
      seccion: 'Biblioteca · Multas',
      generado: `Generado el ${FechaCorta(multa.Fecha_Multa)} · ${multa.Atendio}`,
      folio: multa.Folio,
      renglones: RenglonesMulta(multa),
      notas: [multa.Nota],
    }).pipe(res);
  },

  /*
   * Función: Deudores
   * Objetivo: GET /multas/deudores?periodo= — lista de alumnos deudores para el periodo de
   *           exámenes.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con { periodo, generado_el, total_adeudo, datos }
   */
  async Deudores(req, res)
  {
    const datos = await ModeloMulta.Deudores(Hoy());
    res.json({
      periodo: req.consulta_valida.periodo,
      generado_el: new Date().toISOString(),
      total_adeudo: datos.reduce((total, alumno) => total + alumno.Total_Adeudo, 0),
      datos,
    });
  },

  /*
   * Función: DeudoresPdf
   * Objetivo: GET /multas/deudores.pdf?periodo= — la lista de alumnos deudores en PDF.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con el PDF
   */
  async DeudoresPdf(req, res)
  {
    const { periodo } = req.consulta_valida;
    const datos = await ModeloMulta.Deudores(Hoy());
    const total = datos.reduce((suma, alumno) => suma + alumno.Total_Adeudo, 0);
    const fecha = new Date();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Lista_alumnos_deudores_${Hoy()}.pdf"`,
    );
    GenerarDocumentoPdf({
      titulo: 'Lista de alumnos deudores',
      subtitulo: `Periodo de exámenes: ${periodo}`,
      generado:
        `Generado el ${FechaCorta(Hoy())} · ` +
        `${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
      tabla: {
        columnas: [
          { titulo: 'Matrícula', ancho: 2 },
          { titulo: 'Alumno', ancho: 4 },
          { titulo: 'Libros sin devolver', ancho: 2.4 },
          { titulo: 'Multas pendientes', ancho: 2.4 },
          { titulo: 'Total adeudo', ancho: 2 },
        ],
        filas: datos.map((alumno) => [
          alumno.Matricula_Nomina,
          alumno.Nombre_Completo,
          alumno.Libros_Sin_Devolver,
          alumno.Multas_Pendientes,
          FormatoMoneda(alumno.Total_Adeudo),
        ]),
      },
      notas: [
        `${datos.length} ${datos.length === 1 ? 'alumno deudor' : 'alumnos deudores'} · ` +
          `Total pendiente: ${FormatoMoneda(total)}`,
        'Los alumnos de esta lista no podrán presentar exámenes hasta liquidar sus adeudos.',
      ],
    }).pipe(res);
  },

  /*
   * Función: EnviarDeudores
   * Objetivo: POST /multas/deudores/envio — enviar la lista de alumnos deudores a Servicios
   *           Escolares (CIAA).
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con { periodo, total }; 502 si Servicios Escolares no responde
   */
  async EnviarDeudores(req, res)
  {
    const datos = await ModeloMulta.Deudores(Hoy());
    if (!datos.length)
    {
      throw ErrorHttp.Conflicto('No hay alumnos deudores para enviar.', { codigo: 'SIN_DEUDORES' });
    }
    try
    {
      await ModeloCiaa.EnviarAviso({
        tipo: 'Lista de deudores',
        periodo: req.body.periodo,
        detalle: { alumnos: datos },
      });
    }
    catch (error)
    {
      if (error.details?.codigo !== 'SISTEMA_EXTERNO')
      {
        throw error;
      }
      throw new ErrorHttp(502, 'No se pudo enviar la lista a Servicios Escolares', {
        codigo: 'SISTEMA_EXTERNO',
        mensaje: 'El sistema de Servicios Escolares no responde. Intenta de nuevo más tarde.',
      });
    }
    res.json({ periodo: req.body.periodo, total: datos.length });
  },

  /*
   * Función: Pagos
   * Objetivo: GET /multas/pagos — sincronizar con Tesorería (enviar multas pendientes y aplicar
   *           pagos) y mostrar los pagos recibidos.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con { disponible, enviadas, aplicados, pagos, pendientes }
   */
  async Pagos(_req, res)
  {
    const resumen = await ModeloTesoreria.SincronizarMultas();
    const deudas = await ModeloMulta.PendientePorMatricula([
      ...new Set(resumen.pagos.map((pago) => pago.Matricula)),
    ]);
    res.json({
      ...resumen,
      pagos: resumen.pagos.map((pago) => ({
        ...pago,
        Folio_Multa: FolioMulta(pago.Referencia),
        Estado: EstadoPago(deudas.get(pago.Matricula)),
      })),
    });
  },

  /*
   * Función: RecibirPago
   * Objetivo: POST /tesoreria/pagos — aviso de Tesorería: se pagó una multa en caja.
   * Entrada: req: petición HTTP (ya autenticada y validada); res: respuesta HTTP
   * Salida: Respuesta HTTP con { multa, cambio }
   */
  async RecibirPago(req, res)
  {
    const { multa, cambio } = await ModeloMulta.MarcarPagada(req.body.referencia, req.body.fecha);
    if (!multa)
    {
      throw ErrorHttp.NoEncontrado(`No existe la multa ${req.body.referencia}`);
    }
    res.json({ multa, cambio });
  },
};

export { ControladorDevoluciones };
