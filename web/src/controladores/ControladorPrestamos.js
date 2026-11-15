/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL · ControladorPrestamos.js
 * Función: Controladores de las pantallas de Préstamos: menú, registro, recibo, reimpresión,
 *          renovación, préstamos de un usuario y lista de espera.
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
 *     Hook                              Objetivo
 *     useBusquedaLector                 Buscar a un lector por matrícula y guardar su situación
 *     useControladorMenuPrestamos       Menú Préstamos: indicadores y últimos préstamos
 *     useControladorRegistrarPrestamo   BD-SP03-PL01 Registrar préstamo
 *     useVistaRecibo                    Vista previa e impresión del recibo
 *     useEntregaRecibo                  Enviar un recibo por correo o por WhatsApp
 *     useControladorRecibo              BD-SP03-PL02 Recibo de préstamo y su entrega
 *     useControladorReimprimir          BD-SP03-PL02 Reimprimir y entregar el recibo de un préstamo
 *     useControladorRenovar             BD-SP03-PL03 Renovar préstamo
 *     useControladorPrestamosUsuario    BD-SP03-PL04 Préstamos de un usuario
 *     useControladorListaEspera         BD-SP03-PL05 Lista de espera
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: no devuelve JSX; las vistas están en
 *     vistas/paginas/prestamos.
 * (2) Las reglas (condiciones del lector, días, renovaciones, prioridad de la lista) las
 *     aplica la API; aquí solo se valida que no falten datos antes de enviar.
 * (3) Los resultados se muestran con Alerta dentro de la pantalla (aviso), como en las
 *     pantallas de los sprints 1 y 2.
 * ******************************************************************
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCarga } from './HooksAsincronos.js';
import { useVistaPrevia } from './HooksDocumentos.js';
import {
  ModeloLector,
  ModeloListaEspera,
  ModeloPrestamo,
} from '../modelos/ModelosCirculacion.js';
import {
  EnlaceCorreo,
  EnlaceWhatsApp,
  FechaCorta,
  TelefonoTexto,
  TextoRecibo,
} from '../modelos/dominio.js';

/*
 * Hook: useBusquedaLector
 * Objetivo: Buscar a un lector por matrícula o nómina y guardar su situación (préstamos,
 *           multas y condiciones).
 * Entrada: matricula_inicial (opcional)
 * Salida: Objeto { matricula, SetMatricula, situacion, error, buscando, Buscar, Limpiar }
 */
export function useBusquedaLector(matricula_inicial = '')
{
  const [matricula, SetMatricula] = useState(matricula_inicial);
  const [situacion, SetSituacion] = useState(null);
  const [error, SetError] = useState(null);
  const [buscando, SetBuscando] = useState(false);

  async function Buscar(valor = matricula)
  {
    if (!valor.trim())
    {
      SetSituacion(null);
      SetError({ message: 'Escribe la matrícula o el número de nómina.', status: 400 });
      return null;
    }
    SetBuscando(true);
    SetError(null);
    try
    {
      const datos = await ModeloLector.Situacion(valor);
      SetSituacion(datos);
      return datos;
    }
    catch (excepcion)
    {
      SetSituacion(null);
      SetError(excepcion);
      return null;
    }
    finally
    {
      SetBuscando(false);
    }
  }

  useEffect(() =>
  {
    if (matricula_inicial)
    {
      Buscar(matricula_inicial);
    }
  }, [matricula_inicial]);

  return {
    matricula,
    SetMatricula,
    situacion,
    error,
    buscando,
    Buscar: () => Buscar(),
    Limpiar: () =>
    {
      SetMatricula('');
      SetSituacion(null);
      SetError(null);
    },
  };
}

/*
 * Hook: useControladorMenuPrestamos
 * Objetivo: Menú Préstamos: indicadores, accesos y últimos préstamos.
 * Entrada: Ninguna
 * Salida: Objeto { resumen, error, cargando, Ir }
 */
export function useControladorMenuPrestamos()
{
  const navegar = useNavigate();
  const { datos, error, cargando } = useCarga(() => ModeloPrestamo.Resumen(), []);
  return { resumen: datos, error, cargando, Ir: (ruta) => navegar(ruta) };
}

