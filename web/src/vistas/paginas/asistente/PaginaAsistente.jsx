/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 · PaginaAsistente.jsx
 * Función: Asistente Biblio: saludo, preguntas según el perfil y respuestas con su fuente.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Estado del controlador de la pantalla
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente        Objetivo
 *     MensajeAsistente  Burbuja del asistente con su ícono
 *     PaginaAsistente   BD-SP04-CB01 Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { CircleHelp } from 'lucide-react';
import { useControladorAsistente } from '../../../controladores/ControladorAsistente.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { AlertaError, Cargando, Insignia, Tarjeta } from '../../componentes/interfaz.jsx';

/*
 * Componente: MensajeAsistente
 * Objetivo: Burbuja del asistente con su ícono y, si la hay, la fuente de la respuesta.
 * Uso: <MensajeAsistente fuente={…}>…</MensajeAsistente>
 */
function MensajeAsistente({ fuente, children })
{
  return (
    <div className="chat-renglon">
      <div className="chat-icono" aria-hidden>
        <CircleHelp size={18} />
      </div>
      <div className="chat-burbuja">
        {children}
        {fuente && <p className="chat-fuente">Fuente: {fuente}</p>}
      </div>
    </div>
  );
}

/*
 * Componente: PaginaAsistente
 * Objetivo: BD-SP04-CB01 Asistente Biblio (estado inicial y respuestas) para todos los perfiles.
 * Uso: <PaginaAsistente />
 */
export function PaginaAsistente()
{
  const controlador = useControladorAsistente();

  return (
    <Pagina miga="Asistente Biblio" titulo="Asistente Biblio">
      <Tarjeta relleno={false} className="chat">
        <div className="chat-encabezado">
          <div className="chat-icono" aria-hidden>
            <CircleHelp size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="titulo-seccion">Asistente Biblio</h2>
            <p className="texto-nota">
              Resuelve tus dudas sobre Biblio: objetivo, alcance, plataformas y cómo usarla
            </p>
          </div>
          <Insignia tono="exito">En línea</Insignia>
        </div>
        <div className="chat-cuerpo" aria-live="polite">
          <MensajeAsistente>{controlador.saludo}</MensajeAsistente>
          {controlador.conversacion.map((respuesta) => (
            <div key={respuesta.id_pregunta}>
              <div className="chat-renglon chat-renglon-usuario">
                <div className="chat-burbuja chat-burbuja-usuario">{respuesta.Pregunta}</div>
              </div>
              <MensajeAsistente fuente={respuesta.Fuente}>{respuesta.Respuesta}</MensajeAsistente>
            </div>
          ))}
          {controlador.cargando && <Cargando texto="Cargando preguntas…" />}
          {controlador.respondiendo && <Cargando texto="Escribiendo…" />}
          <AlertaError error={controlador.error} />
          <div className="chat-opciones">
            {controlador.disponibles.map((pregunta) => (
              <button
                key={pregunta.id_pregunta}
                type="button"
                className="filtro"
                onClick={() => controlador.Preguntar(pregunta)}
                disabled={controlador.respondiendo}
              >
                {pregunta.Pregunta}
              </button>
            ))}
          </div>
          {!controlador.cargando && !controlador.disponibles.length && (
            <p className="texto-nota chat-opciones">
              Ya respondí todas las preguntas disponibles para tu perfil.
            </p>
          )}
        </div>
      </Tarjeta>
    </Pagina>
  );
}
