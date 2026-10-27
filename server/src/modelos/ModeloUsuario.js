/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU · ModeloUsuario.js
 * Función: Cuentas de usuario: sesión, intentos fallidos, consulta, cambios, alta y baja por
 *          lista.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Datos validados por los controladores
 * Salida: Filas de la base de datos MariaDB o ErrorHttp si se rompe una regla
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     MAX_INTENTOS        Intentos fallidos permitidos antes de bloquear la cuenta
 *     CAMPOS_PUBLICOS     Columnas del usuario que se pueden enviar al cliente
 *     FROM_USUARIOS       FROM y JOIN comunes de las consultas de usuarios
 *     ContrasenaInicial   Contraseña inicial de las cuentas creadas por lista:…
 *     FuncionesDePerfil   Obtener los códigos de función activos de un perfil
 *     ModeloUsuario       Acceso a las cuentas de usuario
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Modelo del patrón MVC: contiene la lógica de negocio y el acceso a la base de datos.
 * (2) Toda consulta es parametrizada (?); nunca se concatenan datos del usuario en el SQL.
 * (3) Requiere la base de datos creada con database/01_schema.sql y la conexión de
 *     configuracion/conexion.js.
 * (4) Las operaciones que modifican varias tablas usan EjecutarEnTransaccion.
 * ******************************************************************
 */

import bcrypt from 'bcryptjs';
import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';

/*
 * Constante: MAX_INTENTOS
 * Objetivo: Intentos fallidos permitidos antes de bloquear la cuenta.
 */
const MAX_INTENTOS = 5;

/*
 * Constante: CAMPOS_PUBLICOS
 * Objetivo: Columnas del usuario que se pueden enviar al cliente.
 */
const CAMPOS_PUBLICOS = `
  u.id_usuario, u.Nombre_Usuario, u.Nombre_Completo, u.Correo, u.Matricula_Nomina,
  u.Estatus, u.id_perfil, p.Nombre_Rol`;

/*
 * Constante: FROM_USUARIOS
 * Objetivo: FROM y JOIN comunes de las consultas de usuarios.
 */
const FROM_USUARIOS = 'FROM Usuarios u JOIN Perfiles p ON p.id_perfil = u.id_perfil';

/*
 * Función: ContrasenaInicial
 * Objetivo: Contraseña inicial de las cuentas creadas por lista: matrícula a 10 dígitos.
 * Entrada: matricula
 * Salida: Texto de 10 dígitos
 */
function ContrasenaInicial(matricula)
{
  return String(matricula).padStart(10, '0');
}

/*
 * Función: FuncionesDePerfil
 * Objetivo: Obtener los códigos de función activos de un perfil.
 * Entrada: id_perfil, conexion
 * Salida: Promesa con los códigos
 */
async function FuncionesDePerfil(id_perfil, conexion)
{
  const filas = await Consultar(
    `SELECT f.Nombre_Funcion
       FROM PerfilFuncion pf
       JOIN Funciones f ON f.id_funcion = pf.id_funcion
      WHERE pf.id_perfil = ? AND f.Estatus = 'Activo'`,
    [id_perfil],
    conexion,
  );
  return filas.map((fila) => fila.Nombre_Funcion);
}

/*
 * Módulo: ModeloUsuario
 * Objetivo: Acceso a las cuentas de usuario.
 */
