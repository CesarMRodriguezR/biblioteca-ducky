/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL · ControladorDevoluciones.js
 * Función: Controladores de las pantallas de Devoluciones y de Multas y adeudos: menús,
 *          registro de devolución, libro perdido, préstamos vencidos, generar multa, adeudos de
 *          un usuario, lista de alumnos deudores y pagos de Tesorería.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Acciones del usuario en las pantallas
 * Salida: Estado y acciones para las vistas
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Hook                                Objetivo
 *     REGLAS_MULTA                        Montos del reglamento para la vista previa de la multa
 *     TextoAlumnos                        Describir cuántos alumnos deudores se enviaron
 *     TextoMultaRetraso                   Mencionar la multa por retraso de un libro perdido
 *     useVistaMulta                       Vista previa e impresión del recibo de multa
 *     useControladorMenuDevoluciones      Menú Devoluciones: indicadores y últimas devoluciones
 *     useControladorMenuMultas            Menú Multas y adeudos: indicadores y multas recientes
 *     useControladorRegistrarDevolucion   BD-SP03-DL01 Registrar devolución
 *     useControladorLibroPerdido          BD-SP03-DL03 Reporte de libro perdido
 *     useControladorVencidos              BD-SP03-DL05 Préstamos vencidos
 *     useControladorGenerarMulta          BD-SP03-DL02 Generar multa
 *     useControladorAdeudos               BD-SP03-DL04 Multas y adeudos de un usuario
 *     useControladorDeudores              BD-SP03-DL06 Lista de alumnos deudores
 *     useControladorPagos                 BD-SP03-DL07 Pagos de Tesorería
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no devuelve JSX; las vistas están en
 *     vistas/paginas/devoluciones y vistas/paginas/multas.
 * (2) Los montos de las multas los calcula la API; REGLAS_MULTA solo sirve para mostrar el
 *     monto antes de confirmar.
 * (3) Los resultados se muestran con Alerta dentro de la pantalla (aviso).
 * ******************************************************************
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSesion } from './ControladorSesion.jsx';
import { useCarga } from './HooksAsincronos.js';
import { useVistaPrevia } from './HooksDocumentos.js';
import { useBusquedaLector } from './ControladorPrestamos.js';
import {
  ModeloDevolucion,
  ModeloListaEspera,
  ModeloMulta,
  ModeloPrestamo,
} from '../modelos/ModelosCirculacion.js';
import { EnPeriodo, FormatoMoneda, PERIODOS_EXAMEN, PERIODOS_PAGO } from '../modelos/dominio.js';

/*
 * Constante: REGLAS_MULTA
 * Objetivo: Montos del reglamento para la vista previa de la multa (los aplica la API).
 */
const REGLAS_MULTA = { MULTA_POR_DIA: 10, MULTA_POR_DANO: 250 };

/*
 * Función: TextoAlumnos
 * Objetivo: Describir cuántos alumnos deudores se enviaron («los 3 alumnos deudores»).
 * Entrada: total
 * Salida: Texto
 */
function TextoAlumnos(total)
{
  return total === 1 ? 'el alumno deudor' : `los ${total} alumnos deudores`;
}

/*
 * Función: TextoMultaRetraso
 * Objetivo: Mencionar la multa por retraso que se genera junto con la de un libro perdido.
 * Entrada: multa_retraso (o null)
 * Salida: Texto (vacío si no hubo retraso)
 */
function TextoMultaRetraso(multa_retraso)
{
  return multa_retraso
    ? ` y la multa ${multa_retraso.Folio} por ` +
      `${FormatoMoneda(multa_retraso.Cantidad_a_Pagar)} por los días de retraso`
    : '';
}

/*
 * Hook: useVistaMulta
 * Objetivo: Vista previa del recibo de una multa con impresión y PDF.
 * Entrada: SetAviso
 * Salida: Objeto de useVistaPrevia
 */
function useVistaMulta(SetAviso)
{
  return useVistaPrevia({
    CargarDatos: (id) => ModeloMulta.Obtener(id),
    CargarPdf: (id) => ModeloMulta.ComprobantePdf(id),
    NombreArchivo: (multa) => `Multa_${multa.Folio}.pdf`,
    al_imprimir: (multa) =>
      SetAviso({
        tipo: 'exito',
        titulo: 'Multa enviada a imprimir',
        texto: `El recibo de la multa ${multa.Folio} se mandó a la impresora.`,
      }),
    al_descargar: (multa) =>
      SetAviso({
        tipo: 'exito',
        titulo: 'PDF descargado',
        texto: `El recibo de la multa ${multa.Folio} se guardó como PDF.`,
      }),
  });
}

