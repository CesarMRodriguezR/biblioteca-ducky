import { Consultar, EjecutarEnTransaccion } from '../configuracion/conexion.js';

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

const ModeloChatbot = {
  /**
   * Busca la respuesta más parecida a la pregunta del usuario.
   * Usa FULLTEXT de MariaDB y, si no hay coincidencia, palabras clave con LIKE.
   */
  async Responder(texto) 
  {
    let rows = await Consultar(
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

    if (!rows.length) 
    {
      const palabras = texto
        .toLowerCase()
        .replace(/[¿?¡!.,;:]/g, ' ')
        .split(/\s+/)
        .filter((parte) => parte.length > 2 && !PALABRAS_VACIAS.has(parte));
      if (palabras.length) 
      {
        const coincidencias = palabras.map(() => '(p.Pregunta LIKE ?)').join(' + ');
        rows = await Consultar(
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

    if (!rows.length) 
    {
      return {
        encontrada: false,
        respuesta: null,
        sugerencias: await ModeloChatbot.PreguntasFrecuentes(4),
      };
    }
    const [mejor, ...resto] = rows;
    return {
      encontrada: true,
      respuesta: mejor,
      sugerencias: resto.map(({ id_preguntas, Pregunta }) => ({ id_preguntas, Pregunta })),
    };
  },

  PreguntasFrecuentes(limit = 10) 
  {
    return Consultar(
      'SELECT id_preguntas, Pregunta FROM preguntasChatbot ORDER BY id_preguntas LIMIT ?',
      [Number(limit)],
    );
  },

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

  async BuscarPregunta(id, conn) 
  {
    const rows = await Consultar(
      `${SELECT_RESPUESTA}
         FROM preguntasChatbot p
         LEFT JOIN contenidosChatbot c ON c.id_preguntas = p.id_preguntas
         LEFT JOIN fuentesChatbot f    ON f.id_fuentes = c.id_fuentes
        WHERE p.id_preguntas = ?`,
      [id],
      conn,
    );
    return rows[0] || null;
  },

  /** Alta de pregunta con su respuesta y fuente. */
  Crear({ Pregunta, Respuesta, id_fuentes }) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      const resultado = await Consultar(
        'INSERT INTO preguntasChatbot (Pregunta) VALUES (?)',
        [Pregunta],
        conn,
      );
      await Consultar(
        'INSERT INTO contenidosChatbot (Respuesta, id_preguntas, id_fuentes) VALUES (?, ?, ?)',
        [Respuesta, resultado.insertId, id_fuentes],
        conn,
      );
      return ModeloChatbot.BuscarPregunta(resultado.insertId, conn);
    });
  },

  Actualizar(id, { Pregunta, Respuesta, id_fuentes }) 
  {
    return EjecutarEnTransaccion(async (conn) => 
    {
      if (Pregunta !== undefined) 
      {
        await Consultar(
          'UPDATE preguntasChatbot SET Pregunta = ? WHERE id_preguntas = ?',
          [Pregunta, id],
          conn,
        );
      }
      if (Respuesta !== undefined || id_fuentes !== undefined) 
      {
        const sets = [];
        const params = [];
        if (Respuesta !== undefined) 
        {
          sets.push('Respuesta = ?');
          params.push(Respuesta);
        }
        if (id_fuentes !== undefined) 
        {
          sets.push('id_fuentes = ?');
          params.push(id_fuentes);
        }
        await Consultar(
          `UPDATE contenidosChatbot SET ${sets.join(', ')} WHERE id_preguntas = ?`,
          [...params, id],
          conn,
        );
      }
      return ModeloChatbot.BuscarPregunta(id, conn);
    });
  },

  async Eliminar(id) 
  {
    const resultado = await Consultar('DELETE FROM preguntasChatbot WHERE id_preguntas = ?', [id]);
    return resultado.affectedRows > 0;
  },
};

export { ModeloChatbot };
