import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CompraModel, EditorialModel, EjemplarModel, LibroModel,
} from '../models/LibroModel';
import { useAccion, useCarga } from './useAsync';

const FICHA_VACIA = {
  ISBN: '', Precio: '', Titulo: '', Autor: '', id_editorial: '', Anio: '', Tema: '', Sinopsis: '',
};
const CAMPOS_FICHA = ['ISBN', 'Precio', 'Titulo', 'Autor', 'id_editorial', 'Anio', 'Tema', 'Sinopsis'];

/** Valida en el cliente lo mismo que la API para avisar antes de enviar. */
export function validarFicha(ficha, { conPrecio = true, conIsbn = true } = {}) {
  const errores = {};
  const obligatorio = 'Este campo es obligatorio.';
  if (conIsbn) {
    if (!ficha.ISBN.trim()) errores.ISBN = obligatorio;
    else if (!/^[0-9-]+$/.test(ficha.ISBN.trim())) errores.ISBN = 'Formato inválido: solo números y guiones.';
    else if (![10, 13].includes(ficha.ISBN.replace(/-/g, '').length)) errores.ISBN = 'El ISBN debe tener 10 o 13 dígitos.';
  }
  ['Titulo', 'Autor', 'Tema', 'Sinopsis'].forEach((c) => { if (!String(ficha[c]).trim()) errores[c] = obligatorio; });
  if (!ficha.id_editorial) errores.id_editorial = obligatorio;
  if (!/^\d{4}$/.test(String(ficha.Anio).trim())) errores.Anio = 'Debe ser un número de 4 dígitos, p. ej. 2022.';
  if (conPrecio && !(Number(ficha.Precio) > 0)) {
    errores.Precio = 'Debe ser un precio mayor a $0.00 en pesos mexicanos; no se aceptan cero ni negativos.';
  }
  return errores;
}

export function useEditoriales() {
  const { datos, recargar } = useCarga(() => EditorialModel.listar(), []);
  const opciones = useMemo(
    () => (datos ?? []).map((e) => ({ valor: String(e.id_editorial), etiqueta: `${e.Nombre_Editorial} · ${e.Pais}` })),
    [datos],
  );
  return { editoriales: datos ?? [], opciones, recargar };
}

/** Pantalla principal de Libros: libros registrados (activos e inactivos). */
export function useLibrosRegistradosController() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const pagina = Number(params.get('pagina') ?? 1);
  const [texto, setTexto] = useState(q);
  const porPagina = 8;

  const { datos, error, cargando } = useCarga(
    () => LibroModel.buscar({ q, campo: q ? 'todos' : undefined, pagina, porPagina, inactivos: true }),
    [q, pagina],
  );

  return {
    libros: datos?.datos ?? [],
    total: datos?.total ?? 0,
    totalPaginas: Math.max(1, Math.ceil((datos?.total ?? 0) / porPagina)),
    pagina,
    q,
    texto,
    setTexto,
    error,
    cargando,
    buscar: () => setParams(texto.trim() ? { q: texto.trim() } : {}),
    irAPagina: (n) => setParams({ ...(q && { q }), pagina: String(n) }),
  };
}

/**
 * BD-SP02-GL02 Alta de libro: el ISBN se valida primero; si ya existe se
 * muestra la ficha para agregar ejemplares. Tras guardar la ficha se
 * habilita el panel de ejemplares.
 */
