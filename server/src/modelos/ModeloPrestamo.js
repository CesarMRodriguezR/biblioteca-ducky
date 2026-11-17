/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL · ModeloPrestamo.js
 * Función: Préstamos: condición del lector y del libro, registro, recibo, renovación, resumen
 *          del menú y préstamos vencidos.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Matrícula del lector, ISBN del libro y ejemplar
 * Salida: Préstamos con su estado, fechas y folio
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo             Objetivo
 *     CONSULTA_PRESTAMO  SELECT de un préstamo con lector, libro, copia y devolución
 *     Decorar            Agregar folio, estado visible, retraso y multa acumulada
 *     ModeloPrestamo     Acceso a los préstamos
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Las reglas del reglamento (días, renovaciones, límite y multa por día) están en
 *     utilidades/ReglasCirculacion.js.
 * (2) Prestamos.Estado guarda Activo, Devuelto o Perdido; «Vencido» y «Renovado» se calculan
 *     al mostrar (fecha programada pasada o renovaciones registradas).
 * (3) Solo se prestan copias con estatus «Consulta Externa»; mientras están prestadas quedan
 *     «En préstamo» y al devolverse regresan a «Consulta Externa».
 * (4) Las operaciones que tocan varias tablas usan EjecutarEnTransaccion; las fechas se
 *     calculan con Hoy() del servidor.
 * ******************************************************************
 */

import { Consultar, EjecutarEnTransaccion, SiguienteId } from '../configuracion/conexion.js';
import { ErrorHttp } from '../utilidades/ErrorHttp.js';
import { FechaCorta, Hoy } from '../utilidades/fechas.js';
import { InterpretarCodigoUbicacion } from '../utilidades/CodigoUbicacion.js';
import {
  REGLAS,
  DiasPrestamo,
  DiasRetraso,
  FolioPrestamo,
  MaximoRenovaciones,
  SumarDiasHabiles,
} from '../utilidades/ReglasCirculacion.js';
import { ModeloUsuario } from './ModeloUsuario.js';
import { ModeloMulta } from './ModeloMulta.js';

/*
 * Constante: CONSULTA_PRESTAMO
 * Objetivo: SELECT de un préstamo con lector, libro, copia, devolución y renovaciones.
 */
const CONSULTA_PRESTAMO = `
  SELECT pr.id_prestamo, pr.Fecha_Prestamo, pr.Fecha_Entrega_Programada, pr.Estado,
         pr.id_usuario, pr.id_libro, pr.num_copia,
         u.Nombre_Completo, u.Matricula_Nomina, u.Correo, u.Telefono, p.Nombre_Rol,
         l.Titulo, l.ISBN, l.Precio, e.Ubicacion, d.Fecha_Devolucion,
         (SELECT COUNT(*) FROM Renovaciones r WHERE r.id_prestamo = pr.id_prestamo)
           AS Renovaciones
    FROM Prestamos pr
    JOIN Usuarios u ON u.id_usuario = pr.id_usuario
    JOIN Perfiles p ON p.id_perfil = u.id_perfil
    JOIN Libros l ON l.id_libro = pr.id_libro
    JOIN Ejemplares e ON e.id_libro = pr.id_libro AND e.num_copia = pr.num_copia
    LEFT JOIN Devoluciones d ON d.id_prestamo = pr.id_prestamo`;

/*
 * Función: Decorar
 * Objetivo: Agregar a un préstamo su folio, el estado que ve el usuario (Activo, Renovado,
 *           Vencido, Devuelto, Devuelto con retraso o Perdido), los días de retraso, la multa
 *           acumulada y las renovaciones permitidas.
 * Entrada: prestamo, hoy
 * Salida: Préstamo con los campos calculados
 */
function Decorar(prestamo, hoy)
{
  const referencia = prestamo.Estado === 'Devuelto' ? prestamo.Fecha_Devolucion : hoy;
  const dias_retraso =
    prestamo.Estado === 'Perdido' ? 0 : DiasRetraso(prestamo.Fecha_Entrega_Programada, referencia);
  let estado = prestamo.Estado;
  if (prestamo.Estado === 'Activo')
  {
    estado = dias_retraso > 0 ? 'Vencido' : prestamo.Renovaciones > 0 ? 'Renovado' : 'Activo';
  }
  else if (prestamo.Estado === 'Devuelto' && dias_retraso > 0)
  {
    estado = 'Devuelto con retraso';
  }
  return {
    ...prestamo,
    Folio: FolioPrestamo(prestamo.id_prestamo),
    Estado_Visible: estado,
    Dias_Retraso: dias_retraso,
    Multa_Acumulada: prestamo.Estado === 'Activo' ? dias_retraso * REGLAS.MULTA_POR_DIA : 0,
    Max_Renovaciones: MaximoRenovaciones(prestamo.Nombre_Rol),
    ubicacion: InterpretarCodigoUbicacion(prestamo.Ubicacion),
  };
}

