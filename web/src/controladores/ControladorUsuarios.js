/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ControladorUsuarios.js
 * Función: Pantallas de usuarios: válidos, consulta, cambio, carga y baja por lista, y
 *          perfiles.
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
 *     Hook                            Objetivo
 *     POR_PAGINA                      Usuarios por página de la lista de válidos
 *     useControladorUsuariosValidos   BD-SP01-GU02 "Usuarios válidos": búsqueda por matrícula y…
 *     useControladorConsultaUsuario   Consulta de un usuario por id o por matrícula
 *     useControladorCambioUsuario     Cambio de datos de usuario. La matrícula y el usuario no…
 *     useControladorCargaLista        Alta de cuentas por lista: cargar archivo → revisión y…
 *     useControladorBajasLista        Baja de cuentas: usuarios que ya no aparecen en la nueva…
 *     useControladorPerfiles          Gestión de perfiles: roles y funciones (el Administrador…
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
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ModeloUsuario, ContrasenaValida } from '../modelos/ModeloUsuario.js';
import { ModeloPerfil } from '../modelos/ModeloPerfil.js';
import { useAccion, useCarga } from './HooksAsincronos.js';

/*
 * Constante: POR_PAGINA
 * Objetivo: Usuarios por página de la lista de válidos.
 */
const POR_PAGINA = 7;

