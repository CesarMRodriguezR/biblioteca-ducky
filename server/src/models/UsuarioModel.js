import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../config/db.js';

const MAX_INTENTOS = 5;

const CAMPOS_PUBLICOS = `
  u.id_usuario, u.Nombre_Usuario, u.Nombre_Completo, u.Correo, u.Matricula_Nomina,
  u.Estatus, u.id_perfil, p.Nombre_Rol`;

const FROM_USUARIOS = 'FROM Usuarios u JOIN Perfiles p ON p.id_perfil = u.id_perfil';

/** Contraseña inicial de las cuentas creadas por lista: matrícula a 10 dígitos. */
function contrasenaInicial(matricula) {
  return String(matricula).padStart(10, '0');
}

async function funcionesDePerfil(idPerfil, conn) {
  const rows = await query(
    `SELECT f.Nombre_Funcion
       FROM PerfilFuncion pf
       JOIN Funciones f ON f.id_funcion = pf.id_funcion
      WHERE pf.id_perfil = ? AND f.Estatus = 'Activo'`,
    [idPerfil],
    conn,
  );
  return rows.map((r) => r.Nombre_Funcion);
}

const UsuarioModel = {
  MAX_INTENTOS,
  contrasenaInicial,

  async findAll({ q, idPerfil, estatus, limit = 100, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (q) {
      where.push('(u.Matricula_Nomina LIKE ? OR u.Nombre_Completo LIKE ? OR u.Nombre_Usuario LIKE ?)');
      params.push(`${q}%`, `%${q}%`, `%${q}%`);
    }
    if (idPerfil) { where.push('u.id_perfil = ?'); params.push(idPerfil); }
    if (estatus) { where.push('u.Estatus = ?'); params.push(estatus); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) AS total ${FROM_USUARIOS} ${whereSql}`, params);
    const datos = await query(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} ${whereSql}
        ORDER BY u.Estatus = 'Activo' DESC, u.Nombre_Completo
        LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)],
    );
    return { total, datos };
  },

  async findById(id, conn) {
    const rows = await query(`SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} WHERE u.id_usuario = ?`, [id], conn);
    return rows[0] || null;
  },

  async findByMatricula(matricula, conn) {
    const rows = await query(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_USUARIOS} WHERE u.Matricula_Nomina = ?`,
      [matricula],
      conn,
    );
    return rows[0] || null;
  },

  /** Incluye hash e intentos; solo para el inicio de sesión. */
  async findParaLogin(usuario) {
    const rows = await query(
      `SELECT ${CAMPOS_PUBLICOS}, u.Contrasena_Usuario, u.Intentos_Fallidos
         ${FROM_USUARIOS}
        WHERE u.Nombre_Usuario = ?`,
      [usuario],
    );
    return rows[0] || null;
  },

  /** Datos de sesión: usuario + funciones vigentes del perfil. */
  async findSesionById(id) {
    const usuario = await UsuarioModel.findById(id);
    if (!usuario) return null;
    usuario.funciones = await funcionesDePerfil(usuario.id_perfil);
    return usuario;
  },

  /** Detalle con préstamos activos y multas pendientes (consulta de usuario). */
  async findDetalle(id) {
    const usuario = await UsuarioModel.findSesionById(id);
    if (!usuario) return null;
    const [[prestamos], [multas]] = await Promise.all([
      query(
        `SELECT COUNT(*) AS n FROM Prestamos
          WHERE id_usuario = ? AND Estado IN ('Activo','Vencido')`,
        [id],
      ),
      query(
        `SELECT COALESCE(SUM(Cantidad_a_Pagar), 0) AS total FROM Multas
          WHERE id_usuario = ? AND Fecha_Pagado IS NULL`,
        [id],
      ),
    ]);
    return { ...usuario, Libros_Prestados: prestamos.n, Multas_Pendientes: multas.total };
  },

  verificarContrasena(plana, hash) {
    return bcrypt.compare(plana, hash);
  },

  /** Suma un intento fallido y bloquea la cuenta al llegar al máximo. */
  async registrarIntentoFallido(id) {
    await query(
      `UPDATE Usuarios
          SET Intentos_Fallidos = Intentos_Fallidos + 1,
              Estatus = IF(Intentos_Fallidos >= ?, 'Bloqueado', Estatus)
        WHERE id_usuario = ?`,
      [MAX_INTENTOS, id],
    );
    const [row] = await query('SELECT Intentos_Fallidos, Estatus FROM Usuarios WHERE id_usuario = ?', [id]);
    return { intentosRestantes: Math.max(0, MAX_INTENTOS - row.Intentos_Fallidos), estatus: row.Estatus };
  },

  reiniciarIntentos(id) {
    return query('UPDATE Usuarios SET Intentos_Fallidos = 0 WHERE id_usuario = ?', [id]);
  },

  async create(datos, conn) {
    const hash = await bcrypt.hash(datos.Contrasena_Usuario, 10);
    const result = await query(
      `INSERT INTO Usuarios
         (Nombre_Usuario, Contrasena_Usuario, Matricula_Nomina, id_perfil, Nombre_Completo, Correo, Estatus)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.Nombre_Usuario, hash, datos.Matricula_Nomina, datos.id_perfil,
        datos.Nombre_Completo, datos.Correo ?? null, datos.Estatus ?? 'Activo',
      ],
      conn,
    );
    return UsuarioModel.findById(result.insertId, conn);
  },

  /**
   * Cambio de datos. La matrícula y el usuario no se modifican (regla del
   * prototipo); solo perfil, nombre, correo, estatus y contraseña.
   */
  async update(id, datos) {
    const permitidos = ['Nombre_Completo', 'Correo', 'id_perfil', 'Estatus'];
    const sets = [];
    const params = [];
    permitidos.forEach((campo) => {
      if (datos[campo] !== undefined) {
        sets.push(`${campo} = ?`);
        params.push(datos[campo]);
      }
    });
    if (datos.Estatus === 'Activo') sets.push('Intentos_Fallidos = 0');
    if (datos.Contrasena_Usuario) {
      sets.push('Contrasena_Usuario = ?');
      params.push(await bcrypt.hash(datos.Contrasena_Usuario, 10));
    }
    if (sets.length) {
      await query(`UPDATE Usuarios SET ${sets.join(', ')} WHERE id_usuario = ?`, [...params, id]);
    }
    return UsuarioModel.findById(id);
  },

  // ------------------------------------------------------------------
  // Alta y baja por lista (archivo de Servicios Escolares)
  // ------------------------------------------------------------------

  /**
   * Revisa las filas de la lista antes de crear cuentas.
   * Devuelve las filas válidas y los errores por fila y campo.
   */
  async validarLista(filas) {
    const validos = [];
    const errores = [];
    const vistos = new Set();

    const matriculas = filas.map((f) => String(f.Matricula_Nomina ?? '').trim()).filter(Boolean);
    const usuarios = filas.map((f) => String(f.Nombre_Usuario ?? '').trim()).filter(Boolean);
    const existentes = matriculas.length || usuarios.length
      ? await query(
        `SELECT Matricula_Nomina, Nombre_Usuario FROM Usuarios
          WHERE Matricula_Nomina IN (?) OR Nombre_Usuario IN (?)`,
        [matriculas.length ? matriculas : [''], usuarios.length ? usuarios : ['']],
      )
      : [];
    const matriculasExistentes = new Set(existentes.map((e) => e.Matricula_Nomina));
    const usuariosExistentes = new Set(existentes.map((e) => e.Nombre_Usuario));

    filas.forEach((fila, i) => {
      const numero = fila.Fila ?? i + 2; // la fila 1 del archivo es el encabezado
      const matricula = String(fila.Matricula_Nomina ?? '').trim();
      const nombre = String(fila.Nombre_Completo ?? '').trim();
      const usuario = String(fila.Nombre_Usuario ?? '').trim().toLowerCase();
      const correo = String(fila.Correo ?? '').trim().toLowerCase();
      const error = (campo, mensaje) => errores.push({
        Fila: numero, Matricula_Nomina: matricula || '—', Nombre_Completo: nombre || '—', Campo: campo, Error: mensaje,
      });

      if (!matricula) return error('Matrícula', 'Dato incompleto: la matrícula está vacía');
      if (!/^\d{1,10}$/.test(matricula)) return error('Matrícula', 'Formato inválido: solo se permiten números');
      if (!nombre) return error('Nombre', 'Dato incompleto: el nombre está vacío');
      if (!usuario) return error('Usuario', 'Dato incompleto: el usuario está vacío');
      if (!/^[a-z0-9._-]{3,60}$/.test(usuario)) return error('Usuario', 'Formato inválido: usa letras, números y puntos');
      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return error('Correo', 'Formato inválido de correo');
      if (matriculasExistentes.has(matricula) || vistos.has(`m:${matricula}`)) {
        return error('Matrícula', 'Ya existe una cuenta con esta matrícula');
      }
      if (usuariosExistentes.has(usuario) || vistos.has(`u:${usuario}`)) {
        return error('Usuario', 'Ya existe una cuenta con este usuario');
      }
      vistos.add(`m:${matricula}`);
      vistos.add(`u:${usuario}`);
      validos.push({
        Fila: numero, Matricula_Nomina: matricula, Nombre_Completo: nombre, Nombre_Usuario: usuario, Correo: correo || null,
      });
      return undefined;
    });

    return { validos, errores };
  },

  /**
   * Crea las cuentas de la lista con su perfil. La contraseña inicial es
   * la matrícula a 10 dígitos y se devuelve solo en esta respuesta.
   */
  async crearDesdeLista(cuentas) {
    const { validos, errores } = await UsuarioModel.validarLista(cuentas);
    const perfilPorFila = new Map(cuentas.map((c, i) => [c.Fila ?? i + 2, c.id_perfil]));
    const sinPerfil = validos.filter((v) => !perfilPorFila.get(v.Fila));
    sinPerfil.forEach((v) => errores.push({
      Fila: v.Fila, Matricula_Nomina: v.Matricula_Nomina, Nombre_Completo: v.Nombre_Completo,
      Campo: 'Rol', Error: 'Sin rol asignado',
    }));

    const creados = await withTransaction(async (conn) => {
      const lista = [];
      for (const v of validos) {
        const idPerfil = perfilPorFila.get(v.Fila);
        if (!idPerfil) continue;
        const contrasena = contrasenaInicial(v.Matricula_Nomina);
        const usuario = await UsuarioModel.create({ ...v, id_perfil: idPerfil, Contrasena_Usuario: contrasena }, conn);
        usuario.funciones = await funcionesDePerfil(idPerfil, conn);
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
  revisarBajas(matriculasLista) {
    const lista = matriculasLista.map((m) => String(m).trim()).filter(Boolean);
    return query(
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
  async darDeBaja(ids) {
    const dadosDeBaja = [];
    const rechazados = [];
    await withTransaction(async (conn) => {
      for (const id of ids) {
        const [u] = await query(
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
        if (!u) {
          rechazados.push({ id_usuario: id, Motivo: 'Usuario no encontrado' });
        } else if (u.Nombre_Rol === 'Administrador') {
          rechazados.push({ ...u, Motivo: 'Las cuentas de administrador no se dan de baja por lista' });
        } else if (u.Libros_Prestados > 0 || u.Multas_Pendientes > 0) {
          const motivos = [];
          if (u.Libros_Prestados > 0) motivos.push(`${u.Libros_Prestados} libro(s) prestado(s)`);
          if (u.Multas_Pendientes > 0) motivos.push(`multas pendientes por $${u.Multas_Pendientes.toFixed(2)}`);
          rechazados.push({ ...u, Motivo: `Tiene ${motivos.join(' y ')}` });
        } else {
          await query(`UPDATE Usuarios SET Estatus = 'Inactivo' WHERE id_usuario = ?`, [id], conn);
          dadosDeBaja.push({ ...u, Estatus: 'Inactivo' });
        }
      }
    });
    return { dadosDeBaja, rechazados };
  },

  async contarActivos() {
    const [{ n }] = await query(`SELECT COUNT(*) AS n FROM Usuarios WHERE Estatus = 'Activo'`);
    return n;
  },
};

export { UsuarioModel };
