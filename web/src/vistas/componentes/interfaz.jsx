/*
 * ******************************************************************
 * Nombre del programa: WEB-INTERFAZ · interfaz.jsx
 * Función: Componentes de interfaz del sistema de diseño: botones, campos, insignias, alertas,
 *          tablas y modal.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Props y estado del controlador de la pantalla
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente       Objetivo
 *     Boton            Botón con variantes primario, secundario, peligro y…
 *     BotonIcono       Botón que solo muestra un ícono, con etiqueta accesible
 *     EnlaceVolver     Enlace para regresar a la pantalla anterior
 *     Campo            Etiqueta, control, ayuda y error de un campo de formulario
 *     Entrada          Campo de texto con etiqueta, ayuda, error y estado bloqueado
 *     AreaTexto        Campo de texto de varias líneas
 *     Selector         Lista desplegable con etiqueta y opciones
 *     Buscador         Campo de búsqueda con ícono que busca al presionar Enter
 *     Radio            Indicador visual de opción elegida
 *     Interruptor      Interruptor de encendido y apagado
 *     Tarjeta          Contenedor con borde y sombra
 *     Insignia         Etiqueta de color para estados y perfiles
 *     InsigniaCopia    Insignia del estado de una copia
 *     Alerta           Mensaje de éxito, advertencia, información o error
 *     AlertaError      Muestra el mensaje de un ErrorApi como alerta de error
 *     Cargando         Indicador de carga
 *     Paginacion       Botones de página anterior y siguiente con el número de…
 *     ICONO_TEMA       Ícono de portada de cada tema
 *     Portada          Portada generada a partir del tema (la BD no guarda…
 *     Modal            Ventana modal con título, acciones y botón de cerrar
 *     DatoEtiquetado   Dato con su etiqueta en mayúsculas
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) Los estilos están en las clases de estilos-globales.css; style en línea solo para valores
 *     calculados.
 * ******************************************************************
 */

import { useId } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  Atom,
  Network,
  Sigma,
  Lock,
  Search,
  X,
} from 'lucide-react';
import { ESTADOS_COPIA, ColorPortada } from '../../modelos/dominio.js';

/*------------------------------------------------------------------
 * Sección: Botones
 * Objetivo: Botones con texto y botones de solo ícono.
 *------------------------------------------------------------------*/
/*
 * Componente: Boton
 * Objetivo: Botón con variantes primario, secundario, peligro y texto, y con ícono opcional.
 * Uso: <Boton variante={…} chico={…} icono={…} className={…}>…</Boton>
 */
export function Boton({
  variante = 'primario',
  chico,
  icono: Icono,
  children,
  className = '',
  ...propiedades
})
{
  return (
    <button
      type="button"
      className={`boton boton-${variante} ${chico ? 'boton-chico' : ''} ${className}`}
      {...propiedades}
    >
      {Icono && <Icono size={18} aria-hidden />}
      {children}
    </button>
  );
}

/*
 * Componente: BotonIcono
 * Objetivo: Botón que solo muestra un ícono, con etiqueta accesible.
 * Uso: <BotonIcono icono={…} etiqueta={…} peligro={…} />
 */
export function BotonIcono({ icono: Icono, etiqueta, peligro, ...propiedades })
{
  return (
    <button
      type="button"
      className={`boton boton-icono ${peligro ? 'boton-icono-peligro' : ''}`}
      aria-label={etiqueta}
      title={etiqueta}
      {...propiedades}
    >
      <Icono size={17} aria-hidden />
    </button>
  );
}

/*
 * Componente: EnlaceVolver
 * Objetivo: Enlace para regresar a la pantalla anterior.
 * Uso: <EnlaceVolver to={…}>…</EnlaceVolver>
 */
export function EnlaceVolver({ to, children })
{
  return (
    <Link to={to} className="enlace-volver">
      <ArrowLeft size={16} aria-hidden /> {children}
    </Link>
  );
}

/*------------------------------------------------------------------
 * Sección: Formularios
 * Objetivo: Campos de formulario: texto, selector, búsqueda, radio e interruptor.
 *------------------------------------------------------------------*/
/*
 * Componente: Campo
 * Objetivo: Etiqueta, control, ayuda y error de un campo de formulario.
 * Uso: <Campo etiqueta={…} error={…} ayuda={…} className={…} …>…</Campo>
 */
export function Campo({ etiqueta, error, ayuda, children, className = '', id })
{
  return (
    <div className={`campo ${error ? 'campo-con-error' : ''} ${className}`}>
      {etiqueta && (
        <label className="campo-etiqueta" htmlFor={id}>
          {etiqueta}
        </label>
      )}
      {children}
      {error ? (
        <span className="campo-mensaje-error" role="alert">
          {error}
        </span>
      ) : (
        ayuda && <span className="campo-ayuda">{ayuda}</span>
      )}
    </div>
  );
}

