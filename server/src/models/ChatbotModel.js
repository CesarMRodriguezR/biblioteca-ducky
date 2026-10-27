import { query, withTransaction } from '../config/db.js';

const SELECT_RESPUESTA = `
  SELECT p.id_preguntas, p.Pregunta, c.id_contenidos, c.Respuesta, f.id_fuentes, f.Fuente`;

const PALABRAS_VACIAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'y', 'o', 'en', 'a', 'mi', 'me',
  'como', 'cómo', 'cuanto', 'cuánto', 'cuantos', 'cuántos', 'puedo', 'para', 'por', 'es', 'se',
]);

const ChatbotModel = {
  /**
   * Busca la respuesta más parecida a la pregunta del usuario.
   * Usa FULLTEXT de MariaDB y, si no hay coincidencia, palabras clave con LIKE.
   */
  async responder(texto) {
    let rows = await query(
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

    if (!rows.length) {
      const palabras = texto
        .toLowerCase()
        .replace(/[¿?¡!.,;:]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !PALABRAS_VACIAS.has(w));
      if (palabras.length) {
        const coincidencias = palabras.map(() => '(p.Pregunta LIKE ?)').join(' + ');
        rows = await query(
          `${SELECT_RESPUESTA}, (${coincidencias}) AS Relevancia
             FROM preguntasChatbot p
             JOIN contenidosChatbot c ON c.id_preguntas = p.id_preguntas
             JOIN fuentesChatbot f    ON f.id_fuentes = c.id_fuentes
            HAVING Relevancia > 0
            ORDER BY Relevancia DESC
            LIMIT 3`,
          palabras.map((w) => `%${w}%`),
        );
      }
    }

    if (!rows.length) {
      return { encontrada: false, respuesta: null, sugerencias: await ChatbotModel.preguntasFrecuentes(4) };
    }
    const [mejor, ...resto] = rows;
    return {
      encontrada: true,
      respuesta: mejor,
      sugerencias: resto.map(({ id_preguntas, Pregunta }) => ({ id_preguntas, Pregunta })),
    };
  },

  preguntasFrecuentes(limit = 10) {
    return query(
      'SELECT id_preguntas, Pregunta FROM preguntasChatbot ORDER BY id_preguntas LIMIT ?',
      [Number(limit)],
    );
  },

  listar() {
    return query(
      `${SELECT_RESPUESTA}
         FROM preguntasChatbot p
         LEFT JOIN contenidosChatbot c ON c.id_preguntas = p.id_preguntas
         LEFT JOIN fuentesChatbot f    ON f.id_fuentes = c.id_fuentes
        ORDER BY p.id_preguntas`,
    );
  },

  async findPregunta(id, conn) {
    const rows = await query(
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
  crear({ Pregunta, Respuesta, id_fuentes }) {
    return withTransaction(async (conn) => {
      const r = await query('INSERT INTO preguntasChatbot (Pregunta) VALUES (?)', [Pregunta], conn);
      await query(
        'INSERT INTO contenidosChatbot (Respuesta, id_preguntas, id_fuentes) VALUES (?, ?, ?)',
        [Respuesta, r.insertId, id_fuentes],
        conn,
      );
      return ChatbotModel.findPregunta(r.insertId, conn);
    });
  },

  actualizar(id, { Pregunta, Respuesta, id_fuentes }) {
    return withTransaction(async (conn) => {
      if (Pregunta !== undefined) {
        await query('UPDATE preguntasChatbot SET Pregunta = ? WHERE id_preguntas = ?', [Pregunta, id], conn);
      }
      if (Respuesta !== undefined || id_fuentes !== undefined) {
        const sets = [];
        const params = [];
        if (Respuesta !== undefined) { sets.push('Respuesta = ?'); params.push(Respuesta); }
        if (id_fuentes !== undefined) { sets.push('id_fuentes = ?'); params.push(id_fuentes); }
        await query(`UPDATE contenidosChatbot SET ${sets.join(', ')} WHERE id_preguntas = ?`, [...params, id], conn);
      }
      return ChatbotModel.findPregunta(id, conn);
    });
  },

  async eliminar(id) {
    const r = await query('DELETE FROM preguntasChatbot WHERE id_preguntas = ?', [id]);
    return r.affectedRows > 0;
  },
};

export { ChatbotModel };