/*
 * Hook: useControladorRegistrarPrestamo
 * Objetivo: BD-SP03-PL01 Registrar préstamo: lector, libro y ejemplar, fechas, validación y
 *           resultado (exitoso, lector con adeudos, libro sin ejemplares o datos incompletos).
 * Entrada: Ninguna (acepta ?matricula= e ?isbn= en la dirección)
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorRegistrarPrestamo()
{
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const lector = useBusquedaLector(parametros.get('matricula') ?? '');
  const [isbn, SetIsbn] = useState(parametros.get('isbn') ?? '');
  const [libro, SetLibro] = useState(null);
  const [error_libro, SetErrorLibro] = useState(null);
  const [buscando_libro, SetBuscandoLibro] = useState(false);
  const [num_copia, SetNumCopia] = useState('');
  const [errores, SetErrores] = useState({});
  const [aviso, SetAviso] = useState(null);
  const [resultado, SetResultado] = useState(null);
  const [enviando, SetEnviando] = useState(false);
  const [rechazo, SetRechazo] = useState(null);

  async function BuscarLibro(valor = isbn)
  {
    SetNumCopia('');
    SetAviso(null);
    SetRechazo(null);
    if (!valor.trim())
    {
      SetLibro(null);
      SetErrorLibro({ message: 'Escribe el ISBN del libro.' });
      return;
    }
    SetBuscandoLibro(true);
    SetErrorLibro(null);
    try
    {
      const datos = await ModeloPrestamo.Libro(valor);
      SetLibro(datos);
      if (datos.prestables.length === 1)
      {
        SetNumCopia(String(datos.prestables[0].num_copia));
      }
    }
    catch (excepcion)
    {
      SetLibro(null);
      SetErrorLibro(excepcion);
    }
    finally
    {
      SetBuscandoLibro(false);
    }
  }

  useEffect(() =>
  {
    if (parametros.get('isbn'))
    {
      BuscarLibro(parametros.get('isbn'));
    }
  }, []);

  async function Registrar()
  {
    SetAviso(null);
    SetRechazo(null);
    const faltan = {};
    if (!lector.situacion)
    {
      faltan.matricula = 'Busca al lector.';
    }
    if (!libro)
    {
      faltan.isbn = 'Busca el libro.';
    }
    else if (libro.prestables.length && !num_copia)
    {
      faltan.num_copia = 'Este campo es obligatorio.';
    }
    SetErrores(faltan);
    if (Object.keys(faltan).length)
    {
      SetAviso({
        tipo: 'error',
        titulo: 'Faltan datos para registrar el préstamo',
        texto: faltan.num_copia
          ? 'Selecciona el ejemplar que se va a prestar.'
          : 'Busca al lector y el libro antes de registrar el préstamo.',
      });
      return;
    }
    if (!libro.prestables.length)
    {
      SetRechazo('libro');
      return;
    }
    SetEnviando(true);
    try
    {
      const respuesta = await ModeloPrestamo.Registrar({
        matricula: lector.situacion.lector.Matricula_Nomina,
        id_libro: libro.id_libro,
        num_copia: Number(num_copia),
      });
      SetResultado(respuesta);
      lector.Buscar();
    }
    catch (excepcion)
    {
      if (excepcion.codigo === 'LECTOR_NO_CUMPLE')
      {
        await lector.Buscar();
        SetRechazo('lector');
        return;
      }
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
    SetIsbn('');
    SetLibro(null);
    SetErrorLibro(null);
    SetNumCopia('');
    SetErrores({});
    SetAviso(null);
    SetResultado(null);
    SetRechazo(null);
  }

  const situacion = lector.situacion;
  return {
    lector: {
      ...lector,
      Buscar: () =>
      {
        SetRechazo(null);
        SetAviso(null);
        lector.Buscar();
      },
    },
    situacion,
    rechazo,
    isbn,
    SetIsbn,
    libro,
    error_libro,
    buscando_libro,
    BuscarLibro: () => BuscarLibro(),
    sin_ejemplares: Boolean(libro && !libro.prestables.length),
    num_copia,
    SetNumCopia,
    copia_elegida: libro?.prestables.find((copia) => String(copia.num_copia) === num_copia),
    errores,
    aviso,
    resultado,
    enviando,
    Registrar,
    Reiniciar,
    Cancelar: () => navegar('/prestamos'),
    VerAdeudos: () =>
      navegar(`/multas/adeudos?matricula=${situacion?.lector.Matricula_Nomina ?? ''}`),
    AgregarEspera: () =>
      navegar(
        `/prestamos/lista-espera?q=${encodeURIComponent(libro?.ISBN ?? '')}` +
          `&matricula=${situacion?.lector.Matricula_Nomina ?? ''}`,
      ),
    IrAlRecibo: () => navegar(`/prestamos/${resultado.prestamo.id_prestamo}/recibo`),
  };
}

/*
 * Hook: useVistaRecibo
 * Objetivo: Vista previa del recibo con impresión y PDF; el resultado se avisa con SetAviso.
 * Entrada: SetAviso, titulo_impreso (Función que arma el título del aviso al imprimir)
 * Salida: Objeto de useVistaPrevia
 */
