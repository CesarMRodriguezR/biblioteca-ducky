import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { UsuarioModel, contrasenaValida } from '../models/UsuarioModel';
import { PerfilModel } from '../models/PerfilModel';
import { useAccion, useCarga } from './useAsync';

const POR_PAGINA = 7;

/** BD-SP01-GU02 "Usuarios válidos": búsqueda por matrícula y paginación. */
export function useUsuariosValidosController() {
  const [params, setParams] = useSearchParams();
  const buscado = params.get('q') ?? '';
  const pagina = Number(params.get('pagina') ?? 1);
  const [texto, setTexto] = useState(buscado);

  const { datos, error, cargando } = useCarga(
    () => UsuarioModel.listar({ q: buscado, limit: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA }),
    [buscado, pagina],
  );

  return {
    usuarios: datos?.datos ?? [],
    total: datos?.total ?? 0,
    pagina,
    totalPaginas: Math.max(1, Math.ceil((datos?.total ?? 0) / POR_PAGINA)),
    porPagina: POR_PAGINA,
    buscado,
    texto,
    setTexto,
    error,
    cargando,
    buscar: () => setParams(texto.trim() ? { q: texto.trim() } : {}),
    irAPagina: (n) => setParams({ ...(buscado && { q: buscado }), pagina: String(n) }),
  };
}

/** Consulta de un usuario por id o por matrícula. */
export function useConsultaUsuarioController() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [matricula, setMatricula] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    UsuarioModel.obtener(id)
      .then((u) => { setUsuario(u); setMatricula(u.Matricula_Nomina); })
      .catch(setError)
      .finally(() => setCargando(false));
  }, [id]);

  async function buscar() {
    if (!matricula.trim()) return;
    setCargando(true);
    setError(null);
    try {
      const u = await UsuarioModel.porMatricula(matricula);
      setUsuario(u);
      navegar(`/usuarios/${u.id_usuario}`, { replace: true });
    } catch (e) {
      setUsuario(null);
      setError(e);
    } finally {
      setCargando(false);
    }
  }

  return { matricula, setMatricula, usuario, error, cargando, buscar };
}

/**
 * Cambio de datos de usuario. La matrícula y el usuario no se modifican;
 * si la contraseña no cumple la regla, no se guarda nada.
 */
export function useCambioUsuarioController() {
  const { id } = useParams();
  const navegar = useNavigate();
  const usuario = useCarga(() => UsuarioModel.obtener(id), [id]);
  const perfiles = useCarga(() => PerfilModel.listar(), []);
  const [form, setForm] = useState({ id_perfil: '', Estatus: '', Contrasena_Usuario: '' });
  const [errores, setErrores] = useState({});
  const [resultado, setResultado] = useState(null);
  const guardar = useAccion((cambios) => UsuarioModel.actualizar(id, cambios));

  useEffect(() => {
    if (usuario.datos) {
      setForm({ id_perfil: String(usuario.datos.id_perfil), Estatus: usuario.datos.Estatus, Contrasena_Usuario: '' });
    }
  }, [usuario.datos]);

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function confirmar() {
    setResultado(null);
    if (form.Contrasena_Usuario && !contrasenaValida(form.Contrasena_Usuario)) {
      setErrores({ Contrasena_Usuario: 'Mínimo 8 caracteres, una mayúscula y un número.' });
      setResultado({
        tipo: 'error',
        titulo: 'No se guardaron los cambios: la contraseña no cumple con los requisitos de seguridad.',
        texto: 'Se conserva la información anterior del usuario.',
      });
      return;
    }
    try {
      const actualizado = await guardar.ejecutar({
        id_perfil: Number(form.id_perfil),
        Estatus: form.Estatus,
        Contrasena_Usuario: form.Contrasena_Usuario || undefined,
      });
      usuario.setDatos({ ...usuario.datos, ...actualizado });
      setForm((f) => ({ ...f, Contrasena_Usuario: '' }));
      setResultado({ tipo: 'exito', titulo: 'Cambios guardados.', texto: 'La información del usuario se actualizó en tiempo real.' });
    } catch (e) {
      setErrores(e.errores ?? {});
      setResultado({ tipo: 'error', titulo: `No se guardaron los cambios: ${e.message}`, texto: 'Se conserva la información anterior del usuario.' });
    }
  }

  return {
    usuario: usuario.datos,
    perfiles: perfiles.datos ?? [],
    cargando: usuario.cargando,
    errorCarga: usuario.error,
    form,
    errores,
    resultado,
    enviando: guardar.enviando,
    cambiar,
    confirmar,
    cancelar: () => navegar(-1),
  };
}

/**
 * Alta de cuentas por lista: cargar archivo → revisión y rol por fila →
 * confirmar registro → cuentas creadas / no creadas.
 */