/*
 * Componente: Entrada
 * Objetivo: Campo de texto con etiqueta, ayuda, error y estado bloqueado.
 * Uso: <Entrada etiqueta={…} error={…} ayuda={…} bloqueado={…} … />
 */
export function Entrada({ etiqueta, error, ayuda, bloqueado, className, ...propiedades })
{
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className} id={id}>
      <div className={bloqueado ? 'entrada-icono' : undefined}>
        <input
          id={id}
          className="entrada"
          disabled={bloqueado}
          aria-invalid={Boolean(error)}
          {...propiedades}
        />
        {bloqueado && <Lock size={16} aria-hidden />}
      </div>
    </Campo>
  );
}

/*
 * Componente: AreaTexto
 * Objetivo: Campo de texto de varias líneas.
 * Uso: <AreaTexto etiqueta={…} error={…} ayuda={…} className={…} />
 */
export function AreaTexto({ etiqueta, error, ayuda, className, ...propiedades })
{
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className} id={id}>
      <textarea id={id} className="area-texto" aria-invalid={Boolean(error)} {...propiedades} />
    </Campo>
  );
}

/*
 * Componente: Selector
 * Objetivo: Lista desplegable con etiqueta y opciones.
 * Uso: <Selector etiqueta={…} error={…} ayuda={…} opciones={…} … />
 */
export function Selector({
  etiqueta,
  error,
  ayuda,
  opciones,
  marcador,
  className,
  ...propiedades
})
{
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className} id={id}>
      <select id={id} className="selector" aria-invalid={Boolean(error)} {...propiedades}>
        {marcador && <option value="">{marcador}</option>}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </Campo>
  );
}

/*
 * Componente: Buscador
 * Objetivo: Campo de búsqueda con ícono que busca al presionar Enter.
 * Uso: <Buscador valor={…} al_cambio={…} al_buscar={…} placeholder={…} … />
 */