export function useVistaRecibo(SetAviso, titulo_impreso)
{
  return useVistaPrevia({
    CargarDatos: (id) => ModeloPrestamo.Recibo(id),
    CargarPdf: (id) => ModeloPrestamo.ReciboPdf(id),
    NombreArchivo: (recibo) => `Recibo_${recibo.Folio}.pdf`,
    al_imprimir: (recibo) =>
      SetAviso({
        tipo: 'exito',
        titulo: titulo_impreso(recibo),
        texto: 'El recibo del préstamo se mandó a la impresora.',
      }),
    al_descargar: (recibo) =>
      SetAviso({
        tipo: 'exito',
        titulo: 'PDF descargado',
        texto: `El recibo ${recibo.Folio} se guardó como PDF.`,
      }),
  });
}

/*
 * Hook: useEntregaRecibo
 * Objetivo: Enviar un recibo por correo o por WhatsApp (con el correo y el teléfono guardados en
 *           Biblio) y avisar el resultado con SetAviso.
 * Entrada: SetAviso
 * Salida: Objeto { EnviarCorreo(recibo), EnviarWhatsApp(recibo) }
 */
function useEntregaRecibo(SetAviso)
{
  function EnviarCorreo(recibo)
  {
    if (!recibo.Correo)
    {
      SetAviso({
        tipo: 'error',
        titulo: 'No se pudo enviar el recibo por correo',
        texto: `${recibo.Nombre_Completo} no tiene correo registrado. Entrega el recibo impreso.`,
      });
      return;
    }
    window.open(EnlaceCorreo(recibo.Correo, `Recibo de préstamo ${recibo.Folio}`, TextoRecibo(recibo)));
    SetAviso({
      tipo: 'exito',
      titulo: 'Recibo enviado por correo',
      texto: `Se abrió el correo con el recibo ${recibo.Folio} dirigido a ${recibo.Correo}.`,
    });
  }

  function EnviarWhatsApp(recibo)
  {
    if (!recibo.Telefono)
    {
      SetAviso({
        tipo: 'error',
        titulo: 'No se pudo enviar el recibo por WhatsApp',
        texto:
          `${recibo.Nombre_Completo} no tiene teléfono registrado en CIAA o Empleados. ` +
          'Entrega el recibo impreso o por correo.',
      });
      return;
    }
    window.open(EnlaceWhatsApp(recibo.Telefono, TextoRecibo(recibo)), '_blank', 'noopener');
    SetAviso({
      tipo: 'exito',
      titulo: 'Recibo enviado por WhatsApp',
      texto:
        `Se abrió WhatsApp con el recibo ${recibo.Folio} para el ` +
        `${TelefonoTexto(recibo.Telefono)}.`,
    });
  }

  return { EnviarCorreo, EnviarWhatsApp };
}

