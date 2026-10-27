/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL · ControladorLibros.js
 * Función: Pantallas de libros: registrados, alta, edición, baja y solicitud de compra.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Parámetros de la ruta y acciones del usuario en la pantalla
 * Salida: Estado y acciones que consume la vista
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Hook                              Objetivo
 *     FICHA_VACIA                       Valores iniciales del formulario de ficha bibliográfica
 *     CAMPOS_FICHA                      Campos de la ficha que se validan y envían
 *     ValidarFicha                      Valida en el cliente lo mismo que la API para avisar…
 *     useEditoriales                    Cargar las editoriales y prepararlas como opciones de…
 *     useControladorLibrosRegistrados   Pantalla principal de Libros: libros registrados (activos…
 *     useControladorAltaLibro           BD-SP02-GL02 Alta de libro: el ISBN se valida primero; si…
 *     useControladorEditarLibro         BD-SP02-GL04 Editar libro: ficha bibliográfica y estado…
 *     useControladorBajaLibro           BD-SP02-GL03 Baja de libro: retirar una copia o…
 *     useControladorSolicitudCompra     BD-SP02-GL01 Solicitar libros: título nuevo o más copias…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado, valida y llama al
 *     modelo.
 * (2) No devuelve JSX y no llama a la API directamente; usa los modelos de src/modelos.
 * (3) Los hooks solo se llaman en el nivel superior del componente, nunca dentro de condiciones
 *     o ciclos.
 * (4) Todo componente que lo use debe estar dentro de ProveedorSesion.
 * ******************************************************************
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ModeloCompra,
  ModeloEditorial,
  ModeloEjemplar,
  ModeloLibro,
} from '../modelos/ModelosLibros.js';
import { useAccion, useCarga } from './HooksAsincronos.js';

/*
 * Constante: FICHA_VACIA
 * Objetivo: Valores iniciales del formulario de ficha bibliográfica.
 */
const FICHA_VACIA = {
  ISBN: '',
  Precio: '',
  Titulo: '',
  Autor: '',
  id_editorial: '',
  Anio: '',
  Tema: '',
  Sinopsis: '',
};
/*
 * Constante: CAMPOS_FICHA
 * Objetivo: Campos de la ficha que se validan y envían.
 */
const CAMPOS_FICHA = [
  'ISBN',
  'Precio',
  'Titulo',
  'Autor',
  'id_editorial',
  'Anio',
  'Tema',
  'Sinopsis',
];

/*
 * Función: ValidarFicha
 * Objetivo: Valida en el cliente lo mismo que la API para avisar antes de enviar.
 * Entrada: ficha, { conPrecio?, conIsbn? } (opcional)
 * Salida: Objeto { campo: mensaje } con los errores encontrados
 */
export function ValidarFicha(
  ficha,
  { conPrecio: con_precio = true, conIsbn: con_isbn = true } = {},
)
{
  const errores = {};
  const obligatorio = 'Este campo es obligatorio.';
  if (con_isbn)
  {
    if (!ficha.ISBN.trim())
    {
      errores.ISBN = obligatorio;
    }
    else if (!/^[0-9-]+$/.test(ficha.ISBN.trim()))
    {
      errores.ISBN = 'Formato inválido: solo números y guiones.';
    }
    else if (![10, 13].includes(ficha.ISBN.replace(/-/g, '').length))
    {
      errores.ISBN = 'El ISBN debe tener 10 o 13 dígitos.';
    }
  }
  ['Titulo', 'Autor', 'Tema', 'Sinopsis'].forEach((elemento) =>
  {
    if (!String(ficha[elemento]).trim())
    {
      errores[elemento] = obligatorio;
    }
  });
  if (!ficha.id_editorial)
  {
    errores.id_editorial = obligatorio;
  }
  if (!/^\d{4}$/.test(String(ficha.Anio).trim()))
  {
    errores.Anio = 'Debe ser un número de 4 dígitos, p. ej. 2022.';
  }
  if (con_precio && !(Number(ficha.Precio) > 0))
  {
    errores.Precio =
      'Debe ser un precio mayor a $0.00 en pesos mexicanos; no se aceptan cero ni negativos.';
  }
  return errores;
}

/*
 * Hook: useEditoriales
 * Objetivo: Cargar las editoriales y prepararlas como opciones de selección.
 * Entrada: Ninguna
 * Salida: Objeto con editoriales, opciones y Recargar
 */
