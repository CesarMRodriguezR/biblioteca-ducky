/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · ModeloListaUsuarios.js
 * Función: Generar la lista de alta y de baja de cuentas comparando las cuentas de Biblio con
 *          los alumnos del CIAA y los empleados del sistema de Empleados, y aplicarla.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Datos de las APIs externas y roles elegidos por el administrador
 * Salida: Lista de altas (válidas y con error), lista de bajas y resultado de aplicarlas
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                Objetivo
 *     ROL_POR_TIPO          Rol de Biblio que se sugiere según el tipo de persona
 *     ContrasenaInicial     Contraseña inicial: la matrícula o nómina precedida de 000
 *     Limpiar               Pasar un nombre a minúsculas sin acentos ni espacios
 *     NombreCompleto        Unir nombres y apellidos
 *     GenerarNombreUsuario  Formar nombre.apellido sin repetir usuarios existentes
 *     RevisarPersona        Detectar datos incompletos o con formato inválido
 *     ModeloListaUsuarios   Generar y aplicar la lista de altas y bajas
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Altas: personas activas en CIAA o Empleados cuya matrícula/nómina no tiene cuenta.
 *     Bajas: cuentas activas (no administradoras) cuya matrícula/nómina ya no aparece en
 *     ninguno de los dos sistemas.
 * (2) De los sistemas externos Biblio toma solo nombre, apellidos, matrícula o nómina, correo
 *     institucional y tipo; el usuario se forma como nombre.apellido.
 * (3) Al confirmar, la lista se vuelve a generar en el servidor: el cliente solo envía la
 *     matrícula y el rol elegido, nunca los datos personales.
 * ******************************************************************
 */

import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ModeloCiaa } from './ModeloCiaa.js';
import { ModeloEmpleados } from './ModeloEmpleados.js';
import { ModeloUsuario } from './ModeloUsuario.js';

/*
 * Constante: ROL_POR_TIPO
 * Objetivo: Rol de Biblio que se sugiere según el tipo de persona en el sistema externo. Los
 *           directivos no tienen sugerencia: el administrador elige su rol.
 */
const ROL_POR_TIPO = {
  Alumno: 'Alumno',
  Docente: 'Profesor',
  Bibliotecario: 'Bibliotecario',
  Administrativo: 'Colaborador',
};

/*
 * Función: ContrasenaInicial
 * Objetivo: Contraseña inicial de las cuentas nuevas: la matrícula o nómina precedida de 000.
 * Entrada: matricula
 * Salida: Texto, p. ej. 0003105842
 */
function ContrasenaInicial(matricula)
{
  return `000${matricula}`;
}

/*
 * Función: Limpiar
 * Objetivo: Pasar una palabra a minúsculas, sin acentos, sin ñ y sin espacios ni signos.
 * Entrada: texto
 * Salida: Texto limpio (p. ej. «Treviño» → «trevino»)
 */