export function useAltaLibroController() {
  const navegar = useNavigate();
  const { opciones: editoriales } = useEditoriales();
  const [ficha, setFicha] = useState(FICHA_VACIA);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [libro, setLibro] = useState(null); // ficha recién guardada o existente
  const [existente, setExistente] = useState(false);
  const guardar = useAccion((datos) => LibroModel.crear(datos));
  const agregar = useAccion((id, datos) => EjemplarModel.agregar(id, datos));

  const cambiar = (campo) => (e) => {
    setFicha((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function validarIsbn() {
    const isbn = ficha.ISBN.trim();
    if (!isbn || !/^[0-9-]+$/.test(isbn)) return;
    try {
      const encontrado = await LibroModel.porIsbn(isbn);
      setLibro(encontrado);
      setExistente(true);
      setErrores((er) => ({ ...er, ISBN: 'Ya existe una ficha con este ISBN. Puedes agregarle ejemplares.' }));
    } catch {
      if (existente) { setLibro(null); setExistente(false); }
    }
  }

  async function guardarFicha() {
    const encontrados = validarFicha(ficha);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      setAviso({ tipo: 'error', titulo: 'Revisa los campos marcados.', texto: 'Todos los campos son obligatorios.' });
      return;
    }
    try {
      const nuevo = await guardar.ejecutar({
        ...ficha,
        id_editorial: Number(ficha.id_editorial),
        Anio: Number(ficha.Anio),
        Precio: Number(ficha.Precio),
      });
      setLibro(nuevo);
      setExistente(false);
      setFicha(FICHA_VACIA);
      setAviso({
        tipo: 'exito',
        titulo: 'Ficha bibliográfica registrada.',
        texto: `Se registró la ficha con ISBN ${nuevo.ISBN} y el catálogo se actualizó. Ahora agrega los ejemplares del libro.`,
      });
    } catch (e) {
      setErrores(e.errores);
      if (e.codigo === 'ISBN_DUPLICADO') {
        setLibro(await LibroModel.obtener(e.detalles.id_libro));
        setExistente(true);
      }
      setAviso({ tipo: 'error', titulo: e.message });
    }
  }

  async function agregarEjemplares(datos) {
    const actualizado = await agregar.ejecutar(libro.id_libro, datos);
    setLibro(actualizado);
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
    errorEjemplares: agregar.error,
    cambiar,
    validarIsbn,
    guardarFicha,
    agregarEjemplares,
    nuevaFicha: () => { setFicha(FICHA_VACIA); setLibro(null); setExistente(false); setAviso(null); setErrores({}); },
    cancelar: () => navegar('/libros'),
  };
}

/** BD-SP02-GL04 Editar libro: ficha bibliográfica y estado de copias. */
export function useEditarLibroController() {
  const { id } = useParams();
  const { opciones: editoriales } = useEditoriales();
  const carga = useCarga(() => LibroModel.obtener(id), [id]);
  const libro = carga.datos;
  const [ficha, setFicha] = useState(null);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [copiaElegida, setCopiaElegida] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('Disponible');
  const [avisoCopia, setAvisoCopia] = useState(null);
  const guardar = useAccion((cambios) => LibroModel.actualizar(id, cambios));
  const guardarCopia = useAccion((num, estado) => EjemplarModel.cambiarEstado(id, num, estado));

  const original = useMemo(() => libro && {
    Titulo: libro.Titulo,
    ISBN: libro.ISBN,
    Autor: libro.Autor,
    id_editorial: String(libro.id_editorial),
    Anio: String(libro.Anio ?? ''),
    Tema: libro.Tema,
    Numero_Copias: String(libro.Ejemplares_Totales),
    Sinopsis: libro.Sinopsis ?? '',
  }, [libro]);

  useEffect(() => {
    if (original) setFicha(original);
  }, [original]);

  useEffect(() => {
    if (!libro?.ejemplares) return;
    const primera = libro.ejemplares.find((e) => ['Disponible', 'Consulta externa'].includes(e.Estatus));
    setCopiaElegida((actual) => actual ?? primera?.num_copia ?? null);
  }, [libro]);

  const copia = libro?.ejemplares?.find((e) => e.num_copia === copiaElegida) ?? null;
  useEffect(() => {
    if (copia && ['Disponible', 'Consulta externa'].includes(copia.Estatus)) setNuevoEstado(copia.Estatus);
  }, [copia]);

  const modificados = ficha && original ? Object.keys(original).filter((k) => ficha[k] !== original[k]) : [];
  const inactivo = libro?.Estatus === 'Inactivo';

  const cambiar = (campo) => (e) => {
    setFicha((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function guardarCambios() {
    const encontrados = validarFicha(ficha, { conPrecio: false, conIsbn: false });
    if (!(Number(ficha.Numero_Copias) >= 1) || !Number.isInteger(Number(ficha.Numero_Copias))) {
      encontrados.Numero_Copias = 'Debe ser 1 o más; no se aceptan números negativos ni cero.';
    }
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      setAviso({ tipo: 'error', titulo: 'No se guardaron los cambios: hay datos incompletos o inválidos.' });
      return;
    }
    const cambios = {};
    modificados.forEach((k) => { cambios[k] = ficha[k]; });
    ['id_editorial', 'Anio', 'Numero_Copias'].forEach((k) => { if (k in cambios) cambios[k] = Number(cambios[k]); });
    try {
      const actualizado = await guardar.ejecutar(cambios);
      carga.setDatos(actualizado);
      setAviso({ tipo: 'exito', titulo: 'Cambios guardados.', texto: 'La ficha bibliográfica y el catálogo se actualizaron.' });
    } catch (e) {
      setErrores(e.errores);
      setAviso({ tipo: 'error', titulo: e.message });
    }
  }

  async function guardarEstadoCopia() {
    try {
      await guardarCopia.ejecutar(copia.num_copia, nuevoEstado);
      await carga.recargar();
      setAvisoCopia({ tipo: 'exito', titulo: `Estado de ${copia.Codigo} actualizado a ${nuevoEstado}.` });
    } catch (e) {
      setAvisoCopia({ tipo: 'error', titulo: e.message });
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
    errorCarga: carga.error,
    enviando: guardar.enviando,
    copia,
    copiaElegida,
    nuevoEstado,
    avisoCopia,
    guardandoCopia: guardarCopia.enviando,
    cambiar,
    intentarCambiarIsbn: () => setErrores((er) => ({ ...er, ISBN: 'No se puede cambiar el ISBN de un libro.' })),
    descartar: () => { setFicha(original); setErrores({}); setAviso(null); },
    guardarCambios,
    elegirCopia: (num) => { setCopiaElegida(num); setAvisoCopia(null); },
    setNuevoEstado,
    guardarEstadoCopia,
  };
}

/** BD-SP02-GL03 Baja de libro: retirar una copia o activar/inactivar el libro. */
export function useBajaLibroController() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const carga = useCarga(() => LibroModel.obtener(id), [id]);
  const [modo, setModo] = useState(params.get('modo') === 'estatus' ? 'estatus' : 'copia');
  const [copiaElegida, setCopiaElegida] = useState(null);
  const [motivo, setMotivo] = useState(null);
  const [aviso, setAviso] = useState(null);
  const retirar = useAccion((num, m) => EjemplarModel.retirar(id, num, m));
  const estatus = useAccion((e) => LibroModel.cambiarEstatus(id, e));

  useEffect(() => { setAviso(null); }, [modo]);

  async function retirarCopia() {
    if (!copiaElegida) { setAviso({ tipo: 'error', titulo: 'Elige la copia que quieres retirar.' }); return; }
    if (!motivo) { setAviso({ tipo: 'error', titulo: 'Elige el motivo de la baja.' }); return; }
    try {
      const copia = await retirar.ejecutar(copiaElegida, motivo);
      await carga.recargar();
      setCopiaElegida(null);
      setMotivo(null);
      setAviso({ tipo: 'exito', titulo: 'Copia dada de baja.', texto: `${copia.Codigo} quedó inactiva. El catálogo ya se actualizó.` });
    } catch (e) {
      setAviso({ tipo: 'error', titulo: e.message });
    }
  }

  async function cambiarEstatusLibro() {
    const destino = carga.datos.Estatus === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      const libro = await estatus.ejecutar(destino);
      carga.setDatos({ ...carga.datos, ...libro });
      setAviso({
        tipo: 'exito',
        titulo: destino === 'Inactivo' ? 'Libro inactivado.' : 'Libro reactivado.',
        texto: destino === 'Inactivo'
          ? 'Dejó de aparecer en el catálogo y en las búsquedas.'
          : 'Vuelve a aparecer en el catálogo y se puede editar.',
      });
    } catch (e) {
      const copias = e.detalles?.copias;
      setAviso({
        tipo: 'error',
        titulo: copias ? 'No se puede inactivar el libro: tiene copias en préstamo.' : e.message,
        texto: copias
          ? `${copias.join(', ')} ${copias.length === 1 ? 'sigue prestada' : 'siguen prestadas'}. El libro, sus copias y su ficha no se modificaron; vuelve a intentarlo cuando todas las copias se hayan devuelto.`
          : null,
      });
    }
  }

  return {
    libro: carga.datos,
    cargando: carga.cargando && !carga.datos,
    errorCarga: carga.error,
    modo,
    setModo,
    copiaElegida,
    elegirCopia: setCopiaElegida,
    motivo,
    setMotivo,
    aviso,
    enviando: retirar.enviando || estatus.enviando,
    retirarCopia,
    cambiarEstatusLibro,
    cancelar: () => { setCopiaElegida(null); setMotivo(null); setAviso(null); navegar('/libros'); },
  };
}

/**
 * BD-SP02-GL01 Solicitar libros: título nuevo o más copias de uno
 * registrado; muestra solicitudes pendientes y el catálogo de editoriales.
 */
export function useSolicitudCompraController() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { editoriales, opciones, recargar: recargarEditoriales } = useEditoriales();
  const solicitudes = useCarga(() => CompraModel.solicitudes(), []);
  const libroBase = useCarga(() => (id ? LibroModel.obtener(id) : Promise.resolve(null)), [id]);
  const [form, setForm] = useState({ ...FICHA_VACIA, Num_Ejemplares: '' });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const enviar = useAccion((datos) => (id
    ? CompraModel.solicitarCopias(Number(id), datos.Num_Ejemplares)
    : CompraModel.solicitarNuevo(datos)));

  useEffect(() => {
    const l = libroBase.datos;
    if (l) {
      setForm({
        ISBN: l.ISBN, Titulo: l.Titulo, Autor: l.Autor, id_editorial: String(l.id_editorial),
        Anio: String(l.Anio ?? ''), Tema: l.Tema, Sinopsis: l.Sinopsis ?? '', Precio: '', Num_Ejemplares: '',
      });
    }
  }, [libroBase.datos]);

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function enviarSolicitud() {
    const encontrados = id ? {} : validarFicha(form, { conPrecio: false });
    const n = Number(form.Num_Ejemplares);
    if (!form.Num_Ejemplares || !Number.isInteger(n) || n < 1) {
      encontrados.Num_Ejemplares = id
        ? 'Debe ser 1 o más; no se acepta vacío ni cero.'
        : 'Debe ser 1 o más; no se aceptan cero ni negativos.';
    }
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      setAviso({ tipo: 'error', titulo: 'No se envió la solicitud: revisa los campos marcados.' });
      return;
    }
    try {
      await enviar.ejecutar({
        ...form,
        Num_Ejemplares: n,
        id_editorial: Number(form.id_editorial),
        Anio: Number(form.Anio),
        Precio: 0,
      });
      await solicitudes.recargar();
      setAviso({ tipo: 'exito', titulo: 'Solicitud enviada.', texto: 'Se envió a Tesorería para validar el presupuesto mensual.' });
      if (id) setForm((f) => ({ ...f, Num_Ejemplares: '' }));
      else setForm({ ...FICHA_VACIA, Num_Ejemplares: '' });
    } catch (e) {
      setErrores(Object.fromEntries(Object.entries(e.errores).map(([k, v]) => [k.split('.').pop(), v])));
      setAviso({ tipo: 'error', titulo: e.message });
    }
  }

  async function guardarEditorial(idEditorial, datos) {
    if (idEditorial) await EditorialModel.actualizar(idEditorial, datos);
    else await EditorialModel.crear(datos);
    await recargarEditoriales();
  }

  async function eliminarEditorial(idEditorial) {
    await EditorialModel.eliminar(idEditorial);
    await recargarEditoriales();
  }

  return {
    modoCopias: Boolean(id),
    libro: libroBase.datos,
    form,
    errores,
    aviso,
    editoriales,
    opcionesEditorial: opciones,
    solicitudes: solicitudes.datos ?? [],
    enviando: enviar.enviando,
    cambiar,
    enviarSolicitud,
    guardarEditorial,
    eliminarEditorial,
    cancelar: () => navegar('/libros'),
  };
}

export { CAMPOS_FICHA };