/*
 * Hook: useControladorMenuDevoluciones
 * Objetivo: Menú Devoluciones: indicadores, accesos y últimas devoluciones.
 * Entrada: Ninguna
 * Salida: Objeto { resumen, error, cargando, Ir }
 */
export function useControladorMenuDevoluciones()
{
  const navegar = useNavigate();
  const { datos, error, cargando } = useCarga(() => ModeloDevolucion.Resumen(), []);
  return { resumen: datos, error, cargando, Ir: (ruta) => navegar(ruta) };
}

/*
 * Hook: useControladorMenuMultas
 * Objetivo: Menú Multas y adeudos: indicadores, accesos y multas recientes.
 * Entrada: Ninguna
 * Salida: Objeto { resumen, error, cargando, Ir }
 */
export function useControladorMenuMultas()
{
  const navegar = useNavigate();
  const { datos, error, cargando } = useCarga(() => ModeloMulta.Resumen(), []);
  return { resumen: datos, error, cargando, Ir: (ruta) => navegar(ruta) };
}

/*
 * Hook: useControladorRegistrarDevolucion
 * Objetivo: BD-SP03-DL01 Registrar devolución: préstamos pendientes del lector, días de
 *           retraso, condición del libro, multa y lista de espera del libro.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorRegistrarDevolucion()
{
  const navegar = useNavigate();
  const { Puede } = useSesion();
  const lector = useBusquedaLector();
  const [seleccionado, SetSeleccionado] = useState(null);
  const [condicion, SetCondicion] = useState('Buen estado');
  const [resultado, SetResultado] = useState(null);
  const [aviso, SetAviso] = useState(null);
  const [enviando, SetEnviando] = useState(false);
  const [espera, SetEspera] = useState([]);
  const vista = useVistaMulta(SetAviso);

  async function Elegir(prestamo)
  {
    SetSeleccionado(prestamo);
    SetCondicion('Buen estado');
    SetResultado(null);
    SetAviso(null);
    SetEspera([]);
    try
    {
      SetEspera((await ModeloListaEspera.Buscar(prestamo.ISBN)).lista);
    }
    catch
    {
      // Sin lista de espera que mostrar: la devolución se registra igual.
    }
  }

  async function Registrar()
  {
    SetAviso(null);
    SetEnviando(true);
    try
    {
      SetResultado(
        await ModeloDevolucion.Registrar({ id_prestamo: seleccionado.id_prestamo, condicion }),
      );
    }
    catch (excepcion)
    {
      SetAviso({ tipo: 'error', titulo: excepcion.message, texto: null });
    }
    finally
    {
      SetEnviando(false);
    }
  }

  function Reiniciar()
  {
    lector.Limpiar();
    SetSeleccionado(null);
    SetCondicion('Buen estado');
    SetResultado(null);
    SetAviso(null);
    SetEspera([]);
  }

  return {
    lector,
    pendientes: lector.situacion?.activos ?? [],
    seleccionado,
    espera,
    condicion,
    SetCondicion,
    resultado,
    aviso,
    enviando,
    vista,
    puede_prestar: Puede('prestar_libros'),
    Buscar: () =>
    {
      SetSeleccionado(null);
      SetResultado(null);
      SetAviso(null);
      lector.Buscar();
    },
    Elegir,
    Registrar,
    Reiniciar,
    Cancelar: () => SetSeleccionado(null),
    VerMulta: () => vista.Abrir(resultado.multa.id_multa),
    VerListaEspera: () =>
      navegar(`/prestamos/lista-espera?q=${encodeURIComponent(seleccionado.ISBN)}`),
    MultaPorDano: () =>
      navegar(
        `/multas/generar?matricula=${seleccionado.Matricula_Nomina}` +
          `&prestamo=${seleccionado.id_prestamo}&motivo=${encodeURIComponent('Daño del libro')}`,
      ),
  };
}

/*
 * Hook: useControladorLibroPerdido
 * Objetivo: BD-SP03-DL03 Reportar un libro perdido: multa por reposición y aviso a Tesorería
 *           y a Servicios Escolares.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorLibroPerdido()
{
  const lector = useBusquedaLector();
  const [seleccionado, SetSeleccionado] = useState(null);
  const [resultado, SetResultado] = useState(null);
  const [aviso, SetAviso] = useState(null);
  const [enviando, SetEnviando] = useState(false);
  const vista = useVistaMulta(SetAviso);

  async function Reportar()
  {
    SetAviso(null);
    SetEnviando(true);
    try
    {
      const respuesta = await ModeloDevolucion.ReportarPerdido(seleccionado.id_prestamo);
      SetResultado(respuesta);
      const avisados = [
        respuesta.avisado_servicios && 'Servicios Escolares',
        respuesta.enviada_tesoreria && 'Tesorería',
      ].filter(Boolean);
      SetAviso({
        tipo: 'exito',
        titulo: 'Libro perdido reportado',
        texto:
          `Se generó la multa ${respuesta.multa.Folio} por ` +
          `${FormatoMoneda(respuesta.multa.Cantidad_a_Pagar)}` +
          TextoMultaRetraso(respuesta.multa_retraso) +
          (avisados.length ? ` y se notificó a ${avisados.join(' y a ')}.` : '.') +
          (respuesta.enviada_tesoreria
            ? ''
            : ' Tesorería no respondió: la multa se enviará en cuanto vuelva la conexión.'),
      });
    }
    catch (excepcion)
    {
      SetAviso({ tipo: 'error', titulo: excepcion.message, texto: null });
    }
    finally
    {
      SetEnviando(false);
    }
  }

  return {
    lector,
    pendientes: lector.situacion?.activos ?? [],
    seleccionado,
    resultado,
    aviso,
    enviando,
    vista,
    Buscar: () =>
    {
      SetSeleccionado(null);
      SetResultado(null);
      SetAviso(null);
      lector.Buscar();
    },
    Elegir: (prestamo) =>
    {
      SetSeleccionado(prestamo);
      SetResultado(null);
      SetAviso(null);
    },
    multa_retraso: (seleccionado?.Dias_Retraso ?? 0) * REGLAS_MULTA.MULTA_POR_DIA,
    Reportar,
    Cancelar: () => SetSeleccionado(null),
    ImprimirMulta: () => vista.Abrir(resultado.multa.id_multa),
    ImprimirMultaRetraso: () => vista.Abrir(resultado.multa_retraso.id_multa),
  };
}

/*
 * Hook: useControladorVencidos
 * Objetivo: BD-SP03-DL05 Préstamos vencidos con filtro por perfil o de un lector.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorVencidos()
{
  const [perfil, SetPerfil] = useState('');
  const [matricula, SetMatricula] = useState('');
  const [consulta, SetConsulta] = useState({ perfil: '', matricula: '' });
  const { datos, error, cargando } = useCarga(
    () =>
      ModeloPrestamo.Vencidos({
        perfil: consulta.perfil || undefined,
        matricula: consulta.matricula || undefined,
      }),
    [consulta.perfil, consulta.matricula],
  );

  return {
    perfil,
    matricula,
    SetMatricula,
    datos,
    error,
    cargando,
    consulta,
    Filtrar: (valor) =>
    {
      SetPerfil(valor);
      SetMatricula('');
      SetConsulta({ perfil: valor, matricula: '' });
    },
    Buscar: () =>
    {
      SetPerfil('');
      SetConsulta({ perfil: '', matricula: matricula.trim() });
    },
  };
}

/*
 * Hook: useControladorGenerarMulta
 * Objetivo: BD-SP03-DL02 Generar la multa de un préstamo por entrega extemporánea, daño o
 *           pérdida, con su justificación.
 * Entrada: Ninguna (acepta ?matricula=, ?prestamo= y ?motivo= en la dirección)
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorGenerarMulta()
{
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const lector = useBusquedaLector(parametros.get('matricula') ?? '');
  const [elegido, SetElegido] = useState(parametros.get('prestamo'));
  const [motivo, SetMotivo] = useState(parametros.get('motivo') ?? 'Daño del libro');
  const [justificacion, SetJustificacion] = useState('');
  const [errores, SetErrores] = useState({});
  const [resultado, SetResultado] = useState(null);
  const [aviso, SetAviso] = useState(null);
  const [enviando, SetEnviando] = useState(false);
  const vista = useVistaMulta(SetAviso);

  const situacion = lector.situacion;
  const pendientes = situacion
    ? [
      ...situacion.activos,
      ...situacion.historial.filter(
        (prestamo) => prestamo.id_prestamo === parametros.get('prestamo'),
      ),
    ]
    : [];
  const seleccionado = pendientes.find((prestamo) => prestamo.id_prestamo === elegido) ?? null;

  function MontoPrevio()
  {
    if (!seleccionado)
    {
      return 0;
    }
    if (motivo === 'Entrega extemporánea')
    {
      return seleccionado.Dias_Retraso * REGLAS_MULTA.MULTA_POR_DIA;
    }
    return motivo === 'Daño del libro' ? REGLAS_MULTA.MULTA_POR_DANO : seleccionado.Precio;
  }

  async function Generar()
  {
    SetAviso(null);
    if (!justificacion.trim())
    {
      SetErrores({ justificacion: 'Escribe la justificación de la multa.' });
      SetAviso({
        tipo: 'error',
        titulo: 'Falta la justificación de la multa',
        texto: 'Escribe la justificación para continuar.',
      });
      return;
    }
    SetErrores({});
    SetEnviando(true);
    try
    {
      const respuesta = await ModeloMulta.Generar({
        id_prestamo: seleccionado.id_prestamo,
        motivo,
        justificacion,
      });
      SetResultado(respuesta);
      SetAviso({
        tipo: 'exito',
        titulo:
          `Multa ${respuesta.multa.Folio} generada por ` +
          `${FormatoMoneda(respuesta.multa.Cantidad_a_Pagar)}`,
        texto:
          `Se registró a nombre de ${respuesta.multa.Nombre_Completo}` +
          TextoMultaRetraso(respuesta.multa_retraso) +
          '. Debe pagarse en Tesorería.' +
          (respuesta.enviada_tesoreria
            ? ''
            : ' Tesorería no respondió: la multa se enviará en cuanto vuelva la conexión.'),
      });
    }
    catch (excepcion)
    {
      SetErrores(excepcion.errores ?? {});
      SetAviso({
        tipo: 'error',
        titulo: excepcion.message,
        texto: excepcion.detalles?.mensaje ?? null,
      });
    }
    finally
    {
      SetEnviando(false);
    }
  }

  return {
    lector,
    pendientes,
    seleccionado,
    motivo,
    SetMotivo: (valor) =>
    {
      SetMotivo(valor);
      SetAviso(null);
    },
    justificacion,
    SetJustificacion,
    monto: MontoPrevio(),
    multa_retraso:
      motivo === 'Pérdida del libro' && seleccionado?.Estado === 'Activo'
        ? seleccionado.Dias_Retraso * REGLAS_MULTA.MULTA_POR_DIA
        : 0,
    errores,
    resultado,
    aviso,
    enviando,
    vista,
    Buscar: () =>
    {
      SetElegido(null);
      SetResultado(null);
      SetAviso(null);
      lector.Buscar();
    },
    Elegir: (prestamo) =>
    {
      SetElegido(prestamo.id_prestamo);
      SetJustificacion('');
      SetErrores({});
      SetResultado(null);
      SetAviso(null);
    },
    Generar,
    Cancelar: () => navegar('/multas'),
    ImprimirMulta: () => vista.Abrir(resultado.multa.id_multa),
  };
}

/*
 * Hook: useControladorAdeudos
 * Objetivo: BD-SP03-DL04 Multas pendientes, libros sin devolver e historial de multas pagadas
 *           de un usuario.
 * Entrada: Ninguna (acepta ?matricula= en la dirección)
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorAdeudos()
{
  const [parametros] = useSearchParams();
  const lector = useBusquedaLector(parametros.get('matricula') ?? '');
  const situacion = lector.situacion;
  const inactivo = situacion?.lector.Estatus === 'Inactivo';
  const pendientes = situacion?.multas.filter((multa) => multa.Estado === 'Pendiente') ?? [];
  const sin_devolver = situacion?.activos.filter((prestamo) => prestamo.Dias_Retraso > 0) ?? [];
  return {
    lector,
    situacion: inactivo ? null : situacion,
    inactivo,
    con_adeudos: pendientes.length > 0 || sin_devolver.length > 0,
    pendientes,
    pagadas: situacion?.multas.filter((multa) => multa.Estado === 'Pagada') ?? [],
    sin_devolver,
  };
}

/*
 * Hook: useControladorDeudores
 * Objetivo: BD-SP03-DL06 Generar la lista de alumnos deudores del periodo de exámenes,
 *           imprimirla o enviarla a Servicios Escolares.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorDeudores()
{
  const [periodo, SetPeriodo] = useState(PERIODOS_EXAMEN[0].valor);
  const [lista, SetLista] = useState(null);
  const [error, SetError] = useState(null);
  const [generando, SetGenerando] = useState(false);
  const [enviando, SetEnviando] = useState(false);
  const [aviso, SetAviso] = useState(null);
  const vista = useVistaPrevia({
    CargarDatos: (clave) => ModeloMulta.Deudores(clave),
    CargarPdf: (clave) => ModeloMulta.DeudoresPdf(clave),
    NombreArchivo: () => `Lista_alumnos_deudores_${new Date().toISOString().slice(0, 10)}.pdf`,
    al_imprimir: () =>
      SetAviso({
        tipo: 'exito',
        titulo: 'Lista enviada a imprimir',
        texto: 'La lista de alumnos deudores se mandó a la impresora.',
      }),
    al_descargar: () =>
      SetAviso({
        tipo: 'exito',
        titulo: 'PDF descargado',
        texto: 'La lista de alumnos deudores se guardó como PDF.',
      }),
  });

  async function Generar()
  {
    SetAviso(null);
    SetGenerando(true);
    SetError(null);
    try
    {
      SetLista(await ModeloMulta.Deudores(periodo));
    }
    catch (excepcion)
    {
      SetLista(null);
      SetError(excepcion);
    }
    finally
    {
      SetGenerando(false);
    }
  }

  async function Enviar()
  {
    SetAviso(null);
    SetEnviando(true);
    try
    {
      await ModeloMulta.EnviarDeudores(lista.periodo);
      SetAviso({
        tipo: 'exito',
        titulo: 'Lista enviada a Servicios Escolares',
        texto:
          `Se enviaron ${TextoAlumnos(lista.datos.length)} del periodo de ` +
          `${lista.periodo.split(' · ')[0]}. No podrán presentar exámenes hasta liquidar sus ` +
          'adeudos.',
      });
    }
    catch (excepcion)
    {
      SetAviso({
        tipo: 'error',
        titulo: excepcion.message,
        texto: excepcion.detalles?.mensaje ?? null,
      });
    }
    finally
    {
      SetEnviando(false);
    }
  }

  return {
    periodo,
    SetPeriodo: (valor) =>
    {
      SetPeriodo(valor);
      SetLista(null);
      SetAviso(null);
    },
    lista,
    error,
    generando,
    enviando,
    aviso,
    vista,
    Generar,
    Enviar,
    Imprimir: () => vista.Abrir(lista.periodo, lista),
  };
}

/*
 * Hook: useControladorPagos
 * Objetivo: BD-SP03-DL07 Pagos recibidos de Tesorería y multas pendientes de sincronizar,
 *           filtrados por periodo (últimos 7 días al abrir) y por matrícula o nómina. Las
 *           multas pendientes de sincronizar se muestran siempre, sin importar el periodo.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorPagos()
{
  const { datos, error, cargando, Recargar } = useCarga(() => ModeloMulta.Pagos(), []);
  const [periodo, SetPeriodo] = useState('semana');
  const [texto, SetTexto] = useState('');
  const [matricula, SetMatricula] = useState('');
  const Coincide = (valor) => !matricula || String(valor) === matricula;
  return {
    datos,
    error,
    cargando,
    periodos: PERIODOS_PAGO,
    periodo,
    SetPeriodo,
    texto,
    SetTexto,
    matricula,
    pagos: (datos?.pagos ?? []).filter(
      (pago) => EnPeriodo(pago.Fecha_Pago, periodo) && Coincide(pago.Matricula),
    ),
    pendientes: (datos?.pendientes ?? []).filter((multa) => Coincide(multa.Matricula_Nomina)),
    Buscar: () => SetMatricula(texto.trim()),
    Reintentar: Recargar,
  };
}
