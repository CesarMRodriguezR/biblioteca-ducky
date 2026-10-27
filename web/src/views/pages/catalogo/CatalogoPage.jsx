import { Link } from 'react-router-dom';
import { FileText, MapPin } from 'lucide-react';
import { useCatalogoController } from '../../../controllers/CatalogoController';
import { CAMPOS_BUSQUEDA, ORDENES_CATALOGO, ubicacionTexto } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import {
  AlertaError, Boton, Buscador, Cargando, Insignia, Paginacion, Portada, Tarjeta,
} from '../../components/ui';
import { ListadoModal } from './ListadoModal';

function TarjetaLibro({ libro }) {
  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  const total = libro.Ejemplares_Totales ?? 0;
  return (
    <Link to={`/catalogo/${libro.id_libro}`} className="tarjeta-libro card">
      <Portada libro={libro} ancho={78} alto={108} />
      <div className="tarjeta-libro__datos">
        <h3 className="tarjeta-libro__titulo">{libro.Titulo}</h3>
        <p className="texto-secundario" style={{ fontSize: 13.5 }}>
          {libro.Autores_Apellidos} · {libro.Nombre_Editorial}
        </p>
        <p className="caption">{libro.Anio}{libro.Temas ? ` · ${libro.Temas}` : ''}</p>
        <div className="fila espacio-8 mt-8" style={{ flexWrap: 'wrap' }}>
          <Insignia tono={disponibles ? 'exito' : 'advertencia'}>
            {total} {total === 1 ? 'copia' : 'copias'} · {disponibles} de {total} disponibles
          </Insignia>
        </div>
        {libro.Pasillo && (
          <p className="caption mt-8 fila espacio-8"><MapPin size={14} aria-hidden /> {ubicacionTexto(libro)}</p>
        )}
      </div>
    </Link>
  );
}

/** BD-SP02-BL01 Búsqueda de libros (catálogo). */
export function CatalogoPage() {
  const c = useCatalogoController();

  return (
    <Pagina miga="Catálogo" titulo="Buscar libros">
      <Tarjeta>
        <div className="fila espacio-12" style={{ flexWrap: 'wrap' }}>
          <Buscador
            valor={c.texto}
            onCambio={c.setTexto}
            onBuscar={c.buscar}
            placeholder="Busca por título, autor, editorial, ISBN, año o tema"
            className="crece"
          />
          <Boton onClick={c.buscar}>Buscar</Boton>
          {c.q && <Boton variante="texto" onClick={c.limpiar}>Limpiar</Boton>}
        </div>
        <div className="fila entre mt-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="chips" role="group" aria-label="Buscar en">
            {CAMPOS_BUSQUEDA.map((campo) => (
              <button
                key={campo.valor}
                type="button"
                className={`chip ${c.campo === campo.valor ? 'chip--activo' : ''}`}
                aria-pressed={c.campo === campo.valor}
                onClick={() => c.elegirCampo(campo.valor)}
              >
                {campo.etiqueta.toUpperCase()}
              </button>
            ))}
          </div>
          <label className="fila espacio-8 caption">
            Ordenar por
            <select className="select" style={{ width: 'auto' }} value={c.orden} onChange={(e) => c.elegirOrden(e.target.value)}>
              {ORDENES_CATALOGO.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
          </label>
        </div>
      </Tarjeta>

      <div className="fila entre mt-24 mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <p className="texto-secundario">
          <strong>{c.resumen}</strong>{c.rango && ` · ${c.rango}`}
        </p>
        {c.puedeListar && (
          <Boton variante="secundario" icono={FileText} onClick={c.abrirListado} disabled={!c.total}>
            Generar listado
          </Boton>
        )}
      </div>

      {c.cargando && !c.libros.length && <Cargando />}
      <AlertaError error={c.error} />
      {!c.cargando && !c.error && !c.libros.length && (
        <Tarjeta style={{ textAlign: 'center', padding: 40 }}>
          <h3>No hay ningún libro registrado con esos datos.</h3>
          <p className="texto-secundario mt-8">Revisa la ortografía o busca en otro campo.</p>
        </Tarjeta>
      )}

      <div className="grid-libros">
        {c.libros.map((libro) => <TarjetaLibro key={libro.id_libro} libro={libro} />)}
      </div>

      {c.total > 0 && (
        <div className="mt-24">
          <Paginacion pagina={c.pagina} totalPaginas={c.totalPaginas} onCambio={c.irAPagina} />
        </div>
      )}

      {c.listadoAbierto && <ListadoModal filtros={c.filtros} onCerrar={c.cerrarListado} />}
    </Pagina>
  );
}