/*
 * Módulo: ModeloPrestamo
 * Objetivo: Acceso a los préstamos.
 */
const ModeloPrestamo = {
  Decorar,

  /*
   * Función: BuscarPorId
   * Objetivo: Obtener un préstamo con sus datos calculados.
   * Entrada: id_prestamo, conexion (opcional)
   * Salida: Promesa con el préstamo o null
   */
  async BuscarPorId(id_prestamo, conexion)
  {
    const [prestamo] = await Consultar(
      `${CONSULTA_PRESTAMO} WHERE pr.id_prestamo = ?`,
      [id_prestamo],
      conexion,
    );
    return prestamo ? Decorar(prestamo, Hoy()) : null;
  },

  /*
   * Función: BuscarLector
   * Objetivo: Obtener un usuario por matrícula o nómina; 404 con el mensaje del prototipo si no
   *           existe.
   * Entrada: matricula
   * Salida: Promesa con el usuario
   */
  async BuscarLector(matricula)
  {
    const lector = await ModeloUsuario.BuscarPorMatricula(String(matricula).trim());
    if (!lector)
    {
      throw ErrorHttp.NoEncontrado(`No existe un usuario con la matrícula ${matricula}`);
    }
    return lector;
  },

  /*
   * Función: Situacion
   * Objetivo: Situación de un lector: sus préstamos (activos e historial), multas, resumen,
   *           condiciones para pedir un préstamo y las fechas que tendría uno nuevo.
   * Entrada: matricula
   * Salida: Promesa con { lector, resumen, condiciones, puede_prestar, reglas, activos,
   *         historial, multas }
   */
  async Situacion(matricula)
  {
    const lector = await ModeloPrestamo.BuscarLector(matricula);
    return ModeloPrestamo.SituacionDeUsuario(lector);
  },

  /*
   * Función: SituacionDeUsuario
   * Objetivo: La misma situación a partir del usuario ya encontrado.
   * Entrada: lector
   * Salida: Promesa con la situación del lector
   */
  async SituacionDeUsuario(lector)
  {
    const hoy = Hoy();
    const [filas, multas] = await Promise.all([
      Consultar(
        `${CONSULTA_PRESTAMO} WHERE pr.id_usuario = ?
          ORDER BY pr.Fecha_Prestamo DESC, CAST(pr.id_prestamo AS UNSIGNED) DESC`,
        [lector.id_usuario],
      ),
      ModeloMulta.DelUsuario(lector.id_usuario),
    ]);
    const prestamos = filas.map((fila) => Decorar(fila, hoy));
    const activos = prestamos.filter((prestamo) => prestamo.Estado === 'Activo');
    const historial = prestamos.filter((prestamo) => prestamo.Estado !== 'Activo');
    const vencidos = activos.filter((prestamo) => prestamo.Dias_Retraso > 0);
    const pendientes = multas.filter((multa) => multa.Estado === 'Pendiente');
    const monto_pendiente = pendientes.reduce((total, multa) => total + multa.Cantidad_a_Pagar, 0);

    const condiciones = [
      {
        Condicion: 'Estatus de la cuenta',
        Resultado: lector.Estatus === 'Activo' ? 'Activa' : 'Inactiva',
        Cumple: lector.Estatus === 'Activo',
      },
      {
        Condicion: 'Multas pendientes',
        Resultado: pendientes.length
          ? `$${monto_pendiente.toFixed(2)} (${pendientes.length} ${pendientes.length === 1 ? 'multa' : 'multas'})`
          : '$0.00',
        Cumple: pendientes.length === 0,
      },
      {
        Condicion: 'Ejemplares prestados actualmente',
        Resultado: `${activos.length} (máximo ${REGLAS.MAXIMO_PRESTAMOS})`,
        Cumple: activos.length < REGLAS.MAXIMO_PRESTAMOS,
      },
      {
        Condicion: 'Préstamos vencidos',
        Resultado: vencidos.length
          ? `${vencidos.length} · vencido el ${FechaCorta(vencidos[0].Fecha_Entrega_Programada)}`
          : 'Ninguno',
        Cumple: vencidos.length === 0,
      },
    ];
    const dias = DiasPrestamo(lector.Nombre_Rol);
    return {
      lector,
      resumen: {
        Prestamos_Activos: activos.length,
        Prestamos_Vencidos: vencidos.length,
        Multas_Pendientes: monto_pendiente,
        Prestamos_Totales: prestamos.length,
        Maximo_Prestamos: REGLAS.MAXIMO_PRESTAMOS,
      },
      condiciones,
      puede_prestar: condiciones.every((condicion) => condicion.Cumple),
      reglas: {
        Dias_Prestamo: dias,
        Max_Renovaciones: MaximoRenovaciones(lector.Nombre_Rol),
        Fecha_Prestamo: hoy,
        Fecha_Devolucion: SumarDiasHabiles(hoy, dias),
      },
      activos,
      historial,
      multas,
    };
  },

  /*
   * Función: BuscarLibro
   * Objetivo: Libro por ISBN (con o sin guiones) con sus copias activas: cuáles se pueden
   *           prestar, la fecha de devolución de las prestadas y su lista de espera.
   * Entrada: isbn
   * Salida: Promesa con el libro, sus copias, prestables y lista_espera
   */
  async BuscarLibro(isbn)
  {
    const digitos = String(isbn).replace(/[^0-9Xx]/g, '');
    const [libro] = await Consultar(
      `SELECT id_libro, ISBN, Titulo, Estatus, Autores_Apellidos, Nombre_Editorial, Ubicacion
         FROM vw_catalogo WHERE REPLACE(ISBN, '-', '') = ?`,
      [digitos],
    );
    if (!libro)
    {
      throw ErrorHttp.NoEncontrado(`No hay un libro registrado con el ISBN ${isbn}`);
    }
    const [copias, lista] = await Promise.all([
      Consultar(
        `SELECT e.num_copia, e.Estatus, e.Ubicacion, pr.Fecha_Entrega_Programada
           FROM Ejemplares e
           LEFT JOIN Prestamos pr
             ON pr.id_libro = e.id_libro AND pr.num_copia = e.num_copia AND pr.Estado = 'Activo'
          WHERE e.id_libro = ? AND e.Estatus <> 'Inactivo'
          ORDER BY e.num_copia`,
        [libro.id_libro],
      ),
      Consultar(
        `SELECT le.id_lista_espera, u.Nombre_Completo, u.Matricula_Nomina
           FROM ListaDeEspera le JOIN Usuarios u ON u.id_usuario = le.id_usuario
          WHERE le.id_libro = ? AND le.Estatus = 'Pendiente'
          ORDER BY le.Fecha_Peticion, CAST(le.id_lista_espera AS UNSIGNED)`,
        [libro.id_libro],
      ),
    ]);
    const con_datos = copias.map((copia) => ({
      ...copia,
      Prestable: copia.Estatus === 'Consulta Externa',
      ubicacion: InterpretarCodigoUbicacion(copia.Ubicacion),
    }));
    return {
      ...libro,
      ubicacion: InterpretarCodigoUbicacion(libro.Ubicacion),
      copias: con_datos,
      prestables: con_datos.filter((copia) => copia.Prestable),
      lista_espera: lista,
    };
  },

  /*
   * Función: Registrar
   * Objetivo: Registrar un préstamo si el lector cumple las condiciones, la copia se puede
   *           prestar y, si hay lista de espera, el lector es el primero de la lista.
   * Entrada: { matricula, id_libro, num_copia }
   * Salida: Promesa con { prestamo, lista_espera: { atendida, siguiente } }
   */
  async Registrar({ matricula, id_libro, num_copia })
  {
    const situacion = await ModeloPrestamo.Situacion(matricula);
    const { lector } = situacion;
    if (!situacion.puede_prestar)
    {
      throw ErrorHttp.Conflicto(`No se puede prestar a ${lector.Nombre_Completo}`, {
        codigo: 'LECTOR_NO_CUMPLE',
        condiciones: situacion.condiciones,
      });
    }
    const hoy = Hoy();
    const resultado = await EjecutarEnTransaccion(async (conexion) =>
    {
      const [copia] = await Consultar(
        `SELECT e.Estatus, l.Estatus AS Estatus_Libro, l.Titulo
           FROM Ejemplares e JOIN Libros l ON l.id_libro = e.id_libro
          WHERE e.id_libro = ? AND e.num_copia = ? FOR UPDATE`,
        [id_libro, num_copia],
        conexion,
      );
      if (!copia)
      {
        throw ErrorHttp.NoEncontrado('Esa copia no existe.');
      }
      if (copia.Estatus_Libro !== 'Activo')
      {
        throw ErrorHttp.Conflicto('El libro está inactivo; no se puede prestar.', {
          codigo: 'LIBRO_INACTIVO',
        });
      }
      if (copia.Estatus !== 'Consulta Externa')
      {
        throw ErrorHttp.Conflicto('Solo se prestan copias con estatus Consulta Externa.', {
          codigo: 'COPIA_NO_PRESTABLE',
        });
      }
      const lista = await Consultar(
        `SELECT le.id_lista_espera, le.id_usuario, u.Nombre_Completo
           FROM ListaDeEspera le JOIN Usuarios u ON u.id_usuario = le.id_usuario
          WHERE le.id_libro = ? AND le.Estatus = 'Pendiente'
          ORDER BY le.Fecha_Peticion, CAST(le.id_lista_espera AS UNSIGNED)`,
        [id_libro],
        conexion,
      );
      const turno = lista.findIndex((registro) => registro.id_usuario === lector.id_usuario);
      if (lista.length && turno !== 0)
      {
        throw ErrorHttp.Conflicto(
          `${lista[0].Nombre_Completo} tiene prioridad en la lista de espera de este libro.`,
          { codigo: 'PRIORIDAD_LISTA_ESPERA', primero: lista[0].Nombre_Completo },
        );
      }
      const id_prestamo = await SiguienteId('Prestamos', 'id_prestamo', conexion);
      await Consultar(
        `INSERT INTO Prestamos
           (id_prestamo, Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro,
            num_copia)
         VALUES (?, ?, ?, 'Activo', ?, ?, ?)`,
        [
          id_prestamo,
          hoy,
          situacion.reglas.Fecha_Devolucion,
          lector.id_usuario,
          id_libro,
          num_copia,
        ],
        conexion,
      );
      await Consultar(
        'UPDATE Ejemplares SET Estatus = \'En préstamo\' WHERE id_libro = ? AND num_copia = ?',
        [id_libro, num_copia],
        conexion,
      );
      if (turno === 0)
      {
        await Consultar(
          'UPDATE ListaDeEspera SET Estatus = \'Atendida\' WHERE id_lista_espera = ?',
          [lista[0].id_lista_espera],
          conexion,
        );
      }
      return {
        id_prestamo,
        lista_espera: {
          atendida: turno === 0,
          siguiente: turno === 0 ? lista[1]?.Nombre_Completo ?? null : null,
        },
      };
    });
    return {
      prestamo: await ModeloPrestamo.BuscarPorId(resultado.id_prestamo),
      lista_espera: resultado.lista_espera,
    };
  },

  /*
   * Función: Renovar
   * Objetivo: Renovar un préstamo activo si no llegó al máximo de su perfil. Si ya estaba
   *           vencido, la nueva fecha se cuenta desde hoy y se genera la multa por los días de
   *           retraso; si no, se cuenta desde la fecha programada.
   * Entrada: id_prestamo
   * Salida: Promesa con { prestamo, renovacion: { Numero, Fecha_Anterior, Fecha_Nueva,
   *         Dias_Retraso }, multa }
   */
  async Renovar(id_prestamo)
  {
    const prestamo = await ModeloPrestamo.BuscarPorId(id_prestamo);
    if (!prestamo || prestamo.Estado !== 'Activo')
    {
      throw ErrorHttp.NoEncontrado('No hay un préstamo activo con ese folio.');
    }
    if (prestamo.Renovaciones >= prestamo.Max_Renovaciones)
    {
      throw ErrorHttp.Conflicto(`No se puede renovar el préstamo ${prestamo.Folio}`, {
        codigo: 'MAXIMO_RENOVACIONES',
        mensaje: `Ya alcanzó el máximo de ${prestamo.Max_Renovaciones} renovaciones. Debe ` +
          'devolverse en la biblioteca.',
      });
    }
    const hoy = Hoy();
    const dias_retraso = prestamo.Dias_Retraso;
    const desde = dias_retraso > 0 ? hoy : prestamo.Fecha_Entrega_Programada;
    const fecha_nueva = SumarDiasHabiles(desde, DiasPrestamo(prestamo.Nombre_Rol));
    const numero = prestamo.Renovaciones + 1;
    const multa = await EjecutarEnTransaccion(async (conexion) =>
    {
      await Consultar(
        `INSERT INTO Renovaciones
           (id_prestamo, num_renovacion, Fecha_Renovacion, Fecha_Previamente_Programada)
         VALUES (?, ?, ?, ?)`,
        [id_prestamo, numero, hoy, prestamo.Fecha_Entrega_Programada],
        conexion,
      );
      await Consultar(
        'UPDATE Prestamos SET Fecha_Entrega_Programada = ? WHERE id_prestamo = ?',
        [fecha_nueva, id_prestamo],
        conexion,
      );
      if (dias_retraso === 0)
      {
        return null;
      }
      return ModeloMulta.Crear(
        {
          id_usuario: prestamo.id_usuario,
          id_prestamo,
          monto: dias_retraso * REGLAS.MULTA_POR_DIA,
          motivo: 'Entrega extemporánea',
          justificacion: `Renovación de un préstamo vencido con ${dias_retraso} días de retraso.`,
          fecha: hoy,
        },
        conexion,
      );
    });
    return {
      prestamo: await ModeloPrestamo.BuscarPorId(id_prestamo),
      renovacion: {
        Numero: numero,
        Fecha_Anterior: prestamo.Fecha_Entrega_Programada,
        Fecha_Nueva: fecha_nueva,
        Dias_Retraso: dias_retraso,
      },
      multa,
    };
  },

  /*
   * Función: Resumen
   * Objetivo: Indicadores y últimos préstamos del menú Préstamos.
   * Entrada: Ninguna
   * Salida: Promesa con { activos, nuevos_hoy, vencen_semana, vencidos, en_espera,
   *         libros_en_espera, ultimos }
   */
  async Resumen()
  {
    const hoy = Hoy();
    const [[totales], [espera], ultimos] = await Promise.all([
      Consultar(
        `SELECT COUNT(*) AS activos,
                SUM(Fecha_Prestamo = ?) AS nuevos_hoy,
                SUM(Fecha_Entrega_Programada BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY))
                  AS vencen_semana,
                SUM(Fecha_Entrega_Programada < ?) AS vencidos
           FROM Prestamos WHERE Estado = 'Activo'`,
        [hoy, hoy, hoy, hoy],
      ),
      Consultar(
        `SELECT COUNT(*) AS en_espera, COUNT(DISTINCT id_libro) AS libros
           FROM ListaDeEspera WHERE Estatus = 'Pendiente'`,
      ),
      Consultar(
        `${CONSULTA_PRESTAMO} WHERE pr.Estado = 'Activo'
          ORDER BY pr.Fecha_Prestamo DESC, CAST(pr.id_prestamo AS UNSIGNED) DESC LIMIT 5`,
      ),
    ]);
    return {
      activos: totales.activos,
      nuevos_hoy: Number(totales.nuevos_hoy ?? 0),
      vencen_semana: Number(totales.vencen_semana ?? 0),
      vencidos: Number(totales.vencidos ?? 0),
      en_espera: espera.en_espera,
      libros_en_espera: espera.libros,
      ultimos: ultimos.map((prestamo) => Decorar(prestamo, hoy)),
    };
  },

  /*
   * Función: Vencidos
   * Objetivo: Préstamos activos cuya fecha de devolución ya pasó, opcionalmente de un perfil o
   *           de un lector.
   * Entrada: { perfil, matricula } (opcional)
   * Salida: Promesa con { lector, datos }
   */
  async Vencidos({ perfil, matricula } = {})
  {
    const hoy = Hoy();
    const condicion = ['pr.Estado = \'Activo\'', 'pr.Fecha_Entrega_Programada < ?'];
    const parametros = [hoy];
    let lector = null;
    if (matricula)
    {
      lector = await ModeloPrestamo.BuscarLector(matricula);
      if (lector.Estatus !== 'Activo')
      {
        throw ErrorHttp.Conflicto(`El usuario ${matricula} está inactivo`, {
          codigo: 'USUARIO_INACTIVO',
        });
      }
      condicion.push('pr.id_usuario = ?');
      parametros.push(lector.id_usuario);
    }
    else if (perfil)
    {
      condicion.push('p.Nombre_Rol = ?');
      parametros.push(perfil);
    }
    const filas = await Consultar(
      `${CONSULTA_PRESTAMO} WHERE ${condicion.join(' AND ')}
        ORDER BY pr.Fecha_Entrega_Programada, CAST(pr.id_prestamo AS UNSIGNED)`,
      parametros,
    );
    return { lector, datos: filas.map((fila) => Decorar(fila, hoy)) };
  },
};

export { ModeloPrestamo, CONSULTA_PRESTAMO };