export function Buscador({ valor, al_cambio, al_buscar, placeholder, className = '' })
{
  return (
    <form
      className={`entrada-buscar ${className}`}
      role="search"
      onSubmit={(evento) =>
      {
        evento.preventDefault();
        al_buscar?.();
      }}
    >
      <Search size={17} aria-hidden />
      <input
        className="entrada"
        type="search"
        value={valor}
        onChange={(evento) => al_cambio(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </form>
  );
}

/*
 * Componente: Radio
 * Objetivo: Indicador visual de opción elegida.
 * Uso: <Radio marcado={…} deshabilitado={…} />
 */
export function Radio({ marcado, deshabilitado })
{
  return (
    <span
      className={`radio ${marcado ? 'radio-marcado' : ''} ${deshabilitado ? 'radio-deshabilitado' : ''}`}
      aria-hidden
    />
  );
}

/*
 * Componente: Interruptor
 * Objetivo: Interruptor de encendido y apagado.
 * Uso: <Interruptor activo={…} al_cambio={…} deshabilitado={…} etiqueta={…} />
 */
export function Interruptor({ activo, al_cambio, deshabilitado, etiqueta })
{
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      className={`interruptor ${activo ? 'interruptor-activo' : ''}`}
      disabled={deshabilitado}
      onClick={() => al_cambio(!activo)}
    />
  );
}

/*------------------------------------------------------------------
 * Sección: Presentación
 * Objetivo: Elementos de presentación: tarjetas, insignias, alertas, paginación, portada y modal.
 *------------------------------------------------------------------*/
/*
 * Componente: Tarjeta
 * Objetivo: Contenedor con borde y sombra.
 * Uso: <Tarjeta relleno={…} className={…}>…</Tarjeta>
 */
export function Tarjeta({ children, relleno = true, className = '', ...propiedades })
{
  return (
    <div className={`tarjeta ${relleno ? 'tarjeta-rellena' : ''} ${className}`} {...propiedades}>
      {children}
    </div>
  );
}

/*
 * Componente: Insignia
 * Objetivo: Etiqueta de color para estados y perfiles.
 * Uso: <Insignia tono={…}>…</Insignia>
 */
export function Insignia({ tono = 'neutro', children })
{
  return <span className={`insignia insignia-${tono}`}>{children}</span>;
}

/*
 * Componente: InsigniaCopia
 * Objetivo: Insignia del estado de una copia.
 * Uso: <InsigniaCopia estatus={…} />
 */
export function InsigniaCopia({ estatus })
{
  const estado = ESTADOS_COPIA[estatus] ?? { etiqueta: estatus, tono: 'neutro' };
  return <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>;
}

/*
 * Componente: Alerta
 * Objetivo: Mensaje de éxito, advertencia, información o error.
 * Uso: <Alerta tipo={…} titulo={…}>…</Alerta>
 */
export function Alerta({ tipo = 'informacion', titulo, children })
{
  if (!titulo && !children)
  {
    return null;
  }
  return (
    <div className={`alerta alerta-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span className="alerta-punto" aria-hidden />
      <div>
        {titulo && <p className="alerta-titulo">{titulo}</p>}
        {children && <div className="alerta-texto">{children}</div>}
      </div>
    </div>
  );
}

/*
 * Componente: AlertaError
 * Objetivo: Muestra el mensaje de un ErrorApi como alerta de error.
 * Uso: <AlertaError error={…} titulo={…} />
 */
export function AlertaError({ error, titulo })
{
  if (!error)
  {
    return null;
  }
  return (
    <Alerta tipo="error" titulo={titulo ?? error.message}>
      {titulo ? error.message : null}
    </Alerta>
  );
}

/*
 * Componente: Cargando
 * Objetivo: Indicador de carga.
 * Uso: <Cargando texto={…} />
 */
export function Cargando({ texto = 'Cargando…' })
{
  return (
    <div className="cargando" role="status">
      {texto}
    </div>
  );
}

/*
 * Componente: Paginacion
 * Objetivo: Botones de página anterior y siguiente con el número de página.
 * Uso: <Paginacion pagina={…} total_paginas={…} al_cambio={…} mostrar_numeros={…} />
 */
export function Paginacion({ pagina, total_paginas, al_cambio, mostrar_numeros = true })
{
  if (total_paginas <= 1 && !mostrar_numeros)
  {
    return null;
  }
  const paginas = Array.from(
    { length: Math.max(total_paginas, 1) },
    (_, indice) => indice + 1,
  ).slice(0, 7);
  return (
    <nav className="paginacion" aria-label="Paginación">
      <button
        type="button"
        className="paginacion-boton"
        disabled={pagina <= 1}
        onClick={() => al_cambio(pagina - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </button>
      {mostrar_numeros &&
        paginas.map((pagina_actual) => (
          <button
            key={pagina_actual}
            type="button"
            className={`paginacion-boton ${pagina_actual === pagina ? 'paginacion-boton-actual' : ''}`}
            aria-current={pagina_actual === pagina ? 'page' : undefined}
            onClick={() => al_cambio(pagina_actual)}
          >
            {pagina_actual}
          </button>
        ))}
      {!mostrar_numeros && (
        <strong className="texto-nota" style={{ color: 'var(--texto-principal)' }}>
          Página {pagina} de {Math.max(total_paginas, 1)}
        </strong>
      )}
      <button
        type="button"
        className="paginacion-boton"
        disabled={pagina >= total_paginas}
        onClick={() => al_cambio(pagina + 1)}
        aria-label="Página siguiente"
      >
        <ChevronRight size={18} />
      </button>
      {mostrar_numeros && (
        <span className="texto-nota" style={{ marginLeft: 8 }}>
          Página {pagina} de {Math.max(total_paginas, 1)}
        </span>
      )}
    </nav>
  );
}

/*
 * Constante: ICONO_TEMA
 * Objetivo: Ícono de portada de cada tema.
 */
const ICONO_TEMA = { Computación: Code2, Redes: Network, Matemáticas: Sigma, Física: Atom };

/*
 * Componente: Portada
 * Objetivo: Portada generada a partir del tema (la BD no guarda imágenes de portada).
 * Uso: <Portada libro={…} ancho={…} alto={…} />
 */
export function Portada({ libro, ancho = 66, alto = 90 })
{
  const tema = libro.Temas?.split(',')[0]?.trim() || libro.Tema || '';
  const Icono = ICONO_TEMA[tema] ?? BookOpen;
  return (
    <div
      className="portada"
      style={{ width: ancho, height: alto, background: ColorPortada(libro) }}
      aria-hidden
    >
      <Icono size={Math.round(ancho * 0.42)} strokeWidth={1.6} />
      {ancho >= 60 && <span className="portada-tema">{tema}</span>}
    </div>
  );
}

/*
 * Componente: Modal
 * Objetivo: Ventana modal con título, acciones y botón de cerrar.
 * Uso: <Modal titulo={…} acciones={…} al_cerrar={…}>…</Modal>
 */
export function Modal({ titulo, acciones, al_cerrar, children })
{
  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="modal">
        <div className="modal-encabezado">
          <h3 style={{ flex: 1 }}>{titulo}</h3>
          {acciones}
          <BotonIcono icono={X} etiqueta="Cerrar" onClick={al_cerrar} />
        </div>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  );
}

/*
 * Componente: DatoEtiquetado
 * Objetivo: Dato con su etiqueta en mayúsculas.
 * Uso: <DatoEtiquetado etiqueta={…} valor={…} />
 */
export function DatoEtiquetado({ etiqueta, valor })
{
  return (
    <div>
      <div className="etiqueta-dato">{etiqueta}</div>
      <div className="valor-dato">{valor ?? '—'}</div>
    </div>
  );
}