export function useEditoriales()
{
  const { datos, recargar } = useCarga(() => ModeloEditorial.Listar(), []);
  const opciones = useMemo(
    () =>
      (datos ?? []).map((elemento) => ({
        valor: String(elemento.id_editorial),
        etiqueta: `${elemento.Nombre_Editorial} · ${elemento.Pais}`,
      })),
    [datos],
  );
  return { editoriales: datos ?? [], opciones, recargar };
}

/*
 * Hook: useControladorLibrosRegistrados
 * Objetivo: Pantalla principal de Libros: libros registrados (activos e inactivos).
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorLibrosRegistrados()
{
  const [parametros, set_params] = useSearchParams();
  const texto_busqueda = parametros.get('q') ?? '';
  const pagina = Number(parametros.get('pagina') ?? 1);
  const [texto, SetTexto] = useState(texto_busqueda);
  const por_pagina = 8;

  const { datos, error, cargando } = useCarga(
    () =>
      ModeloLibro.Buscar({
        q: texto_busqueda,
        campo: texto_busqueda ? 'todos' : undefined,
        pagina,
        porPagina: por_pagina,
        inactivos: true,
      }),
    [texto_busqueda, pagina],
  );

  return {
    libros: datos?.datos ?? [],
    total: datos?.total ?? 0,
    total_paginas: Math.max(1, Math.ceil((datos?.total ?? 0) / por_pagina)),
    pagina,
    q: texto_busqueda,
    texto,
    set_texto: SetTexto,
    error,
    cargando,
    Buscar: () => set_params(texto.trim() ? { q: texto.trim() } : {}),
    IrAPagina: (total) =>
      set_params({ ...(texto_busqueda && { q: texto_busqueda }), pagina: String(total) }),
  };
}

/*
 * Hook: useControladorAltaLibro
 * Objetivo: BD-SP02-GL02 Alta de libro: el ISBN se valida primero; si ya existe se muestra la
 *           ficha para agregar ejemplares. Tras guardar la ficha se habilita el panel de
 *           ejemplares.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorAltaLibro()
{
  const navegar = useNavigate();
  const { opciones: editoriales } = useEditoriales();
  const [ficha, SetFicha] = useState(FICHA_VACIA);
  const [errores, SetErrores] = useState({});
  const [aviso, SetAviso] = useState(null);
  const [libro, SetLibro] = useState(null); // ficha recién guardada o existente
  const [existente, SetExistente] = useState(false);
  const guardar = useAccion((datos) => ModeloLibro.Crear(datos));
  const agregar = useAccion((id, datos) => ModeloEjemplar.Agregar(id, datos));

  const Cambiar = (campo) => (evento) =>
  {
    SetFicha((ficha_previo) => ({ ...ficha_previo, [campo]: evento.target.value }));
    SetErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function ValidarIsbn()
  {
    const isbn = ficha.ISBN.trim();
    if (!isbn || !/^[0-9-]+$/.test(isbn))
    {
      return;
    }
    try
    {
      const encontrado = await ModeloLibro.PorIsbn(isbn);
      SetLibro(encontrado);
      SetExistente(true);
      SetErrores((er) => ({
        ...er,
        ISBN: 'Ya existe una ficha con este ISBN. Puedes agregarle ejemplares.',
      }));
    }
    catch
    {
      if (existente)
      {
        SetLibro(null);
        SetExistente(false);
      }
    }
  }

  async function GuardarFicha()
  {
    const encontrados = ValidarFicha(ficha);
    SetErrores(encontrados);
    if (Object.keys(encontrados).length)
    {
      SetAviso({
        tipo: 'error',
        titulo: 'Revisa los campos marcados.',
        texto: 'Todos los campos son obligatorios.',
      });
      return;
    }
    try
    {
      const nuevo = await guardar.ejecutar({
        ...ficha,
        id_editorial: Number(ficha.id_editorial),
        Anio: Number(ficha.Anio),
        Precio: Number(ficha.Precio),
      });
      SetLibro(nuevo);
      SetExistente(false);
      SetFicha(FICHA_VACIA);
      SetAviso({
        tipo: 'exito',
        titulo: 'Ficha bibliográfica registrada.',
        texto: `Se registró la ficha con ISBN ${nuevo.ISBN} y el catálogo se actualizó. Ahora agrega los ejemplares del libro.`,
      });
    }
    catch (error)
    {
      SetErrores(error.errores);
      if (error.codigo === 'ISBN_DUPLICADO')
      {
        SetLibro(await ModeloLibro.Obtener(error.detalles.id_libro));
        SetExistente(true);
      }
      SetAviso({ tipo: 'error', titulo: error.message });
    }
  }

  async function AgregarEjemplares(datos)
  {
    const actualizado = await agregar.ejecutar(libro.id_libro, datos);
    SetLibro(actualizado);
    return actualizado;
  }

  return {
    ficha,
    errores,
    aviso,
    editoriales,
    libro,
    existente,
    enviando: guardar.enviando,
    agregando: agregar.enviando,
    error_ejemplares: agregar.error,
    cambiar: Cambiar,
    validar_isbn: ValidarIsbn,
    guardar_ficha: GuardarFicha,
    agregar_ejemplares: AgregarEjemplares,
    NuevaFicha: () =>
    {
      SetFicha(FICHA_VACIA);
      SetLibro(null);
      SetExistente(false);
      SetAviso(null);
      SetErrores({});
    },
    Cancelar: () => navegar('/libros'),
  };
}

/*
 * Hook: useControladorEditarLibro
 * Objetivo: BD-SP02-GL04 Editar libro: ficha bibliográfica y estado de copias.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorEditarLibro()
{
  const { id } = useParams();
  const { opciones: editoriales } = useEditoriales();
  const carga = useCarga(() => ModeloLibro.Obtener(id), [id]);
  const libro = carga.datos;
  const [ficha, SetFicha] = useState(null);
  const [errores, SetErrores] = useState({});
  const [aviso, SetAviso] = useState(null);
  const [copia_elegida, SetCopiaElegida] = useState(null);
  const [nuevo_estado, SetNuevoEstado] = useState('Disponible');
  const [aviso_copia, SetAvisoCopia] = useState(null);
  const guardar = useAccion((cambios) => ModeloLibro.Actualizar(id, cambios));
  const guardar_copia = useAccion((num, estado) => ModeloEjemplar.CambiarEstado(id, num, estado));

  const original = useMemo(
    () =>
      libro && {
        Titulo: libro.Titulo,
        ISBN: libro.ISBN,
        Autor: libro.Autor,
        id_editorial: String(libro.id_editorial),
        Anio: String(libro.Anio ?? ''),
        Tema: libro.Tema,
        Numero_Copias: String(libro.Ejemplares_Totales),
        Sinopsis: libro.Sinopsis ?? '',
      },
    [libro],
  );

  useEffect(() =>
  {
    if (original)
    {
      SetFicha(original);
    }
  }, [original]);

  useEffect(() =>
  {
    if (!libro?.ejemplares)
    {
      return;
    }
    const primera = libro.ejemplares.find((ejemplar) =>
      ['Disponible', 'Consulta externa'].includes(ejemplar.Estatus),
    );
    SetCopiaElegida((actual) => actual ?? primera?.num_copia ?? null);
  }, [libro]);

  const copia = libro?.ejemplares?.find((evento) => evento.num_copia === copia_elegida) ?? null;
  useEffect(() =>
  {
    if (copia && ['Disponible', 'Consulta externa'].includes(copia.Estatus))
    {
      SetNuevoEstado(copia.Estatus);
    }
  }, [copia]);

  const modificados =
    ficha && original
      ? Object.keys(original).filter((clave) => ficha[clave] !== original[clave])
      : [];
  const inactivo = libro?.Estatus === 'Inactivo';

  const Cambiar = (campo) => (evento) =>
  {
    SetFicha((ficha_previo) => ({ ...ficha_previo, [campo]: evento.target.value }));
    SetErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function GuardarCambios()
  {
    const encontrados = ValidarFicha(ficha, { conPrecio: false, conIsbn: false });
    if (!(Number(ficha.Numero_Copias) >= 1) || !Number.isInteger(Number(ficha.Numero_Copias)))
    {
      encontrados.Numero_Copias = 'Debe ser 1 o más; no se aceptan números negativos ni cero.';
    }
    SetErrores(encontrados);
    if (Object.keys(encontrados).length)
    {
      SetAviso({
        tipo: 'error',
        titulo: 'No se guardaron los cambios: hay datos incompletos o inválidos.',
      });
      return;
    }
    const cambios = {};
    modificados.forEach((modificado) =>
    {
      cambios[modificado] = ficha[modificado];
    });
    ['id_editorial', 'Anio', 'Numero_Copias'].forEach((elemento) =>
    {
      if (elemento in cambios)
      {
        cambios[elemento] = Number(cambios[elemento]);
      }
    });
    try
    {
      const actualizado = await guardar.ejecutar(cambios);
      carga.SetDatos(actualizado);
      SetAviso({
        tipo: 'exito',
        titulo: 'Cambios guardados.',
        texto: 'La ficha bibliográfica y el catálogo se actualizaron.',
      });
    }
    catch (error)
    {
      SetErrores(error.errores);
      SetAviso({ tipo: 'error', titulo: error.message });
    }
  }

  async function GuardarEstadoCopia()
  {
    try
    {
      await guardar_copia.ejecutar(copia.num_copia, nuevo_estado);
      await carga.recargar();
      SetAvisoCopia({
        tipo: 'exito',
        titulo: `Estado de ${copia.Codigo} actualizado a ${nuevo_estado}.`,
      });
    }
    catch (error)
    {
      SetAvisoCopia({ tipo: 'error', titulo: error.message });
    }
  }

  return {
    libro,
    ficha,
    original,
    editoriales,
    errores,
    aviso,
    modificados,
    inactivo,
    cargando: carga.cargando && !libro,
    error_carga: carga.error,
    enviando: guardar.enviando,
    copia,
    copia_elegida,
    nuevo_estado,
    aviso_copia,
    guardando_copia: guardar_copia.enviando,
    cambiar: Cambiar,
    IntentarCambiarIsbn: () =>
      SetErrores((er) => ({ ...er, ISBN: 'No se puede cambiar el ISBN de un libro.' })),
    Descartar: () =>
    {
      SetFicha(original);
      SetErrores({});
      SetAviso(null);
    },
    guardar_cambios: GuardarCambios,
    ElegirCopia: (num) =>
    {
      SetCopiaElegida(num);
      SetAvisoCopia(null);
    },
    set_nuevo_estado: SetNuevoEstado,
    guardar_estado_copia: GuardarEstadoCopia,
  };
}

/*
 * Hook: useControladorBajaLibro
 * Objetivo: BD-SP02-GL03 Baja de libro: retirar una copia o activar/inactivar el libro.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorBajaLibro()
{
  const { id } = useParams();
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const carga = useCarga(() => ModeloLibro.Obtener(id), [id]);
  const [modo, SetModo] = useState(parametros.get('modo') === 'estatus' ? 'estatus' : 'copia');
  const [copia_elegida, SetCopiaElegida] = useState(null);
  const [motivo, SetMotivo] = useState(null);
  const [aviso, SetAviso] = useState(null);
  const retirar = useAccion((num, mes) => ModeloEjemplar.Retirar(id, num, mes));
  const estatus = useAccion((evento) => ModeloLibro.CambiarEstatus(id, evento));

  useEffect(() =>
  {
    SetAviso(null);
  }, [modo]);

  async function RetirarCopia()
  {
    if (!copia_elegida)
    {
      SetAviso({ tipo: 'error', titulo: 'Elige la copia que quieres retirar.' });
      return;
    }
    if (!motivo)
    {
      SetAviso({ tipo: 'error', titulo: 'Elige el motivo de la baja.' });
      return;
    }
    try
    {
      const copia = await retirar.ejecutar(copia_elegida, motivo);
      await carga.recargar();
      SetCopiaElegida(null);
      SetMotivo(null);
      SetAviso({
        tipo: 'exito',
        titulo: 'Copia dada de baja.',
        texto: `${copia.Codigo} quedó inactiva. El catálogo ya se actualizó.`,
      });
    }
    catch (error)
    {
      SetAviso({ tipo: 'error', titulo: error.message });
    }
  }

  async function CambiarEstatusLibro()
  {
    const destino = carga.datos.Estatus === 'Activo' ? 'Inactivo' : 'Activo';
    try
    {
      const libro = await estatus.ejecutar(destino);
      carga.SetDatos({ ...carga.datos, ...libro });
      SetAviso({
        tipo: 'exito',
        titulo: destino === 'Inactivo' ? 'Libro inactivado.' : 'Libro reactivado.',
        texto:
          destino === 'Inactivo'
            ? 'Dejó de aparecer en el catálogo y en las búsquedas.'
            : 'Vuelve a aparecer en el catálogo y se puede editar.',
      });
    }
    catch (error)
    {
      const copias = error.detalles?.copias;
      SetAviso({
        tipo: 'error',
        titulo: copias
          ? 'No se puede inactivar el libro: tiene copias en préstamo.'
          : error.message,
        texto: copias
          ? `${copias.join(', ')} ${copias.length === 1 ? 'sigue prestada' : 'siguen prestadas'}. El libro, sus copias y su ficha no se modificaron; vuelve a intentarlo cuando todas las copias se hayan devuelto.`
          : null,
      });
    }
  }

  return {
    libro: carga.datos,
    cargando: carga.cargando && !carga.datos,
    error_carga: carga.error,
    modo,
    set_modo: SetModo,
    copia_elegida,
    elegir_copia: SetCopiaElegida,
    motivo,
    set_motivo: SetMotivo,
    aviso,
    enviando: retirar.enviando || estatus.enviando,
    retirar_copia: RetirarCopia,
    cambiar_estatus_libro: CambiarEstatusLibro,
    Cancelar: () =>
    {
      SetCopiaElegida(null);
      SetMotivo(null);
      SetAviso(null);
      navegar('/libros');
    },
  };
}

/*
 * Hook: useControladorSolicitudCompra
 * Objetivo: BD-SP02-GL01 Solicitar libros: título nuevo o más copias de uno registrado; muestra
 *           solicitudes pendientes y el catálogo de editoriales.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorSolicitudCompra()
{
  const { id } = useParams();
  const navegar = useNavigate();
  const { editoriales, opciones, recargar: recargar_editoriales } = useEditoriales();
  const solicitudes = useCarga(() => ModeloCompra.Solicitudes(), []);
  const libro_base = useCarga(() => (id ? ModeloLibro.Obtener(id) : Promise.resolve(null)), [id]);
  const [form, SetForm] = useState({ ...FICHA_VACIA, Num_Ejemplares: '' });
  const [errores, SetErrores] = useState({});
  const [aviso, SetAviso] = useState(null);
  const enviar = useAccion((datos) =>
    id
      ? ModeloCompra.SolicitarCopias(Number(id), datos.Num_Ejemplares)
      : ModeloCompra.SolicitarNuevo(datos),
  );

  useEffect(() =>
  {
    const libro = libro_base.datos;
    if (libro)
    {
      SetForm({
        ISBN: libro.ISBN,
        Titulo: libro.Titulo,
        Autor: libro.Autor,
        id_editorial: String(libro.id_editorial),
        Anio: String(libro.Anio ?? ''),
        Tema: libro.Tema,
        Sinopsis: libro.Sinopsis ?? '',
        Precio: '',
        Num_Ejemplares: '',
      });
    }
  }, [libro_base.datos]);

  const Cambiar = (campo) => (evento) =>
  {
    SetForm((form_previo) => ({ ...form_previo, [campo]: evento.target.value }));
    SetErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function EnviarSolicitud()
  {
    const encontrados = id ? {} : ValidarFicha(form, { conPrecio: false });
    const total = Number(form.Num_Ejemplares);
    if (!form.Num_Ejemplares || !Number.isInteger(total) || total < 1)
    {
      encontrados.Num_Ejemplares = id
        ? 'Debe ser 1 o más; no se acepta vacío ni cero.'
        : 'Debe ser 1 o más; no se aceptan cero ni negativos.';
    }
    SetErrores(encontrados);
    if (Object.keys(encontrados).length)
    {
      SetAviso({ tipo: 'error', titulo: 'No se envió la solicitud: revisa los campos marcados.' });
      return;
    }
    try
    {
      await enviar.ejecutar({
        ...form,
        Num_Ejemplares: total,
        id_editorial: Number(form.id_editorial),
        Anio: Number(form.Anio),
        Precio: 0,
      });
      await solicitudes.recargar();
      SetAviso({
        tipo: 'exito',
        titulo: 'Solicitud enviada.',
        texto: 'Se envió a Tesorería para validar el presupuesto mensual.',
      });
      if (id)
      {
        SetForm((form_previo) => ({ ...form_previo, Num_Ejemplares: '' }));
      }
      else
      {
        SetForm({ ...FICHA_VACIA, Num_Ejemplares: '' });
      }
    }
    catch (error)
    {
      SetErrores(
        Object.fromEntries(
          Object.entries(error.errores).map(([clave, valor]) => [clave.split('.').pop(), valor]),
        ),
      );
      SetAviso({ tipo: 'error', titulo: error.message });
    }
  }

  async function GuardarEditorial(id_editorial, datos)
  {
    if (id_editorial)
    {
      await ModeloEditorial.Actualizar(id_editorial, datos);
    }
    else
    {
      await ModeloEditorial.Crear(datos);
    }
    await recargar_editoriales();
  }

  async function EliminarEditorial(id_editorial)
  {
    await ModeloEditorial.Eliminar(id_editorial);
    await recargar_editoriales();
  }

  return {
    modo_copias: Boolean(id),
    libro: libro_base.datos,
    form,
    errores,
    aviso,
    editoriales,
    opciones_editorial: opciones,
    solicitudes: solicitudes.datos ?? [],
    enviando: enviar.enviando,
    cambiar: Cambiar,
    enviar_solicitud: EnviarSolicitud,
    guardar_editorial: GuardarEditorial,
    eliminar_editorial: EliminarEditorial,
    Cancelar: () => navegar('/libros'),
  };
}

export { CAMPOS_FICHA };
