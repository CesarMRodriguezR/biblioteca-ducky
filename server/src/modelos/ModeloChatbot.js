/*
 * ******************************************************************
 * Nombre del programa: API-CHATBOT · ModeloChatbot.js
 * Función: Preguntas frecuentes del chatbot y búsqueda de la respuesta más parecida.
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
 *     Módulo             Objetivo
 *     SELECT_RESPUESTA   Consulta base de pregunta, respuesta y fuente
 *     ModeloChatbot      Acceso a las preguntas frecuentes del chatbot
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

import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';

/*
 * Constante: SELECT_RESPUESTA
 * Objetivo: Consulta base de pregunta, respuesta y fuente.
 */
const SELECT_RESPUESTA = `
  SELECT p.id_preguntas, p.Pregunta, c.id_contenidos, c.Respuesta, f.id_fuentes, f.Fuente`;

const PALABRAS_VACIAS = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'de',
  'del',
  'que',
  'y',
  'o',
  'en',
  'a',
  'mi',
  'me',
  'como',
  'cómo',
  'cuanto',
  'cuánto',
  'cuantos',
  'cuántos',
  'puedo',
  'para',
  'por',
  'es',
  'se',
]);

/*
 * Módulo: ModeloChatbot
 * Objetivo: Acceso a las preguntas frecuentes del chatbot.
 */
