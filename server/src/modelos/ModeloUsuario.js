import bcrypt from 'bcryptjs';
import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';

const MAX_INTENTOS = 5;

const CAMPOS_PUBLICOS = `
  u.id_usuario, u.Nombre_Usuario, u.Nombre_Completo, u.Correo, u.Matricula_Nomina,
  u.Estatus, u.id_perfil, p.Nombre_Rol`;

const FROM_USUARIOS = 'FROM Usuarios u JOIN Perfiles p ON p.id_perfil = u.id_perfil';

/** Contraseña inicial de las cuentas creadas por lista: matrícula a 10 dígitos. */
function ContrasenaInicial(matricula) 
{
  return String(matricula).padStart(10, '0');
}

async function FuncionesDePerfil(id_perfil, conn) 
{
  const rows = await Consultar(
    `SELECT f.Nombre_Funcion
       FROM PerfilFuncion pf
       JOIN Funciones f ON f.id_funcion = pf.id_funcion
      WHERE pf.id_perfil = ? AND f.Estatus = 'Activo'`,
    [id_perfil],
    conn,
  );
  return rows.map((fila) => fila.Nombre_Funcion);
}

const ModeloUsuario = {
  MAX_INTENTOS,
  contrasena_inicial: ContrasenaInicial,

  async BuscarTodos(
    { q: texto_busqueda, id_perfil, estatus, limit = 100, offset = 0 } = {},
  ) 
  {
    const where = [];
    const params = [];
    if (texto_busqueda) 
    {
      where.push(
        '(u.Matricula_Nomina LIKE ? OR u.Nombre_Completo LIKE ? OR u.Nombre_Usuario LIKE ?)',
      );
      params.push(`${texto_busqueda}%`, `%${texto_busqueda}%`, `%${texto_busqueda}%`);
    }
    if (id_perfil) 
    {
      where.push('u.id_perfil = ?');
      params.push(id_perfil);
    }
    if (estatus) 
    {
      where.push('u.Estatus = ?');
      params.push(estatus);
    }
    const where_sql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [{ total }] = await Consultar(
      `SELECT COUNT(*) AS total ${FROM_USUARIOS} ${where_sql}`,
      params,
    );
    const datos = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} ${where_sql}
        ORDER BY u.Estatus = 'Activo' DESC, u.Nombre_Completo
        LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)],
    );
    return { total, datos };
  },

  async BuscarPorId(id, conn) 
  {
    const rows = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} WHERE u.id_usuario = ?`,
      [id],
      conn,
    );
    return rows[0] || null;
  },

  async BuscarPorMatricula(matricula, conn) 
  {
    const rows = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} WHERE u.Matricula_Nomina = ?`,
      [matricula],
      conn,
    );
    return rows[0] || null;
  },

  /** Incluye hash e intentos; solo para el inicio de sesión. */
  async BuscarParaInicioSesion(usuario) 
  {
    const rows = await Consultar(
      `SELECT ${CAMPOS_PUBLICOS}, u.Contrasena_Usuario, u.Intentos_Fallidos
         ${FROM_USUARIOS}
        WHERE u.Nombre_Usuario = ?`,
      [usuario],
    );
    return rows[0] || null;
  },

  /** Datos de sesión: usuario + funciones vigentes del perfil. */
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

  /** Detalle con préstamos activos y multas pendientes (consulta de usuario). */
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

  VerificarContrasena(plana, hash) 
  {
    return bcrypt.compare(plana, hash);
  },

  /** Suma un intento fallido y bloquea la cuenta al llegar al máximo. */
  async RegistrarIntentoFallido(id) 
  {
    await Consultar(
      `UPDATE Usuarios
          SET Intentos_Fallidos = Intentos_Fallidos + 1,
              Estatus = IF(Intentos_Fallidos >= ?, 'Bloqueado', Estatus)
        WHERE id_usuario = ?`,
      [MAX_INTENTOS, id],
    );
    const [row] = await Consultar(
      'SELECT Intentos_Fallidos, Estatus FROM Usuarios WHERE id_usuario = ?',
      [id],
    );
    return {
      intentos_restantes: Math.max(0, MAX_INTENTOS - row.Intentos_Fallidos),
      estatus: row.Estatus,
    };
  },

  ReiniciarIntentos(id) 
  {
    return Consultar('UPDATE Usuarios SET Intentos_Fallidos = 0 WHERE id_usuario = ?', [id]);
  },

  async Crear(datos, conn) 
  {
    const hash = await bcrypt.hash(datos.Contrasena_Usuario, 10);
    const result = await Consultar(
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
      conn,
    );
    return ModeloUsuario.BuscarPorId(result.insertId, conn);
  },

  /**
   * Cambio de datos. La matrícula y el usuario no se modifican (regla del
   * prototipo); solo perfil, nombre, correo, estatus y contraseña.
   */
  async Actualizar(id, datos) 
  {
    const permitidos = ['Nombre_Completo', 'Correo', 'id_perfil', 'Estatus'];
    const sets = [];
    const params = [];
    permitidos.forEach((campo) => 
    {
      if (datos[campo] !== undefined) 
      {
        sets.push(`${campo} = ?`);
        params.push(datos[campo]);
      }
    });
    if (datos.Estatus === 'Activo') 
    {
      sets.push('Intentos_Fallidos = 0');
    }
    if (datos.Contrasena_Usuario) 
    {
      sets.push('Contrasena_Usuario = ?');
      params.push(await bcrypt.hash(datos.Contrasena_Usuario, 10));
    }
    if (sets.length) 
    {
      await Consultar(`UPDATE Usuarios SET ${sets.join(', ')} WHERE id_usuario = ?`, [
        ...params,
        id,
      ]);
    }
    return ModeloUsuario.BuscarPorId(id);
  },

  // ------------------------------------------------------------------
  // Alta y baja por lista (archivo de Servicios Escolares)
  // ------------------------------------------------------------------

  /**
   * Revisa las filas de la lista antes de crear cuentas.
   * Devuelve las filas válidas y los errores por fila y campo.
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

  /**
   * Crea las cuentas de la lista con su perfil. La contraseña inicial es
   * la matrícula a 10 dígitos y se devuelve solo en esta respuesta.
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

    const creados = await EjecutarEnTransaccion(async (conn) => 
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
          conn,
        );
        usuario.funciones = await FuncionesDePerfil(id_perfil, conn);
        lista.push({ ...usuario, Contrasena_Inicial: contrasena });
      }
      return lista;
    });
    return { creados, errores };
  },

  /**
   * Compara la lista nueva contra las cuentas activas: quienes ya no
   * aparecen son candidatos a baja. Los administradores no se dan de baja
   * por lista.
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

  /**
   * Da de baja (Inactivo) a los usuarios indicados. No procede si el
   * usuario tiene libros prestados o multas pendientes.
   */
  async DarDeBaja(ids) 
  {
    const dados_de_baja = [];
    const rechazados = [];
    await EjecutarEnTransaccion(async (conn) => 
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
          conn,
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
            conn,
          );
          dados_de_baja.push({ ...usuario, Estatus: 'Inactivo' });
        }
      }
    });
    return { dados_de_baja, rechazados };
  },

  async ContarActivos() 
  {
    const [{ n: total }] = await Consultar('SELECT COUNT(*) AS n FROM Usuarios WHERE Estatus = \'Activo\'');
    return total;
  },
};

export { ModeloUsuario };
