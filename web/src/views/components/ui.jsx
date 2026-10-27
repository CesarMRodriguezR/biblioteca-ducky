import { useId } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Code2, Atom, Network, Sigma, Lock, Search, X,
} from 'lucide-react';
import { ESTADOS_COPIA, colorPortada } from '../../models/dominio';

/* ---------- Botones ---------- */
export function Boton({ variante = 'primario', chico, icono: Icono, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`btn btn--${variante} ${chico ? 'btn--chico' : ''} ${className}`}
      {...props}
    >
      {Icono && <Icono size={18} aria-hidden />}
      {children}
    </button>
  );
}

export function BotonIcono({ icono: Icono, etiqueta, peligro, ...props }) {
  return (
    <button
      type="button"
      className={`btn btn--icono ${peligro ? 'btn--icono-peligro' : ''}`}
      aria-label={etiqueta}
      title={etiqueta}
      {...props}
    >
      <Icono size={17} aria-hidden />
    </button>
  );
}

export function EnlaceVolver({ to, children }) {
  return (
    <Link to={to} className="enlace-volver">
      <ArrowLeft size={16} aria-hidden /> {children}
    </Link>
  );
}

/* ---------- Formularios ---------- */
export function Campo({ etiqueta, error, ayuda, children, className = '', id }) {
  return (
    <div className={`campo ${error ? 'campo--error' : ''} ${className}`}>
      {etiqueta && <label className="campo__etiqueta" htmlFor={id}>{etiqueta}</label>}
      {children}
      {error ? <span className="campo__error" role="alert">{error}</span> : ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </div>
  );
}

export function Entrada({ etiqueta, error, ayuda, bloqueado, className, ...props }) {
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className} id={id}>
      <div className={bloqueado ? 'input-icono' : undefined}>
        <input id={id} className="input" disabled={bloqueado} aria-invalid={Boolean(error)} {...props} />
        {bloqueado && <Lock size={16} aria-hidden />}
      </div>
    </Campo>
  );
}

export function AreaTexto({ etiqueta, error, ayuda, className, ...props }) {
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className} id={id}>
      <textarea id={id} className="textarea" aria-invalid={Boolean(error)} {...props} />
    </Campo>
  );
}

export function Selector({ etiqueta, error, ayuda, opciones, marcador, className, ...props }) {
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className} id={id}>
      <select id={id} className="select" aria-invalid={Boolean(error)} {...props}>
        {marcador && <option value="">{marcador}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
        ))}
      </select>
    </Campo>
  );
}

export function Buscador({ valor, onCambio, onBuscar, placeholder, className = '' }) {
  return (
    <form
      className={`input-buscar ${className}`}
      role="search"
      onSubmit={(e) => { e.preventDefault(); onBuscar?.(); }}
    >
      <Search size={17} aria-hidden />
      <input
        className="input"
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </form>
  );
}

export function Radio({ marcado, deshabilitado }) {
  return (
    <span
      className={`radio ${marcado ? 'radio--marcado' : ''} ${deshabilitado ? 'radio--deshabilitado' : ''}`}
      aria-hidden
    />
  );
}

export function Interruptor({ activo, onCambio, deshabilitado, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      className={`toggle ${activo ? 'toggle--activo' : ''}`}
      disabled={deshabilitado}
      onClick={() => onCambio(!activo)}
    />
  );
}

/* ---------- Presentación ---------- */
export function Tarjeta({ children, relleno = true, className = '', ...props }) {
  return <div className={`card ${relleno ? 'card--relleno' : ''} ${className}`} {...props}>{children}</div>;
}

export function Insignia({ tono = 'neutro', children }) {
  return <span className={`badge badge--${tono}`}>{children}</span>;
}

export function InsigniaCopia({ estatus }) {
  const estado = ESTADOS_COPIA[estatus] ?? { etiqueta: estatus, tono: 'neutro' };
  return <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>;
}

export function Alerta({ tipo = 'informacion', titulo, children }) {
  if (!titulo && !children) return null;
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span className="alerta__punto" aria-hidden />
      <div>
        {titulo && <p className="alerta__titulo">{titulo}</p>}
        {children && <div className="alerta__texto">{children}</div>}
      </div>
    </div>
  );
}

/** Muestra el mensaje de un ApiError como alerta de error. */
export function AlertaError({ error, titulo }) {
  if (!error) return null;
  return <Alerta tipo="error" titulo={titulo ?? error.message}>{titulo ? error.message : null}</Alerta>;
}

export function Cargando({ texto = 'Cargando…' }) {
  return <div className="cargando" role="status">{texto}</div>;
}

export function Paginacion({ pagina, totalPaginas, onCambio, mostrarNumeros = true }) {
  if (totalPaginas <= 1 && !mostrarNumeros) return null;
  const paginas = Array.from({ length: Math.max(totalPaginas, 1) }, (_, i) => i + 1).slice(0, 7);
  return (
    <nav className="paginacion" aria-label="Paginación">
      <button
        type="button"
        className="paginacion__boton"
        disabled={pagina <= 1}
        onClick={() => onCambio(pagina - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </button>
      {mostrarNumeros && paginas.map((n) => (
        <button
          key={n}
          type="button"
          className={`paginacion__boton ${n === pagina ? 'paginacion__boton--actual' : ''}`}
          aria-current={n === pagina ? 'page' : undefined}
          onClick={() => onCambio(n)}
        >
          {n}
        </button>
      ))}
      {!mostrarNumeros && <strong className="caption" style={{ color: 'var(--texto-principal)' }}>Página {pagina} de {Math.max(totalPaginas, 1)}</strong>}
      <button
        type="button"
        className="paginacion__boton"
        disabled={pagina >= totalPaginas}
        onClick={() => onCambio(pagina + 1)}
        aria-label="Página siguiente"
      >
        <ChevronRight size={18} />
      </button>
      {mostrarNumeros && <span className="caption" style={{ marginLeft: 8 }}>Página {pagina} de {Math.max(totalPaginas, 1)}</span>}
    </nav>
  );
}

const ICONO_TEMA = { Computación: Code2, Redes: Network, Matemáticas: Sigma, Física: Atom };

/** Portada generada a partir del tema (la BD no guarda imágenes de portada). */
export function Portada({ libro, ancho = 66, alto = 90 }) {
  const tema = libro.Temas?.split(',')[0]?.trim() || libro.Tema || '';
  const Icono = ICONO_TEMA[tema] ?? BookOpen;
  return (
    <div
      className="portada"
      style={{ width: ancho, height: alto, background: colorPortada(libro) }}
      aria-hidden
    >
      <Icono size={Math.round(ancho * 0.42)} strokeWidth={1.6} />
      {ancho >= 60 && <span className="portada__tema">{tema}</span>}
    </div>
  );
}

export function Modal({ titulo, acciones, onCerrar, children }) {
  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="modal">
        <div className="modal__encabezado">
          <h3 style={{ flex: 1 }}>{titulo}</h3>
          {acciones}
          <BotonIcono icono={X} etiqueta="Cerrar" onClick={onCerrar} />
        </div>
        <div className="modal__cuerpo">{children}</div>
      </div>
    </div>
  );
}

export function DatoEtiquetado({ etiqueta, valor }) {
  return (
    <div>
      <div className="etiqueta-dato">{etiqueta}</div>
      <div className="valor-dato">{valor ?? '—'}</div>
    </div>
  );
}
