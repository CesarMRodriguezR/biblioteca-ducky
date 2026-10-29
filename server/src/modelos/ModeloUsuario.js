/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU · ModeloUsuario.js
 * Función: Cuentas de usuario: sesión, consulta, cambios, alta y baja.
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
 *     CAMPOS_PUBLICOS     Columnas del usuario que se pueden enviar al cliente
 *     FROM_USUARIOS       FROM y JOIN comunes de las consultas de usuarios
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
import { Consultar, EjecutarEnTransaccion, SiguienteId } from '../configuracion/conexion.js';

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
  FuncionesDePerfil,

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
   * Objetivo: Incluye el hash de la contraseña; solo para el inicio de sesión.
   * Entrada: usuario
   * Salida: Promesa con el usuario o null
   */
  async BuscarParaInicioSesion(usuario)
  {
    const filas = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS}, u.Contrasena_Usuario
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
   * Función: Crear
   * Objetivo: Dar de alta un usuario con su contraseña cifrada.
   * Entrada: datos, conexion
   * Salida: Promesa con el registro creado
   */
  async Crear(datos, conexion)
  {
    const hash = await bcrypt.hash(datos.Contrasena_Usuario, 10);
    const id_usuario = await SiguienteId('Usuarios', 'id_usuario', conexion);
    await Consultar(
      `INSERT INTO Usuarios
         (id_usuario, Nombre_Usuario, Contrasena_Usuario, Matricula_Nomina, id_perfil,
          Nombre_Completo, Correo, Estatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_usuario,
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
    return ModeloUsuario.BuscarPorId(id_usuario, conexion);
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
   * Función: RevisarBajas
   * Objetivo: Compara las matrículas y nóminas vigentes (CIAA y Empleados) contra las cuentas
   *           activas: quienes ya no aparecen son candidatos a baja. Los administradores no se
   *           dan de baja por lista.
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