/*
 * Hook: useControladorRecibo
 * Objetivo: BD-SP03-PL02 Recibo de préstamo: mostrarlo y entregarlo impreso, por correo o por
 *           WhatsApp.
 * Entrada: Ninguna (id del préstamo en la ruta)
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorRecibo()
{
  const { id } = useParams();
  const navegar = useNavigate();
  const { datos: recibo, error, cargando } = useCarga(() => ModeloPrestamo.Recibo(id), [id]);
  const [aviso, SetAviso] = useState({
    tipo: 'exito',
    titulo: 'Recibo generado',
    texto: 'El recibo está listo para imprimirse o enviarse al lector.',
  });
  const vista = useVistaRecibo(SetAviso, () => 'Recibo enviado a imprimir');
  const entrega = useEntregaRecibo(SetAviso);

  return {
    recibo,
    error,
    cargando,
    aviso,
    vista,
    Imprimir: () => vista.Abrir(id, recibo),
    EnviarCorreo: () => entrega.EnviarCorreo(recibo),
    EnviarWhatsApp: () => entrega.EnviarWhatsApp(recibo),
    Volver: () => navegar('/prestamos'),
  };
}

/*
 * Hook: useControladorReimprimir
 * Objetivo: BD-SP03-PL02 Reimprimir el recibo de un préstamo activo del lector y entregarlo
 *           impreso, por correo o por WhatsApp, como al registrar el préstamo.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorReimprimir()
{
  const lector = useBusquedaLector();
  const [aviso, SetAviso] = useState(null);
  const [recibo, SetRecibo] = useState(null);
  const [error_recibo, SetErrorRecibo] = useState(null);
  const [cargando_recibo, SetCargandoRecibo] = useState(false);
  const vista = useVistaRecibo(SetAviso, (datos) => `Recibo ${datos.Folio} reimpreso`);
  const entrega = useEntregaRecibo(SetAviso);

  async function Elegir(prestamo)
  {
    SetAviso(null);
    SetErrorRecibo(null);
    SetCargandoRecibo(true);
    try
    {
      SetRecibo(await ModeloPrestamo.Recibo(prestamo.id_prestamo));
    }
    catch (excepcion)
    {
      SetRecibo(null);
      SetErrorRecibo(excepcion);
    }
    finally
    {
      SetCargandoRecibo(false);
    }
  }

  return {
    lector,
    activos: lector.situacion?.activos ?? [],
    aviso,
    vista,
    recibo,
    error_recibo,
    cargando_recibo,
    Buscar: () =>
    {
      SetAviso(null);
      SetRecibo(null);
      lector.Buscar();
    },
    Reimprimir: Elegir,
    Imprimir: () => vista.Abrir(recibo.id_prestamo, recibo),
    EnviarCorreo: () => entrega.EnviarCorreo(recibo),
    EnviarWhatsApp: () => entrega.EnviarWhatsApp(recibo),
  };
}

/*
 * Hook: useControladorRenovar
 * Objetivo: BD-SP03-PL03 Renovar un préstamo del lector (con multa si ya estaba vencido).
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorRenovar()
{
  const navegar = useNavigate();
  const lector = useBusquedaLector();
  const [aviso, SetAviso] = useState(null);
  const [renovado, SetRenovado] = useState(null);
  const [renovando, SetRenovando] = useState(null);

  async function Renovar(prestamo)
  {
    SetAviso(null);
    SetRenovado(null);
    SetRenovando(prestamo.id_prestamo);
    try
    {
      const respuesta = await ModeloPrestamo.Renovar(prestamo.id_prestamo);
      SetRenovado(respuesta);
      const { renovacion, multa } = respuesta;
      SetAviso({
        tipo: 'exito',
        titulo: 'Préstamo renovado',
        texto: multa
          ? `Renovación ${renovacion.Numero} de ${respuesta.prestamo.Max_Renovaciones}. Como el ` +
            `préstamo estaba vencido, se generó la multa ${multa.Folio} por ` +
            `$${multa.Cantidad_a_Pagar.toFixed(2)}.`
          : `Renovación ${renovacion.Numero} de ${respuesta.prestamo.Max_Renovaciones}. Como se ` +
            'renovó antes de vencer, no se generó multa.',
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
      SetRenovando(null);
    }
  }

  const activos = (lector.situacion?.activos ?? []).map((prestamo) =>
    renovado?.prestamo.id_prestamo === prestamo.id_prestamo ? renovado.prestamo : prestamo,
  );
  return {
    lector,
    activos,
    aviso,
    renovado,
    renovando,
    Buscar: () =>
    {
      SetAviso(null);
      SetRenovado(null);
      lector.Buscar();
    },
    Renovar,
    EntregarRecibo: () => navegar(`/prestamos/${renovado.prestamo.id_prestamo}/recibo`),
  };
}

/*
 * Hook: useControladorPrestamosUsuario
 * Objetivo: BD-SP03-PL04 Préstamos activos e historial de un usuario.
 * Entrada: Ninguna (acepta ?matricula= en la dirección)
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorPrestamosUsuario()
{
  const [parametros] = useSearchParams();
  const lector = useBusquedaLector(parametros.get('matricula') ?? '');
  return { lector, situacion: lector.situacion };
}

/*
 * Hook: useControladorListaEspera
 * Objetivo: BD-SP03-PL05 Lista de espera: consultar la de un libro, agregar y quitar lectores
 *           y avisar quién tiene prioridad cuando hay un ejemplar disponible.
 * Entrada: Ninguna (acepta ?q= y ?matricula= en la dirección)
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorListaEspera()
{
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [texto, SetTexto] = useState(parametros.get('q') ?? '');
  const [matricula, SetMatricula] = useState(parametros.get('matricula') ?? '');
  const [datos, SetDatos] = useState(null);
  const [error, SetError] = useState(null);
  const [buscando, SetBuscando] = useState(false);
  const [aviso, SetAviso] = useState(null);
  const [agregado, SetAgregado] = useState(null);
  const [cancelados, SetCancelados] = useState([]);
  const [enviando, SetEnviando] = useState(false);

  async function Buscar(valor = texto)
  {
    SetAviso(null);
    SetAgregado(null);
    SetCancelados([]);
    if (!valor.trim())
    {
      SetDatos(null);
      SetError({ message: 'Escribe el título o el ISBN del libro.' });
      return;
    }
    SetBuscando(true);
    SetError(null);
    try
    {
      SetDatos(await ModeloListaEspera.Buscar(valor));
    }
    catch (excepcion)
    {
      SetDatos(null);
      SetError(excepcion);
    }
    finally
    {
      SetBuscando(false);
    }
  }

  useEffect(() =>
  {
    if (parametros.get('q'))
    {
      Buscar(parametros.get('q'));
    }
  }, []);

  async function Agregar()
  {
    SetAviso(null);
    if (!matricula.trim())
    {
      SetAviso({
        tipo: 'error',
        titulo: 'Falta la matrícula del lector',
        texto: 'Escribe la matrícula o el número de nómina del lector que pide el libro.',
      });
      return;
    }
    SetEnviando(true);
    try
    {
      const respuesta = await ModeloListaEspera.Agregar(datos.libro.id_libro, matricula);
      SetDatos(respuesta);
      SetAgregado(respuesta.id_lista_espera);
      SetMatricula('');
      SetAviso({
        tipo: 'exito',
        titulo: `${respuesta.lector.Nombre_Completo} se agregó a la lista de espera`,
        texto: `Quedó en el lugar ${respuesta.lugar} de la lista.`,
      });
    }
    catch (excepcion)
    {
      const fecha = excepcion.detalles?.fecha;
      SetAviso({
        tipo: 'error',
        titulo: excepcion.message,
        texto: fecha
          ? `Lo tiene prestado hasta el ${FechaCorta(fecha)}, por eso no se puede agregar a la ` +
            'lista de espera.'
          : excepcion.detalles?.mensaje ?? 'Revisa la matrícula e intenta de nuevo.',
      });
    }
    finally
    {
      SetEnviando(false);
    }
  }

  async function Quitar(registro)
  {
    SetAviso(null);
    try
    {
      const respuesta = await ModeloListaEspera.Quitar(registro.id_lista_espera);
      SetDatos(respuesta);
      SetCancelados((previos) => [...previos, registro]);
      SetAviso({
        tipo: 'exito',
        titulo: `Se quitó a ${registro.Nombre_Completo} de la lista de espera`,
        texto: 'La lista de espera se actualizó.',
      });
    }
    catch (excepcion)
    {
      SetAviso({ tipo: 'error', titulo: excepcion.message, texto: null });
    }
  }

  const filas = datos
    ? [
      ...datos.lista,
      ...cancelados.map((registro) => ({ ...registro, Cancelado: true })),
    ].sort((a, b) => a.Fecha_Peticion.localeCompare(b.Fecha_Peticion))
    : [];
  return {
    texto,
    SetTexto,
    matricula,
    SetMatricula,
    datos,
    filas,
    error,
    buscando,
    aviso,
    agregado,
    enviando,
    Buscar: () => Buscar(),
    Agregar,
    Quitar,
    Prestar: (registro) =>
      navegar(
        `/prestamos/registro?matricula=${registro.Matricula_Nomina}` +
          `&isbn=${encodeURIComponent(datos.libro.ISBN)}`,
      ),
  };
}