const ModeloChatbot = {
  /*
   * Función: Responder
   * Objetivo: Busca la respuesta más parecida a la pregunta del usuario. Usa FULLTEXT de
   *           MariaDB y, si no hay coincidencia, palabras clave con LIKE.
   * Entrada: texto
   * Salida: Promesa con { encontrada, respuesta, pregunta?, fuente? }
   */
  async Responder(texto)
  {
    let filas = await Consultar(
      `${SELECT_RESPUESTA},
              MATCH(p.Pregunta) AGAINST (? IN NATURAL LANGUAGE MODE) AS Relevancia
         FROM preguntasChatbot p
         JOIN contenidosChatbot c ON c.id_preguntas = p.id_preguntas
         JOIN fuentesChatbot f    ON f.id_fuentes = c.id_fuentes
        WHERE MATCH(p.Pregunta) AGAINST (? IN NATURAL LANGUAGE MODE)
        ORDER BY Relevancia DESC
        LIMIT 3`,
      [texto, texto],
    );

    if (!filas.length)
    {
      const palabras = texto
        .toLowerCase()
        .replace(/[¿?¡!.,;:]/g, ' ')
        .split(/\s+/)
        .filter((parte) => parte.length > 2 && !PALABRAS_VACIAS.has(parte));
      if (palabras.length)
      {
        const coincidencias = palabras.map(() => '(p.Pregunta LIKE ?)').join(' + ');
        filas = await Consultar(
          `${SELECT_RESPUESTA}, (${coincidencias}) AS Relevancia
             FROM preguntasChatbot p
             JOIN contenidosChatbot c ON c.id_preguntas = p.id_preguntas
             JOIN fuentesChatbot f    ON f.id_fuentes = c.id_fuentes
            HAVING Relevancia > 0
            ORDER BY Relevancia DESC
            LIMIT 3`,
          palabras.map((palabra) => `%${palabra}%`),
        );
      }
    }

    if (!filas.length)
    {
      return {
        encontrada: false,
        respuesta: null,
        sugerencias: await ModeloChatbot.PreguntasFrecuentes(4),
      };
    }
    const [mejor, ...resto] = filas;
    return {
      encontrada: true,
      respuesta: mejor,
      sugerencias: resto.map(({ id_preguntas, Pregunta }) => ({ id_preguntas, Pregunta })),
    };
  },

  /*
   * Función: PreguntasFrecuentes
   * Objetivo: Obtener las preguntas frecuentes para mostrarlas como sugerencias.
   * Entrada: limit (opcional)
   * Salida: Promesa con las preguntas
   */
  PreguntasFrecuentes(limit = 10)
  {
    return Consultar(
      'SELECT id_preguntas, Pregunta FROM preguntasChatbot ORDER BY id_preguntas LIMIT ?',
      [Number(limit)],
    );
  },

  /*
   * Función: Listar
   * Objetivo: Listar todas las preguntas con su respuesta y fuente.
   * Entrada: Ninguna
   * Salida: Promesa con las filas encontradas
   */
  Listar()
  {
    return Consultar(
      `${SELECT_RESPUESTA}
         FROM preguntasChatbot p
         LEFT JOIN contenidosChatbot c ON c.id_preguntas = p.id_preguntas
         LEFT JOIN fuentesChatbot f    ON f.id_fuentes = c.id_fuentes
        ORDER BY p.id_preguntas`,
    );
  },

  /*
   * Función: BuscarPregunta
   * Objetivo: Obtener una pregunta con su respuesta.
   * Entrada: id, conexion
   * Salida: Promesa con la pregunta o null
   */
  async BuscarPregunta(id, conexion)
  {
    const filas = await Consultar(
      `${SELECT_RESPUESTA}
         FROM preguntasChatbot p
         LEFT JOIN contenidosChatbot c ON c.id_preguntas = p.id_preguntas
         LEFT JOIN fuentesChatbot f    ON f.id_fuentes = c.id_fuentes
        WHERE p.id_preguntas = ?`,
      [id],
      conexion,
    );
    return filas[0] || null;
  },

  /*
   * Función: Crear
   * Objetivo: Alta de pregunta con su respuesta y fuente.
   * Entrada: { Pregunta, Respuesta, id_fuentes }
   * Salida: Promesa con el registro creado
   */
  Crear({ Pregunta, Respuesta, id_fuentes })
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      const resultado = await Consultar(
        'INSERT INTO preguntasChatbot (Pregunta) VALUES (?)',
        [Pregunta],
        conexion,
      );
      await Consultar(
        'INSERT INTO contenidosChatbot (Respuesta, id_preguntas, id_fuentes) VALUES (?, ?, ?)',
        [Respuesta, resultado.insertId, id_fuentes],
        conexion,
      );
      return ModeloChatbot.BuscarPregunta(resultado.insertId, conexion);
    });
  },

  /*
   * Función: Actualizar
   * Objetivo: Modificar un pregunta del chatbot existente.
   * Entrada: id, { Pregunta, Respuesta, id_fuentes }
   * Salida: Promesa con el registro actualizado
   */
  Actualizar(id, { Pregunta, Respuesta, id_fuentes })
  {
    return EjecutarEnTransaccion(async (conexion) =>
    {
      if (Pregunta !== undefined)
      {
        await Consultar(
          'UPDATE preguntasChatbot SET Pregunta = ? WHERE id_preguntas = ?',
          [Pregunta, id],
          conexion,
        );
      }
      if (Respuesta !== undefined || id_fuentes !== undefined)
      {
        const sets = [];
        const parametros = [];
        if (Respuesta !== undefined)
        {
          sets.push('Respuesta = ?');
          parametros.push(Respuesta);
        }
        if (id_fuentes !== undefined)
        {
          sets.push('id_fuentes = ?');
          parametros.push(id_fuentes);
        }
        await Consultar(
          `UPDATE contenidosChatbot SET ${sets.join(', ')} WHERE id_preguntas = ?`,
          [...parametros, id],
          conexion,
        );
      }
      return ModeloChatbot.BuscarPregunta(id, conexion);
    });
  },

  /*
   * Función: Eliminar
   * Objetivo: Eliminar una pregunta y su respuesta.
   * Entrada: id
   * Salida: Promesa con true si se eliminó el registro
   */
  async Eliminar(id)
  {
    const resultado = await Consultar('DELETE FROM preguntasChatbot WHERE id_preguntas = ?', [id]);
    return resultado.affectedRows > 0;
  },
};

export { ModeloChatbot };