export function useCargaListaController() {
  const navegar = useNavigate();
  const perfiles = useCarga(() => PerfilModel.listar(), []);
  const [archivo, setArchivo] = useState(null);
  const [filasArchivo, setFilasArchivo] = useState([]);
  const [revision, setRevision] = useState(null); // { validos, errores }
  const [roles, setRoles] = useState({}); // Fila → id_perfil
  const [resultado, setResultado] = useState(null); // { creados, errores }
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  async function cargarArchivo(file) {
    if (!file) return;
    setError(null);
    setResultado(null);
    setProcesando(true);
    try {
      const filas = await UsuarioModel.leerArchivoLista(file);
      const r = await UsuarioModel.validarLista(filas);
      setArchivo(file);
      setFilasArchivo(filas);
      setRevision(r);
      setRoles({});
    } catch (e) {
      setError(e);
      setRevision(null);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarRegistro() {
    setProcesando(true);
    setError(null);
    try {
      const cuentas = revision.validos.map((v) => ({ ...v, id_perfil: roles[v.Fila] ? Number(roles[v.Fila]) : null }));
      const r = await UsuarioModel.crearDesdeLista(cuentas);
      setResultado({ creados: r.creados, errores: [...revision.errores, ...r.errores] });
    } catch (e) {
      setError(e);
    } finally {
      setProcesando(false);
    }
  }

  const perfilesAsignables = useMemo(
    () => (perfiles.datos ?? []).filter((p) => p.Estatus === 'Activo'),
    [perfiles.datos],
  );

  return {
    archivo,
    revision,
    resultado,
    roles,
    perfiles: perfilesAsignables,
    error,
    procesando,
    sinRol: revision ? revision.validos.filter((v) => !roles[v.Fila]).length : 0,
    cargarArchivo,
    asignarRol: (fila, idPerfil) => setRoles((r) => ({ ...r, [fila]: idPerfil })),
    confirmarRegistro,
    reiniciar: () => { setArchivo(null); setRevision(null); setResultado(null); setError(null); },
    revisarBajas: () => navegar('/usuarios/bajas', {
      state: { matriculas: filasArchivo.map((f) => f.Matricula_Nomina), archivo: archivo?.name },
    }),
  };
}

/** Baja de cuentas: usuarios que ya no aparecen en la nueva lista. */
export function useBajasListaController() {
  const ubicacion = useLocation();
  const [nombreArchivo, setNombreArchivo] = useState(ubicacion.state?.archivo ?? null);
  const [candidatos, setCandidatos] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  async function revisar(matriculas) {
    setProcesando(true);
    setError(null);
    setResultado(null);
    try {
      setCandidatos(await UsuarioModel.revisarBajas(matriculas));
    } catch (e) {
      setError(e);
    } finally {
      setProcesando(false);
    }
  }

  useEffect(() => {
    if (ubicacion.state?.matriculas?.length) revisar(ubicacion.state.matriculas);
  }, [ubicacion.state]);

  async function cargarArchivo(file) {
    if (!file) return;
    try {
      const filas = await UsuarioModel.leerArchivoLista(file);
      setNombreArchivo(file.name);
      await revisar(filas.map((f) => f.Matricula_Nomina).filter(Boolean));
    } catch (e) {
      setError(e);
    }
  }

  async function confirmarBajas() {
    setProcesando(true);
    setError(null);
    try {
      setResultado(await UsuarioModel.darDeBaja(candidatos.map((c) => c.id_usuario)));
    } catch (e) {
      setError(e);
    } finally {
      setProcesando(false);
    }
  }

  return { nombreArchivo, candidatos, resultado, error, procesando, cargarArchivo, confirmarBajas };
}

/** Gestión de perfiles: roles y funciones (el Administrador no se modifica). */
export function usePerfilesController() {
  const perfiles = useCarga(() => PerfilModel.listar(), []);
  const funciones = useCarga(() => PerfilModel.funciones(), []);
  const [seleccionado, setSeleccionado] = useState(null);
  const [asignadas, setAsignadas] = useState(new Set());
  const [aviso, setAviso] = useState(null);
  const guardar = useAccion((id, ids) => PerfilModel.asignarFunciones(id, ids));

  const perfil = (perfiles.datos ?? []).find((p) => p.id_perfil === seleccionado) ?? null;

  useEffect(() => {
    if (perfiles.datos && seleccionado === null) setSeleccionado(perfiles.datos[0]?.id_perfil ?? null);
  }, [perfiles.datos, seleccionado]);

  useEffect(() => {
    setAsignadas(new Set(perfil?.funciones ?? []));
    setAviso(null);
  }, [perfil]);

  const original = new Set(perfil?.funciones ?? []);
  const hayCambios = asignadas.size !== original.size || [...asignadas].some((f) => !original.has(f));

  async function guardarCambios() {
    try {
      await guardar.ejecutar(perfil.id_perfil, [...asignadas]);
      await perfiles.recargar();
      setAviso({ tipo: 'exito', titulo: `Funciones de ${perfil.Nombre_Rol} actualizadas.`, texto: 'Los cambios ya aplican a todas las cuentas con este perfil.' });
    } catch (e) {
      setAviso({ tipo: 'error', titulo: e.message });
    }
  }

  return {
    perfiles: perfiles.datos ?? [],
    funciones: funciones.datos ?? [],
    perfil,
    asignadas,
    aviso,
    cargando: perfiles.cargando || funciones.cargando,
    error: perfiles.error || funciones.error,
    enviando: guardar.enviando,
    hayCambios,
    seleccionar: setSeleccionado,
    alternar: (idFuncion, activa) => setAsignadas((s) => {
      const nuevo = new Set(s);
      if (activa) nuevo.add(idFuncion); else nuevo.delete(idFuncion);
      return nuevo;
    }),
    cancelar: () => setAsignadas(new Set(perfil?.funciones ?? [])),
    guardarCambios,
  };
}
