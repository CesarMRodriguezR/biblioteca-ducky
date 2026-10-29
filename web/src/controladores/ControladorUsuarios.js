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
 *     useControladorCargaLista        Alta de cuentas por lista: la API genera la lista con…
 *     useControladorBajasLista        Baja de cuentas: usuarios que ya no aparecen en CIAA ni…
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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
    SetTexto,
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

  return { matricula, SetMatricula, usuario, error, cargando, Buscar };
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
      const actualizado = await guardar.Ejecutar({
        id_perfil: form.id_perfil,
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
    Cambiar,
    Confirmar,
    Cancelar: () => navegar(-1),
  };
}

/*
 * Hook: useControladorCargaLista
 * Objetivo: Alta de cuentas por lista: la API genera la lista con CIAA y Empleados → revisión
 *           y rol por persona (sugerido según su tipo) → confirmar registro → cuentas creadas
 *           y registros con error. Tras corregir en el sistema de origen se genera de nuevo.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorCargaLista()
{
  const navegar = useNavigate();
  const perfiles = useCarga(() => ModeloPerfil.Listar(), []);
  const [revision, SetRevision] = useState(null); // { generado_el, fuentes, altas, bajas }
  const [roles, SetRoles] = useState({}); // Matricula_Nomina → id_perfil
  const [resultado, SetResultado] = useState(null); // { creados, errores }
  const [error, SetError] = useState(null);
  const [procesando, SetProcesando] = useState(true);
  const [corregidos, SetCorregidos] = useState(false);

  async function Generar()
  {
    SetError(null);
    SetProcesando(true);
    try
    {
      const lista = await ModeloUsuario.GenerarLista();
      SetRevision(lista);
      SetRoles(
        Object.fromEntries(
          lista.altas.validos.map((valido) => [
            valido.Matricula_Nomina,
            valido.id_perfil_sugerido ? String(valido.id_perfil_sugerido) : '',
          ]),
        ),
      );
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

  useEffect(() =>
  {
    Generar();
  }, []);

  async function ConfirmarRegistro()
  {
    SetProcesando(true);
    SetError(null);
    try
    {
      const cuentas = revision.altas.validos.map((valido) => ({
        Matricula_Nomina: valido.Matricula_Nomina,
        id_perfil: roles[valido.Matricula_Nomina] || null,
      }));
      const resultado_actual = await ModeloUsuario.CrearDesdeLista(cuentas);
      SetResultado({
        creados: resultado_actual.creados,
        errores: [...revision.altas.errores, ...resultado_actual.errores],
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
  const validos = revision?.altas.validos ?? [];

  return {
    revision,
    validos,
    resultado,
    roles,
    perfiles: perfiles_asignables,
    error,
    procesando,
    corregidos,
    sin_rol: validos.filter((valido) => !roles[valido.Matricula_Nomina]).length,
    AsignarRol: (matricula, id_perfil) =>
      SetRoles((roles_previo) => ({ ...roles_previo, [matricula]: id_perfil })),
    ConfirmarRegistro,
    GenerarDeNuevo: async () =>
    {
      SetCorregidos(Boolean(resultado?.errores.length));
      SetResultado(null);
      await Generar();
    },
    RevisarBajas: () => navegar('/usuarios/bajas'),
  };
}

/*
 * Hook: useControladorBajasLista
 * Objetivo: Baja de cuentas: usuarios que ya no aparecen en CIAA ni en Empleados.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorBajasLista()
{
  const lista = useCarga(() => ModeloUsuario.GenerarLista(), []);
  const [resultado, SetResultado] = useState(null);
  const [error, SetError] = useState(null);
  const [procesando, SetProcesando] = useState(false);

  async function ConfirmarBajas()
  {
    SetProcesando(true);
    SetError(null);
    try
    {
      SetResultado(
        await ModeloUsuario.DarDeBaja(lista.datos.bajas.map((candidato) => candidato.id_usuario)),
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
    candidatos: lista.datos?.bajas ?? null,
    fuentes: lista.datos?.fuentes ?? null,
    resultado,
    error: error ?? lista.error,
    procesando: procesando || lista.cargando,
    ConfirmarBajas,
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
      await guardar.Ejecutar(perfil.id_perfil, [...asignadas]);
      await perfiles.Recargar();
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
    Seleccionar: SetSeleccionado,
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
    GuardarCambios,
  };
}