/*
 * Hook: useControladorUsuariosValidos
 * Objetivo: BD-SP01-GU02 "Usuarios válidos": búsqueda por matrícula y paginación.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorUsuariosValidos()
{
  const [parametros, set_params] = useSearchParams();
  const buscado = parametros.get('q') ?? '';
  const pagina = Number(parametros.get('pagina') ?? 1);
  const [texto, SetTexto] = useState(buscado);

  const { datos, error, cargando } = useCarga(
    () =>
      ModeloUsuario.Listar({ q: buscado, limit: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA }),
    [buscado, pagina],
  );

  return {
    usuarios: datos?.datos ?? [],
    total: datos?.total ?? 0,
    pagina,
    total_paginas: Math.max(1, Math.ceil((datos?.total ?? 0) / POR_PAGINA)),
    por_pagina: POR_PAGINA,
    buscado,
    texto,
    set_texto: SetTexto,
    error,
    cargando,
    Buscar: () => set_params(texto.trim() ? { q: texto.trim() } : {}),
    IrAPagina: (total) => set_params({ ...(buscado && { q: buscado }), pagina: String(total) }),
  };
}

/*
 * Hook: useControladorConsultaUsuario
 * Objetivo: Consulta de un usuario por id o por matrícula.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorConsultaUsuario()
{
  const { id } = useParams();
  const navegar = useNavigate();
  const [matricula, SetMatricula] = useState('');
  const [usuario, SetUsuario] = useState(null);
  const [error, SetError] = useState(null);
  const [cargando, SetCargando] = useState(Boolean(id));

  useEffect(() =>
  {
    if (!id)
    {
      return;
    }
    SetCargando(true);
    ModeloUsuario.Obtener(id)
      .then((resultado) =>
      {
        SetUsuario(resultado);
        SetMatricula(resultado.Matricula_Nomina);
      })
      .catch(SetError)
      .finally(() => SetCargando(false));
  }, [id]);

  async function Buscar()
  {
    if (!matricula.trim())
    {
      return;
    }
    SetCargando(true);
    SetError(null);
    try
    {
      const usuario_actual = await ModeloUsuario.PorMatricula(matricula);
      SetUsuario(usuario_actual);
      navegar(`/usuarios/${usuario_actual.id_usuario}`, { replace: true });
    }
    catch (excepcion)
    {
      SetUsuario(null);
      SetError(excepcion);
    }
    finally
    {
      SetCargando(false);
    }
  }

  return { matricula, set_matricula: SetMatricula, usuario, error, cargando, buscar: Buscar };
}

/*
 * Hook: useControladorCambioUsuario
 * Objetivo: Cambio de datos de usuario. La matrícula y el usuario no se modifican; si la
 *           contraseña no cumple la regla, no se guarda nada.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorCambioUsuario()
{
  const { id } = useParams();
  const navegar = useNavigate();
  const usuario = useCarga(() => ModeloUsuario.Obtener(id), [id]);
  const perfiles = useCarga(() => ModeloPerfil.Listar(), []);
  const [form, SetForm] = useState({ id_perfil: '', Estatus: '', Contrasena_Usuario: '' });
  const [errores, SetErrores] = useState({});
  const [resultado, SetResultado] = useState(null);
  const guardar = useAccion((cambios) => ModeloUsuario.Actualizar(id, cambios));

  useEffect(() =>
  {
    if (usuario.datos)
    {
      SetForm({
        id_perfil: String(usuario.datos.id_perfil),
        Estatus: usuario.datos.Estatus,
        Contrasena_Usuario: '',
      });
    }
  }, [usuario.datos]);

  const Cambiar = (campo) => (evento) =>
  {
    SetForm((form_previo) => ({ ...form_previo, [campo]: evento.target.value }));
    SetErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function Confirmar()
  {
    SetResultado(null);
    if (form.Contrasena_Usuario && !ContrasenaValida(form.Contrasena_Usuario))
    {
      SetErrores({ Contrasena_Usuario: 'Mínimo 8 caracteres, una mayúscula y un número.' });
      SetResultado({
        tipo: 'error',
        titulo:
          'No se guardaron los cambios: la contraseña no cumple con los requisitos de seguridad.',
        texto: 'Se conserva la información anterior del usuario.',
      });
      return;
    }
    try
    {
      const actualizado = await guardar.ejecutar({
        id_perfil: Number(form.id_perfil),
        Estatus: form.Estatus,
        Contrasena_Usuario: form.Contrasena_Usuario || undefined,
      });
      usuario.SetDatos({ ...usuario.datos, ...actualizado });
      SetForm((form_previo) => ({ ...form_previo, Contrasena_Usuario: '' }));
      SetResultado({
        tipo: 'exito',
        titulo: 'Cambios guardados.',
        texto: 'La información del usuario se actualizó en tiempo real.',
      });
    }
    catch (error)
    {
      SetErrores(error.errores ?? {});
      SetResultado({
        tipo: 'error',
        titulo: `No se guardaron los cambios: ${error.message}`,
        texto: 'Se conserva la información anterior del usuario.',
      });
    }
  }

  return {
    usuario: usuario.datos,
    perfiles: perfiles.datos ?? [],
    cargando: usuario.cargando,
    error_carga: usuario.error,
    form,
    errores,
    resultado,
    enviando: guardar.enviando,
    cambiar: Cambiar,
    confirmar: Confirmar,
    Cancelar: () => navegar(-1),
  };
}

/*
 * Hook: useControladorCargaLista
 * Objetivo: Alta de cuentas por lista: cargar archivo → revisión y rol por fila → confirmar
 *           registro → cuentas creadas / no creadas.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorCargaLista()
{
  const navegar = useNavigate();
  const perfiles = useCarga(() => ModeloPerfil.Listar(), []);
  const [archivo, SetArchivo] = useState(null);
  const [filas_archivo, SetFilasArchivo] = useState([]);
  const [revision, SetRevision] = useState(null); // { validos, errores }
  const [roles, SetRoles] = useState({}); // Fila → id_perfil
  const [resultado, SetResultado] = useState(null); // { creados, errores }
  const [error, SetError] = useState(null);
  const [procesando, SetProcesando] = useState(false);

  async function CargarArchivo(archivo_actual)
  {
    if (!archivo_actual)
    {
      return;
    }
    SetError(null);
    SetResultado(null);
    SetProcesando(true);
    try
    {
      const filas = await ModeloUsuario.LeerArchivoLista(archivo_actual);
      const resultado_actual = await ModeloUsuario.ValidarLista(filas);
      SetArchivo(archivo_actual);
      SetFilasArchivo(filas);
      SetRevision(resultado_actual);
      SetRoles({});
    }
    catch (excepcion)
    {
      SetError(excepcion);
      SetRevision(null);
    }
    finally
    {
      SetProcesando(false);
    }
  }

  async function ConfirmarRegistro()
  {
    SetProcesando(true);
    SetError(null);
    try
    {
      const cuentas = revision.validos.map((valido) => ({
        ...valido,
        id_perfil: roles[valido.Fila] ? Number(roles[valido.Fila]) : null,
      }));
      const resultado_actual = await ModeloUsuario.CrearDesdeLista(cuentas);
      SetResultado({
        creados: resultado_actual.creados,
        errores: [...revision.errores, ...resultado_actual.errores],
      });
    }
    catch (excepcion)
    {
      SetError(excepcion);
    }
    finally
    {
      SetProcesando(false);
    }
  }

  const perfiles_asignables = useMemo(
    () => (perfiles.datos ?? []).filter((elemento) => elemento.Estatus === 'Activo'),
    [perfiles.datos],
  );

  return {
    archivo,
    revision,
    resultado,
    roles,
    perfiles: perfiles_asignables,
    error,
    procesando,
    sin_rol: revision ? revision.validos.filter((valido) => !roles[valido.Fila]).length : 0,
    cargar_archivo: CargarArchivo,
    AsignarRol: (fila, id_perfil) =>
      SetRoles((roles_previo) => ({ ...roles_previo, [fila]: id_perfil })),
    confirmar_registro: ConfirmarRegistro,
    Reiniciar: () =>
    {
      SetArchivo(null);
      SetRevision(null);
      SetResultado(null);
      SetError(null);
    },
    RevisarBajas: () =>
      navegar('/usuarios/bajas', {
        state: {
          matriculas: filas_archivo.map((elemento) => elemento.Matricula_Nomina),
          archivo: archivo?.name,
        },
      }),
  };
}

/*
 * Hook: useControladorBajasLista
 * Objetivo: Baja de cuentas: usuarios que ya no aparecen en la nueva lista.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorBajasLista()
{
  const ubicacion = useLocation();
  const [nombre_archivo, SetNombreArchivo] = useState(ubicacion.state?.archivo ?? null);
  const [candidatos, SetCandidatos] = useState(null);
  const [resultado, SetResultado] = useState(null);
  const [error, SetError] = useState(null);
  const [procesando, SetProcesando] = useState(false);

  async function Revisar(matriculas)
  {
    SetProcesando(true);
    SetError(null);
    SetResultado(null);
    try
    {
      SetCandidatos(await ModeloUsuario.RevisarBajas(matriculas));
    }
    catch (excepcion)
    {
      SetError(excepcion);
    }
    finally
    {
      SetProcesando(false);
    }
  }

  useEffect(() =>
  {
    if (ubicacion.state?.matriculas?.length)
    {
      Revisar(ubicacion.state.matriculas);
    }
  }, [ubicacion.state]);

  async function CargarArchivo(archivo)
  {
    if (!archivo)
    {
      return;
    }
    try
    {
      const filas = await ModeloUsuario.LeerArchivoLista(archivo);
      SetNombreArchivo(archivo.name);
      await Revisar(filas.map((fila) => fila.Matricula_Nomina).filter(Boolean));
    }
    catch (excepcion)
    {
      SetError(excepcion);
    }
  }

  async function ConfirmarBajas()
  {
    SetProcesando(true);
    SetError(null);
    try
    {
      SetResultado(
        await ModeloUsuario.DarDeBaja(candidatos.map((candidato) => candidato.id_usuario)),
      );
    }
    catch (excepcion)
    {
      SetError(excepcion);
    }
    finally
    {
      SetProcesando(false);
    }
  }

  return {
    nombre_archivo,
    candidatos,
    resultado,
    error,
    procesando,
    cargar_archivo: CargarArchivo,
    confirmar_bajas: ConfirmarBajas,
  };
}

/*
 * Hook: useControladorPerfiles
 * Objetivo: Gestión de perfiles: roles y funciones (el Administrador no se modifica).
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorPerfiles()
{
  const perfiles = useCarga(() => ModeloPerfil.Listar(), []);
  const funciones = useCarga(() => ModeloPerfil.ListarFunciones(), []);
  const [seleccionado, SetSeleccionado] = useState(null);
  const [asignadas, SetAsignadas] = useState(new Set());
  const [aviso, SetAviso] = useState(null);
  const guardar = useAccion((id, ids) => ModeloPerfil.AsignarFunciones(id, ids));

  const perfil =
    (perfiles.datos ?? []).find((elemento) => elemento.id_perfil === seleccionado) ?? null;

  useEffect(() =>
  {
    if (perfiles.datos && seleccionado === null)
    {
      SetSeleccionado(perfiles.datos[0]?.id_perfil ?? null);
    }
  }, [perfiles.datos, seleccionado]);

  useEffect(() =>
  {
    SetAsignadas(new Set(perfil?.funciones ?? []));
    SetAviso(null);
  }, [perfil]);

  const original = new Set(perfil?.funciones ?? []);
  const hay_cambios =
    asignadas.size !== original.size || [...asignadas].some((elemento) => !original.has(elemento));

  async function GuardarCambios()
  {
    try
    {
      await guardar.ejecutar(perfil.id_perfil, [...asignadas]);
      await perfiles.recargar();
      SetAviso({
        tipo: 'exito',
        titulo: `Funciones de ${perfil.Nombre_Rol} actualizadas.`,
        texto: 'Los cambios ya aplican a todas las cuentas con este perfil.',
      });
    }
    catch (error)
    {
      SetAviso({ tipo: 'error', titulo: error.message });
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
    hay_cambios,
    seleccionar: SetSeleccionado,
    Alternar: (id_funcion, activa) =>
      SetAsignadas((asignadas_previo) =>
      {
        const nuevo = new Set(asignadas_previo);
        if (activa)
        {
          nuevo.add(id_funcion);
        }
        else
        {
          nuevo.delete(id_funcion);
        }
        return nuevo;
      }),
    Cancelar: () => SetAsignadas(new Set(perfil?.funciones ?? [])),
    guardar_cambios: GuardarCambios,
  };
}
