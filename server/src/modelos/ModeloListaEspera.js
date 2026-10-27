import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';

const SELECT_LISTA = `
  SELECT le.*, l.Titulo, l.ISBN, u.Nombre_Usuario, u.Matricula_Nomina,
         (SELECT COUNT(*) FROM ListaEspera x
           WHERE x.id_libro = le.id_libro AND x.Estatus = 'En espera'
             AND (x.Fecha_Peticion < le.Fecha_Peticion
                  OR (x.Fecha_Peticion = le.Fecha_Peticion AND x.id_lista_espera < le.id_lista_espera))
         ) + 1 AS Posicion
    FROM ListaEspera le
    JOIN Libros l   ON l.id_libro = le.id_libro
    JOIN Usuarios u ON u.id_usuario = le.id_usuario`;

const ModeloListaEspera = {
  Listar({ id_usuario, id_libro, estatus, limit = 100, offset = 0 } = {}) 
  {
    const where = [];
    const params = [];
    if (id_usuario) 
    {
      where.push('le.id_usuario = ?');
      params.push(id_usuario);
    }
    if (id_libro) 
    {
      where.push('le.id_libro = ?');
      params.push(id_libro);
    }
    if (estatus) 
    {
      where.push('le.Estatus = ?');
      params.push(estatus);
    }
    params.push(Number(limit), Number(offset));
    return Consultar(
      `${SELECT_LISTA}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY le.Fecha_Peticion, le.id_lista_espera
       LIMIT ? OFFSET ?`,
      params,
    );
  },

  async BuscarPorId(id, conn) 
  {
    const rows = await Consultar(`${SELECT_LISTA} WHERE le.id_lista_espera = ?`, [id], conn);
    return rows[0] || null;
  },

  /** Solo se puede apartar un libro sin copias de Consulta externa libres. */
  Inscribir(id_usuario, id_libro) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [libro] = await Consultar(
        'SELECT id_libro, Estatus FROM Libros WHERE id_libro = ?',
        [id_libro],
        conn,
      );
      if (!libro || libro.Estatus !== 'Activo') 
      {
        throw ErrorHttp.NoEncontrado('Libro no encontrado');
      }

      const [{ prestables }] = await Consultar(
        `SELECT COUNT(*) AS prestables FROM Ejemplares
          WHERE id_libro = ? AND Estatus = 'Consulta externa'`,
        [id_libro],
        conn,
      );
      if (prestables > 0) 
      {
        throw ErrorHttp.Conflicto(
          'Hay copias para llevar a casa; solicita el préstamo directamente',
        );
      }

      const [duplicado] = await Consultar(
        `SELECT 1 FROM ListaEspera
          WHERE id_usuario = ? AND id_libro = ? AND Estatus IN ('En espera','Notificado')`,
        [id_usuario, id_libro],
        conn,
      );
      if (duplicado) 
      {
        throw ErrorHttp.Conflicto('Ya estás en la lista de espera de este libro');
      }

      const [prestado] = await Consultar(
        `SELECT 1 FROM Prestamos
          WHERE id_usuario = ? AND id_libro = ? AND Estado IN ('Activo','Vencido')`,
        [id_usuario, id_libro],
        conn,
      );
      if (prestado) 
      {
        throw ErrorHttp.Conflicto('Ya tienes este libro en préstamo');
      }

      const resultado = await Consultar(
        'INSERT INTO ListaEspera (id_usuario, id_libro) VALUES (?, ?)',
        [id_usuario, id_libro],
        conn,
      );
      return ModeloListaEspera.BuscarPorId(resultado.insertId, conn);
    });
  },

  /**
   * Cancela un apartado. Si estaba notificado, el ejemplar apartado pasa
   * al siguiente en espera o vuelve a quedar disponible.
   */
  Cancelar(id) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const [registro] = await Consultar(
        'SELECT * FROM ListaEspera WHERE id_lista_espera = ? FOR UPDATE',
        [id],
        conn,
      );
      if (!registro) 
      {
        throw ErrorHttp.NoEncontrado('Registro de lista de espera no encontrado');
      }
      if (!['En espera', 'Notificado'].includes(registro.Estatus)) 
      {
        throw ErrorHttp.Conflicto('El registro ya no está activo');
      }

      await Consultar(
        'UPDATE ListaEspera SET Estatus = \'Cancelado\' WHERE id_lista_espera = ?',
        [id],
        conn,
      );

      if (registro.Estatus === 'Notificado') 
      {
        const [siguiente] = await Consultar(
          `SELECT id_lista_espera FROM ListaEspera
            WHERE id_libro = ? AND Estatus = 'En espera'
            ORDER BY Fecha_Peticion, id_lista_espera LIMIT 1 FOR UPDATE`,
          [registro.id_libro],
          conn,
        );
        if (siguiente) 
        {
          await Consultar(
            'UPDATE ListaEspera SET Estatus = \'Notificado\' WHERE id_lista_espera = ?',
            [siguiente.id_lista_espera],
            conn,
          );
        }
        else 
        {
          await Consultar(
            `UPDATE Ejemplares SET Estatus = 'Consulta externa'
              WHERE id_libro = ? AND Estatus = 'Apartado' LIMIT 1`,
            [registro.id_libro],
            conn,
          );
        }
      }
      return ModeloListaEspera.BuscarPorId(id, conn);
    });
  },
};

export { ModeloListaEspera };
