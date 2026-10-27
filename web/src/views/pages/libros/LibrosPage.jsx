import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Archive, PenLine, RotateCcw, Search, ShoppingCart,
} from 'lucide-react';
import { useSesion } from '../../../controllers/SesionController';
import { useLibrosRegistradosController } from '../../../controllers/LibrosController';
import { Pagina } from '../../layouts/AppLayout';
import {
  AlertaError, Boton, BotonIcono, Buscador, Insignia, Paginacion, Portada, Tarjeta,
} from '../../components/ui';

/** Pantalla principal de Libros. */
export function LibrosPage() {
  const c = useLibrosRegistradosController();
  const { puede } = useSesion();
  const navegar = useNavigate();

  const acciones = [
    { titulo: 'Alta de libro', texto: 'Registra una ficha nueva o agrega ejemplares a una existente.', icono: PenLine, fondo: 'fondo-azul', ruta: '/libros/nuevo' },
    { titulo: 'Consultar libros', texto: 'Busca en el catálogo por título, autor, tema o ISBN.', icono: Search, fondo: 'fondo-brillante', ruta: '/catalogo' },
    puede('solicitar_compra') && { titulo: 'Solicitar libros', texto: 'Pide la compra de títulos nuevos o más ejemplares.', icono: ShoppingCart, fondo: 'fondo-dorado', ruta: '/libros/solicitar' },
  ].filter(Boolean);

  return (
    <Pagina miga="Libros · Inicio" titulo="Libros">
      <div className="grid-3">
        {acciones.map((a) => (
          <button key={a.titulo} type="button" className="card tarjeta-accion" onClick={() => navegar(a.ruta)}>
            <div className={`tarjeta-accion__icono ${a.fondo}`}><a.icono size={20} aria-hidden /></div>
            <div>
              <div className="tarjeta-accion__titulo">{a.titulo}</div>
              <p className="caption mt-8" style={{ color: 'var(--texto-secundario)' }}>{a.texto}</p>
            </div>
            <ArrowRight className="tarjeta-accion__flecha" size={18} aria-hidden />
          </button>
        ))}
      </div>

      <div className="fila entre mt-32 mb-16">
        <h2>Libros registrados</h2>
        <Buscador
          valor={c.texto}
          onCambio={c.setTexto}
          onBuscar={c.buscar}
          placeholder="Buscar por título o ISBN…"
          className="buscador-libros"
        />
      </div>
      <AlertaError error={c.error} />

      <Tarjeta relleno={false} className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Libro</th><th>Copias</th><th>Estado</th><th>Editar / Solicitar</th><th>Desactivar / Activar</th>
            </tr>
          </thead>
          <tbody>
            {c.libros.map((l) => {
              const activo = l.Estatus === 'Activo';
              return (
                <tr key={l.id_libro}>
                  <td>
                    <div className="fila espacio-12">
                      <Portada libro={l} ancho={26} alto={36} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{l.Titulo}</div>
                        <div className="caption">{l.Autores_Apellidos} · {l.Nombre_Editorial} · ISBN {l.ISBN}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{l.Ejemplares_Totales}</td>
                  <td><Insignia tono={activo ? 'exito' : 'neutro'}>{l.Estatus}</Insignia></td>
                  <td>
                    <div className="fila espacio-8">
                      <BotonIcono icono={PenLine} etiqueta={`Editar ${l.Titulo}`} onClick={() => navegar(`/libros/${l.id_libro}/editar`)} />
                      {puede('solicitar_compra') && (
                        <BotonIcono
                          icono={ShoppingCart}
                          etiqueta={`Solicitar copias de ${l.Titulo}`}
                          onClick={() => navegar(`/libros/${l.id_libro}/solicitar`)}
                          disabled={!activo}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    {activo ? (
                      <Boton variante="peligro" chico icono={Archive} onClick={() => navegar(`/libros/${l.id_libro}/baja`)}>
                        Dar de baja
                      </Boton>
                    ) : (
                      <Boton variante="secundario" chico icono={RotateCcw} onClick={() => navegar(`/libros/${l.id_libro}/baja?modo=estatus`)}>
                        Activar
                      </Boton>
                    )}
                  </td>
                </tr>
              );
            })}
            {!c.cargando && c.libros.length === 0 && (
              <tr>
                <td colSpan={5} className="tabla__vacia">
                  <strong style={{ display: 'block', color: 'var(--texto-principal)' }}>No se encontraron libros</strong>
                  No hay libros registrados que coincidan con «{c.q}».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Tarjeta>
      {c.totalPaginas > 1 && (
        <div className="fila fin mt-16">
          <Paginacion pagina={c.pagina} totalPaginas={c.totalPaginas} onCambio={c.irAPagina} />
        </div>
      )}
    </Pagina>
  );
}