function Limpiar(texto)
{
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/*
 * Función: NombreCompleto
 * Objetivo: Unir nombres y apellidos de una persona.
 * Entrada: persona
 * Salida: Texto con el nombre completo
 */
function NombreCompleto(persona)
{
  return [
    persona.Nombre,
    persona.Segundo_Nombre,
    persona.Apellido_Paterno,
    persona.Apellido_Materno,
  ]
    .map((parte) => String(parte ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/*
 * Función: GenerarNombreUsuario
 * Objetivo: Formar el usuario nombre.apellido. Si ya existe, prueba con la inicial del segundo
 *           nombre (cesarm.rodriguez), luego con la inicial del apellido materno y al final con
 *           un número.
 * Entrada: persona, ocupados (Set con los usuarios ya tomados; se le agrega el nuevo)
 * Salida: Nombre de usuario
 */
function GenerarNombreUsuario(persona, ocupados)
{
  const nombre = Limpiar(String(persona.Nombre).trim().split(/\s+/)[0]);
  const apellido = Limpiar(persona.Apellido_Paterno);
  const inicial_segundo = Limpiar(persona.Segundo_Nombre).charAt(0);
  const inicial_materno = Limpiar(persona.Apellido_Materno).charAt(0);
  const candidatos = [`${nombre}.${apellido}`];
  if (inicial_segundo)
  {
    candidatos.push(`${nombre}${inicial_segundo}.${apellido}`);
  }
  if (inicial_materno)
  {
    candidatos.push(`${nombre}.${apellido}${inicial_materno}`);
  }
  let usuario = candidatos.find((candidato) => !ocupados.has(candidato));
  for (let numero = 2; !usuario; numero += 1)
  {
    usuario = ocupados.has(`${nombre}.${apellido}${numero}`) ? null : `${nombre}.${apellido}${numero}`;
  }
  ocupados.add(usuario);
  return usuario;
}

/*
 * Función: RevisarPersona
 * Objetivo: Detectar datos incompletos o con formato inválido en un registro externo.
 * Entrada: persona
 * Salida: { Campo, Error } o null si el registro es válido
 */
function RevisarPersona(persona)
{
  const campo_clave = persona.Origen === 'CIAA' ? 'Matrícula' : 'No. de nómina';
  if (!persona.Matricula_Nomina)
  {
    return { Campo: campo_clave, Error: `Dato incompleto: la ${campo_clave.toLowerCase()} está vacía` };
  }
  if (!/^\d{1,10}$/.test(persona.Matricula_Nomina))
  {
    return { Campo: campo_clave, Error: 'Formato inválido: solo se permiten números' };
  }
  if (!Limpiar(persona.Nombre) || !Limpiar(persona.Apellido_Paterno))
  {
    return { Campo: 'Nombre', Error: 'Dato incompleto: el nombre está vacío' };
  }
  return null;
}

/*
 * Módulo: ModeloListaUsuarios
 * Objetivo: Generar y aplicar la lista de altas y bajas de cuentas.
 */
const ModeloListaUsuarios = {
  contrasena_inicial: ContrasenaInicial,
  generar_nombre_usuario: GenerarNombreUsuario,

  /*
   * Función: Generar
   * Objetivo: Consultar CIAA y Empleados y compararlos con las cuentas de Biblio.
   * Entrada: Ninguna
   * Salida: Promesa con { generado_el, fuentes, altas: { validos, errores }, bajas }
   */
  async Generar()
  {
    const [alumnos, empleados, perfiles, cuentas] = await Promise.all([
      ModeloCiaa.ObtenerInscritos(),
      ModeloEmpleados.ObtenerActivos(),
      Consultar('SELECT id_perfil, Nombre_Rol FROM Perfiles WHERE Estatus = \'Activo\''),
      Consultar('SELECT Matricula_Nomina, Nombre_Usuario FROM Usuarios'),
    ]);
    const perfil_por_rol = new Map(perfiles.map((perfil) => [perfil.Nombre_Rol, perfil.id_perfil]));
    const con_cuenta = new Set(cuentas.map((cuenta) => cuenta.Matricula_Nomina));
    const ocupados = new Set(cuentas.map((cuenta) => cuenta.Nombre_Usuario));
    const personas = [...alumnos, ...empleados];
    const repetidas = new Set(
      personas
        .map((persona) => persona.Matricula_Nomina)
        .filter((matricula, indice, todas) => matricula && todas.indexOf(matricula) !== indice),
    );

    const validos = [];
    const errores = [];
    personas.forEach((persona) =>
    {
      if (con_cuenta.has(persona.Matricula_Nomina))
      {
        return;
      }
      const problema = repetidas.has(persona.Matricula_Nomina)
        ? { Campo: 'Matrícula', Error: 'Aparece en CIAA y en Empleados con el mismo número' }
        : RevisarPersona(persona);
      if (problema)
      {
        errores.push({
          Origen: persona.Origen,
          Matricula_Nomina: persona.Matricula_Nomina || '—',
          Nombre_Completo: NombreCompleto(persona) || '—',
          ...problema,
        });
        return;
      }
      const rol = ROL_POR_TIPO[persona.Tipo] ?? null;
      validos.push({
        Origen: persona.Origen,
        Tipo: persona.Tipo,
        Matricula_Nomina: persona.Matricula_Nomina,
        Nombre_Completo: NombreCompleto(persona),
        Nombre_Usuario: GenerarNombreUsuario(persona, ocupados),
        Correo: persona.Correo,
        Rol_Sugerido: rol,
        id_perfil_sugerido: perfil_por_rol.get(rol) ?? null,
      });
    });

    const vigentes = personas.map((persona) => persona.Matricula_Nomina).filter(Boolean);
    return {
      generado_el: new Date().toISOString(),
      fuentes: { CIAA: alumnos.length, Empleados: empleados.length },
      altas: { validos, errores },
      bajas: await ModeloUsuario.RevisarBajas(vigentes),
    };
  },

  /*
   * Función: CrearCuentas
   * Objetivo: Crear las cuentas elegidas con su rol. La lista se vuelve a generar para usar
   *           los datos vigentes de CIAA y Empleados.
   * Entrada: cuentas ([{ Matricula_Nomina, id_perfil }])
   * Salida: Promesa con { creados, errores }
   */
  async CrearCuentas(cuentas)
  {
    const { altas } = await ModeloListaUsuarios.Generar();
    const por_matricula = new Map(altas.validos.map((valido) => [valido.Matricula_Nomina, valido]));
    const errores = [];
    const por_crear = [];
    cuentas.forEach((cuenta) =>
    {
      const valido = por_matricula.get(String(cuenta.Matricula_Nomina));
      if (!valido)
      {
        errores.push({
          Origen: '—',
          Matricula_Nomina: String(cuenta.Matricula_Nomina),
          Nombre_Completo: '—',
          Campo: 'Matrícula',
          Error: 'Ya no aparece como nueva en CIAA ni en Empleados',
        });
      }
      else if (!cuenta.id_perfil)
      {
        errores.push({ ...valido, Campo: 'Rol', Error: 'Sin rol asignado' });
      }
      else
      {
        por_crear.push({ ...valido, id_perfil: cuenta.id_perfil });
      }
    });

    const creados = await EjecutarEnTransaccion(async (conexion) =>
    {
      const lista = [];
      for (const cuenta of por_crear)
      {
        const contrasena = ContrasenaInicial(cuenta.Matricula_Nomina);
        const usuario = await ModeloUsuario.Crear(
          { ...cuenta, Contrasena_Usuario: contrasena },
          conexion,
        );
        usuario.funciones = await ModeloUsuario.FuncionesDePerfil(cuenta.id_perfil, conexion);
        lista.push({ ...usuario, Origen: cuenta.Origen, Contrasena_Inicial: contrasena });
      }
      return lista;
    });
    return { creados, errores };
  },

  /*
   * Función: DarDeBaja
   * Objetivo: Dar de baja las cuentas elegidas que de verdad ya no aparecen en CIAA ni en
   *           Empleados; las demás se rechazan.
   * Entrada: ids
   * Salida: Promesa con { dados_de_baja, rechazados }
   */
  async DarDeBaja(ids)
  {
    const { bajas } = await ModeloListaUsuarios.Generar();
    const candidatos = new Set(bajas.map((baja) => baja.id_usuario));
    const no_candidatos = ids.filter((id) => !candidatos.has(id));
    const resultado = await ModeloUsuario.DarDeBaja(ids.filter((id) => candidatos.has(id)));
    for (const id of no_candidatos)
    {
      const usuario = await ModeloUsuario.BuscarPorId(id);
      resultado.rechazados.push({
        ...(usuario ?? { id_usuario: id }),
        Motivo: usuario
          ? 'Sigue apareciendo en CIAA o en Empleados'
          : 'Usuario no encontrado',
      });
    }
    return resultado;
  },
};

export { ModeloListaUsuarios };