const ModeloUsuario = {
  MAX_INTENTOS,
  contrasena_inicial: ContrasenaInicial,

  /*
   * Función: BuscarTodos
   * Objetivo: Listar usuarios con búsqueda, filtro por perfil y estatus, y paginación.
   * Entrada: { q, id_perfil, estatus, limit?, offset? } (opcional)
   * Salida: Promesa con { total, datos }
   */
  async BuscarTodos(
    { q: texto_busqueda, id_perfil, estatus, limit = 100, offset = 0 } = {},
  )
  {
    const condicion = [];
    const parametros = [];
    if (texto_busqueda)
    {
      condicion.push(
        '(u.Matricula_Nomina LIKE ? OR u.Nombre_Completo LIKE ? OR u.Nombre_Usuario LIKE ?)',
      );
      parametros.push(`${texto_busqueda}%`, `%${texto_busqueda}%`, `%${texto_busqueda}%`);
    }
    if (id_perfil)
    {
      condicion.push('u.id_perfil = ?');
      parametros.push(id_perfil);
    }
    if (estatus)
    {
      condicion.push('u.Estatus = ?');
      parametros.push(estatus);
    }
    const where_sql = condicion.length ? `WHERE ${condicion.join(' AND ')}` : '';

    const [{ total }] = await Consultar(
      `SELECT COUNT(*) AS total ${FROM_USUARIOS} ${where_sql}`,
      parametros,
    );
    const datos = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} ${where_sql}
        ORDER BY u.Estatus = 'Activo' DESC, u.Nombre_Completo
        LIMIT ? OFFSET ?`,
      [...parametros, Number(limit), Number(offset)],
    );
    return { total, datos };
  },

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener un usuario con su perfil.
   * Entrada: id, conexion
   * Salida: Promesa con el registro encontrado o null si no existe
   */
  async BuscarPorId(id, conexion)
  {
    const filas = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} WHERE u.id_usuario = ?`,
      [id],
      conexion,
    );
    return filas[0] || null;
  },

  /*
   * Función: BuscarPorMatricula
   * Objetivo: Obtener un usuario por su matrícula o número de nómina.
   * Entrada: matricula, conexion
   * Salida: Promesa con el usuario o null
   */
  async BuscarPorMatricula(matricula, conexion)
  {
    const filas = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} WHERE u.Matricula_Nomina = ?`,
      [matricula],
      conexion,
    );
    return filas[0] || null;
  },

  /*
   * Función: BuscarParaInicioSesion
   * Objetivo: Incluye hash e intentos; solo para el inicio de sesión.
   * Entrada: usuario
   * Salida: Promesa con el usuario o null
   */
  async BuscarParaInicioSesion(usuario)
  {
    const filas = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS}, u.Contrasena_Usuario, u.Intentos_Fallidos
         ${FROM_USUARIOS}
        WHERE u.Nombre_Usuario = ?`,
      [usuario],
    );
    return filas[0] || null;
  },

  /*
   * Función: BuscarSesionPorId
   * Objetivo: Datos de sesión: usuario + funciones vigentes del perfil.
   * Entrada: id
   * Salida: Promesa con el usuario y sus funciones, o null
   */
  async BuscarSesionPorId(id)
  {
    const usuario = await ModeloUsuario.BuscarPorId(id);
    if (!usuario)
    {
      return null;
    }
    usuario.funciones = await FuncionesDePerfil(usuario.id_perfil);
    return usuario;
  },

  /*
   * Función: BuscarDetalle
   * Objetivo: Detalle con préstamos activos y multas pendientes (consulta de usuario).
   * Entrada: id
   * Salida: Promesa con el usuario, Libros_Prestados y Multas_Pendientes, o null
   */
  async BuscarDetalle(id)
  {
    const usuario = await ModeloUsuario.BuscarSesionPorId(id);
    if (!usuario)
    {
      return null;
    }
    const [[prestamos], [multas]] = await Promise.all([
      Consultar(
        `SELECT COUNT(*) AS n FROM Prestamos
          WHERE id_usuario = ? AND Estado IN ('Activo','Vencido')`,
        [id],
      ),
      Consultar(
        `SELECT COALESCE(SUM(Cantidad_a_Pagar), 0) AS total FROM Multas
          WHERE id_usuario = ? AND Fecha_Pagado IS NULL`,
        [id],
      ),
    ]);
    return { ...usuario, Libros_Prestados: prestamos.n, Multas_Pendientes: multas.total };
  },

  /*
   * Función: VerificarContrasena
   * Objetivo: Comparar la contraseña escrita con el hash guardado.
   * Entrada: plana, hash
   * Salida: Promesa con true si coincide
   */
  VerificarContrasena(plana, hash)
  {
    return bcrypt.compare(plana, hash);
  },

  /*
   * Función: RegistrarIntentoFallido
   * Objetivo: Suma un intento fallido y bloquea la cuenta al llegar al máximo.
   * Entrada: id
   * Salida: Promesa con { intentos, bloqueada }
   */
  async RegistrarIntentoFallido(id)
  {
    await Consultar(
      `UPDATE Usuarios
          SET Intentos_Fallidos = Intentos_Fallidos + 1,
              Estatus = IF(Intentos_Fallidos >= ?, 'Bloqueado', Estatus)
        WHERE id_usuario = ?`,
      [MAX_INTENTOS, id],
    );
    const [fila] = await Consultar(
      'SELECT Intentos_Fallidos, Estatus FROM Usuarios WHERE id_usuario = ?',
      [id],
    );
    return {
      intentos_restantes: Math.max(0, MAX_INTENTOS - fila.Intentos_Fallidos),
      estatus: fila.Estatus,
    };
  },

  /*
   * Función: ReiniciarIntentos
   * Objetivo: Poner en cero los intentos fallidos tras un inicio de sesión correcto.
   * Entrada: id
   * Salida: Promesa con el resultado de la actualización
   */
  ReiniciarIntentos(id)
  {
    return Consultar('UPDATE Usuarios SET Intentos_Fallidos = 0 WHERE id_usuario = ?', [id]);
  },

  /*
   * Función: Crear
   * Objetivo: Dar de alta un usuario con su contraseña cifrada.
   * Entrada: datos, conexion
   * Salida: Promesa con el registro creado
   */
  async Crear(datos, conexion)
  {
    const hash = await bcrypt.hash(datos.Contrasena_Usuario, 10);
    const resultado = await Consultar(
      `INSERT INTO Usuarios
         (Nombre_Usuario, Contrasena_Usuario, Matricula_Nomina, id_perfil, Nombre_Completo, Correo, Estatus)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.Nombre_Usuario,
        hash,
        datos.Matricula_Nomina,
        datos.id_perfil,
        datos.Nombre_Completo,
        datos.Correo ?? null,
        datos.Estatus ?? 'Activo',
      ],
      conexion,
    );
    return ModeloUsuario.BuscarPorId(resultado.insertId, conexion);
  },

  /*
   * Función: Actualizar
   * Objetivo: Cambio de datos. La matrícula y el usuario no se modifican (regla del prototipo);
   *           solo perfil, nombre, correo, estatus y contraseña.
   * Entrada: id, datos
   * Salida: Promesa con el registro actualizado
   */
  async Actualizar(id, datos)
  {
    const permitidos = ['Nombre_Completo', 'Correo', 'id_perfil', 'Estatus'];
    const sets = [];
    const parametros = [];
    permitidos.forEach((campo) =>
    {
      if (datos[campo] !== undefined)
      {
        sets.push(`${campo} = ?`);
        parametros.push(datos[campo]);
      }
    });
    if (datos.Estatus === 'Activo')
    {
      sets.push('Intentos_Fallidos = 0');
    }
    if (datos.Contrasena_Usuario)
    {
      sets.push('Contrasena_Usuario = ?');
      parametros.push(await bcrypt.hash(datos.Contrasena_Usuario, 10));
    }
    if (sets.length)
    {
      await Consultar(`UPDATE Usuarios SET ${sets.join(', ')} WHERE id_usuario = ?`, [
        ...parametros,
        id,
      ]);
    }
    return ModeloUsuario.BuscarPorId(id);
  },

  /*
   * Función: ValidarLista
   * Objetivo: Revisar cada fila de la lista de Servicios Escolares antes de crear las cuentas.
   * Entrada: filas
   * Salida: Promesa con { validos, errores }
   */
  async ValidarLista(filas)
  {
    const validos = [];
    const errores = [];
    const vistos = new Set();

    const matriculas = filas.map((fila) => String(fila.Matricula_Nomina ?? '').trim()).filter(Boolean);
    const usuarios = filas.map((fila) => String(fila.Nombre_Usuario ?? '').trim()).filter(Boolean);
    const existentes =
      matriculas.length || usuarios.length
        ? await Consultar(
          `SELECT Matricula_Nomina, Nombre_Usuario FROM Usuarios
          WHERE Matricula_Nomina IN (?) OR Nombre_Usuario IN (?)`,
          [matriculas.length ? matriculas : [''], usuarios.length ? usuarios : ['']],
        )
        : [];
    const matriculas_existentes = new Set(
      existentes.map((existente) => existente.Matricula_Nomina),
    );
    const usuarios_existentes = new Set(existentes.map((existente) => existente.Nombre_Usuario));

    filas.forEach((fila, indice) =>
    {
      const numero = fila.Fila ?? indice + 2; // la fila 1 del archivo es el encabezado
      const matricula = String(fila.Matricula_Nomina ?? '').trim();
      const nombre = String(fila.Nombre_Completo ?? '').trim();
      const usuario = String(fila.Nombre_Usuario ?? '')
        .trim()
        .toLowerCase();
      const correo = String(fila.Correo ?? '')
        .trim()
        .toLowerCase();
      const RegistrarError = (campo, mensaje) =>
        errores.push({
          Fila: numero,
          Matricula_Nomina: matricula || '—',
          Nombre_Completo: nombre || '—',
          Campo: campo,
          Error: mensaje,
        });

      if (!matricula)
      {
        return RegistrarError('Matrícula', 'Dato incompleto: la matrícula está vacía');
      }
      if (!/^\d{1,10}$/.test(matricula))
      {
        return RegistrarError('Matrícula', 'Formato inválido: solo se permiten números');
      }
      if (!nombre)
      {
        return RegistrarError('Nombre', 'Dato incompleto: el nombre está vacío');
      }
      if (!usuario)
      {
        return RegistrarError('Usuario', 'Dato incompleto: el usuario está vacío');
      }
      if (!/^[a-z0-9._-]{3,60}$/.test(usuario))
      {
        return RegistrarError('Usuario', 'Formato inválido: usa letras, números y puntos');
      }
      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      {
        return RegistrarError('Correo', 'Formato inválido de correo');
      }
      if (matriculas_existentes.has(matricula) || vistos.has(`m:${matricula}`))
      {
        return RegistrarError('Matrícula', 'Ya existe una cuenta con esta matrícula');
      }
      if (usuarios_existentes.has(usuario) || vistos.has(`u:${usuario}`))
      {
        return RegistrarError('Usuario', 'Ya existe una cuenta con este usuario');
      }
      vistos.add(`m:${matricula}`);
      vistos.add(`u:${usuario}`);
      validos.push({
        Fila: numero,
        Matricula_Nomina: matricula,
        Nombre_Completo: nombre,
        Nombre_Usuario: usuario,
        Correo: correo || null,
      });
      return undefined;
    });

    return { validos, errores };
  },

  /*
   * Función: CrearDesdeLista
   * Objetivo: Crea las cuentas de la lista con su perfil. La contraseña inicial es la matrícula
   *           a 10 dígitos y se devuelve solo en esta respuesta.
   * Entrada: cuentas
   * Salida: Promesa con { creados, errores }
   */
  async CrearDesdeLista(cuentas)
  {
    const { validos, errores } = await ModeloUsuario.ValidarLista(cuentas);
    const perfil_por_fila = new Map(
      cuentas.map((cuenta, indice) => [cuenta.Fila ?? indice + 2, cuenta.id_perfil]),
    );
    const sin_perfil = validos.filter((valido) => !perfil_por_fila.get(valido.Fila));
    sin_perfil.forEach((elemento) =>
      errores.push({
        Fila: elemento.Fila,
        Matricula_Nomina: elemento.Matricula_Nomina,
        Nombre_Completo: elemento.Nombre_Completo,
        Campo: 'Rol',
        Error: 'Sin rol asignado',
      }),
    );

    const creados = await EjecutarEnTransaccion(async (conexion) =>
    {
      const lista = [];
      for (const valido of validos)
      {
        const id_perfil = perfil_por_fila.get(valido.Fila);
        if (!id_perfil)
        {
          continue;
        }
        const contrasena = ContrasenaInicial(valido.Matricula_Nomina);
        const usuario = await ModeloUsuario.Crear(
          { ...valido, id_perfil, Contrasena_Usuario: contrasena },
          conexion,
        );
        usuario.funciones = await FuncionesDePerfil(id_perfil, conexion);
        lista.push({ ...usuario, Contrasena_Inicial: contrasena });
      }
      return lista;
    });
    return { creados, errores };
  },

  /*
   * Función: RevisarBajas
   * Objetivo: Compara la lista nueva contra las cuentas activas: quienes ya no aparecen son
   *           candidatos a baja. Los administradores no se dan de baja por lista.
   * Entrada: matriculas_lista
   * Salida: Promesa con los usuarios candidatos a baja
   */
  RevisarBajas(matriculas_lista)
  {
    const lista = matriculas_lista.map((elemento) => String(elemento).trim()).filter(Boolean);
    return Consultar(
      `SELECT ${CAMPOS_PUBLICOS},
              (SELECT COUNT(*) FROM Prestamos pr
                WHERE pr.id_usuario = u.id_usuario AND pr.Estado IN ('Activo','Vencido')) AS Libros_Prestados,
              (SELECT COALESCE(SUM(m.Cantidad_a_Pagar), 0) FROM Multas m
                WHERE m.id_usuario = u.id_usuario AND m.Fecha_Pagado IS NULL) AS Multas_Pendientes
         ${FROM_USUARIOS}
        WHERE u.Estatus <> 'Inactivo'
          AND p.Nombre_Rol <> 'Administrador'
          ${lista.length ? 'AND u.Matricula_Nomina NOT IN (?)' : ''}
        ORDER BY u.Nombre_Usuario`,
      lista.length ? [lista] : [],
    );
  },

  /*
   * Función: DarDeBaja
   * Objetivo: Da de baja (Inactivo) a los usuarios indicados. No procede si el usuario tiene
   *           libros prestados o multas pendientes.
   * Entrada: ids
   * Salida: Promesa con { dados_de_baja, rechazados }
   */
  async DarDeBaja(ids)
  {
    const dados_de_baja = [];
    const rechazados = [];
    await EjecutarEnTransaccion(async (conexion) =>
    {
      for (const id of ids)
      {
        const [usuario] = await Consultar(
          `SELECT u.id_usuario, u.Nombre_Usuario, u.Matricula_Nomina, p.Nombre_Rol,
                  (SELECT COUNT(*) FROM Prestamos pr
                    WHERE pr.id_usuario = u.id_usuario AND pr.Estado IN ('Activo','Vencido')) AS Libros_Prestados,
                  (SELECT COALESCE(SUM(m.Cantidad_a_Pagar), 0) FROM Multas m
                    WHERE m.id_usuario = u.id_usuario AND m.Fecha_Pagado IS NULL) AS Multas_Pendientes
             ${FROM_USUARIOS}
            WHERE u.id_usuario = ? FOR UPDATE`,
          [id],
          conexion,
        );
        if (!usuario)
        {
          rechazados.push({ id_usuario: id, Motivo: 'Usuario no encontrado' });
        }
        else if (usuario.Nombre_Rol === 'Administrador')
        {
          rechazados.push({
            ...usuario,
            Motivo: 'Las cuentas de administrador no se dan de baja por lista',
          });
        }
        else if (usuario.Libros_Prestados > 0 || usuario.Multas_Pendientes > 0)
        {
          const motivos = [];
          if (usuario.Libros_Prestados > 0)
          {
            motivos.push(`${usuario.Libros_Prestados} libro(s) prestado(s)`);
          }
          if (usuario.Multas_Pendientes > 0)
          {
            motivos.push(`multas pendientes por $${usuario.Multas_Pendientes.toFixed(2)}`);
          }
          rechazados.push({ ...usuario, Motivo: `Tiene ${motivos.join(' y ')}` });
        }
        else
        {
          await Consultar(
            'UPDATE Usuarios SET Estatus = \'Inactivo\' WHERE id_usuario = ?',
            [id],
            conexion,
          );
          dados_de_baja.push({ ...usuario, Estatus: 'Inactivo' });
        }
      }
    });
    return { dados_de_baja, rechazados };
  },

  /*
   * Función: ContarActivos
   * Objetivo: Contar las cuentas activas.
   * Entrada: Ninguna
   * Salida: Promesa con el número de registros activos
   */
  async ContarActivos()
  {
    const [{ n: total }] = await Consultar('SELECT COUNT(*) AS n FROM Usuarios WHERE Estatus = \'Activo\'');
    return total;
  },
};

export { ModeloUsuario };
