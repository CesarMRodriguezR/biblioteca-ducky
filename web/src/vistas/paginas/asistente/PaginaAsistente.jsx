/*
 * ******************************************************************
 * Nombre del programa: BD-SP04-CB01 y CB02 · PaginaAsistente.jsx
 * Función: Asistente Biblio: saludo, preguntas frecuentes, preguntas escritas y respuestas con
 *          su fuente.
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
 *     PaginaAsistente   BD-SP04-CB01 y CB02 Asistente Biblio
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) La conversación se desplaza dentro de la tarjeta y baja sola al último mensaje; la barra
 *     para escribir siempre queda visible.
 * ******************************************************************
 */

import { useEffect, useRef } from 'react';
import { CircleHelp } from 'lucide-react';
import { useControladorAsistente } from '../../../controladores/ControladorAsistente.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  AlertaError,
  Boton,
  Cargando,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: MensajeAsistente
 * Objetivo: Burbuja del asistente con su ícono y, si las hay, la pregunta que reconoció en un
 *           mensaje escrito y la fuente de la respuesta.
 * Uso: <MensajeAsistente pregunta={…} fuente={…}>…</MensajeAsistente>
 */
function MensajeAsistente({ pregunta, fuente, children })
{
  return (
    <div className="chat-renglon">
      <div className="chat-icono" aria-hidden>
        <CircleHelp size={18} />
      </div>
      <div className="chat-burbuja">
        {pregunta && <p className="chat-pregunta-detectada">Sobre: {pregunta}</p>}
        {children}
        {fuente && <p className="chat-fuente">Fuente: {fuente}</p>}
      </div>
    </div>
  );
}

/*
 * Componente: PaginaAsistente
 * Objetivo: BD-SP04-CB01 y CB02 Asistente Biblio (estado inicial y respuestas) para todos los
 *           perfiles.
 * Uso: <PaginaAsistente />
 */
export function PaginaAsistente()
{
  const controlador = useControladorAsistente();
  const cuerpo = useRef(null);

  // Al llegar un mensaje (o el «Escribiendo…»), mostrar lo último de la conversación.
  useEffect(() =>
  {
    cuerpo.current?.scrollTo({ top: cuerpo.current.scrollHeight, behavior: 'smooth' });
  }, [controlador.conversacion.length, controlador.respondiendo]);

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
              Resuelve tus dudas sobre Biblio con inteligencia artificial: elige una pregunta o
              escribe la tuya
            </p>
          </div>
          <Insignia tono="exito">En línea</Insignia>
        </div>
        <div className="chat-cuerpo" aria-live="polite" ref={cuerpo}>
          <MensajeAsistente>{controlador.saludo}</MensajeAsistente>
          {controlador.conversacion.map((respuesta) => (
            <div key={respuesta.clave}>
              <div className="chat-renglon chat-renglon-usuario">
                <div className="chat-burbuja chat-burbuja-usuario">{respuesta.texto_usuario}</div>
              </div>
              <MensajeAsistente
                pregunta={respuesta.encontrada ? respuesta.Pregunta : null}
                fuente={respuesta.Fuente}
              >
                {respuesta.Respuesta}
              </MensajeAsistente>
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
              Ya respondí todas las preguntas frecuentes. Escríbeme si tienes otra duda.
            </p>
          )}
        </div>
        <form className="chat-redactar" onSubmit={controlador.EnviarMensaje}>
          <input
            className="entrada"
            value={controlador.mensaje}
            onChange={(evento) => controlador.SetMensaje(evento.target.value)}
            placeholder="Escribe tu pregunta sobre Biblio…"
            aria-label="Escribe tu pregunta"
            maxLength={300}
            disabled={controlador.respondiendo}
          />
          <Boton type="submit" disabled={controlador.respondiendo}>
            Enviar
          </Boton>
        </form>
      </Tarjeta>
    </Pagina>
  );
}
