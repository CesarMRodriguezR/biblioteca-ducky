import { useBajaLibroController } from '../../../controllers/LibrosController';
import { MOTIVOS_BAJA, disponibilidadTexto, ubicacionTexto } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import {
  Alerta, AlertaError, Boton, Cargando, EnlaceVolver, Insignia, InsigniaCopia, Portada, Radio, Tarjeta,
} from '../../components/ui';

function Opcion({ activa, titulo, texto, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className="card"
      style={{
        padding: '14px 16px', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
        borderColor: activa ? 'var(--azul-principal)' : 'var(--linea-divisoria)',
        borderWidth: activa ? 2 : 1,
        background: activa ? 'var(--informacion-fondo)' : 'var(--blanco)',
        boxShadow: 'none',
      }}
    >
      <strong style={{ fontSize: 14.5 }}>{titulo}</strong>
      <p className="caption">{texto}</p>
    </button>
  );
}

/** BD-SP02-GL03 Baja de libro: retiro de una copia y activar/inactivar el libro. */
export function BajaLibroPage() {
  const c = useBajaLibroController();
  const libro = c.libro;
  const activo = libro?.Estatus === 'Activo';
  const copias = libro?.ejemplares?.filter((e) => e.Estatus !== 'Baja') ?? [];
  const modoCopia = c.modo === 'copia';

  return (
    <Pagina miga="Libros · Dar de baja" titulo="Baja de libro">
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      {c.cargando && <Cargando />}
      <AlertaError error={c.errorCarga} />

      {libro && (
        <div className="columnas" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          <div>
            <Tarjeta className="fila espacio-16" style={{ alignItems: 'flex-start' }}>
              <Portada libro={libro} ancho={66} alto={96} />
              <div>
                <h3>{libro.Titulo}</h3>
                <p className="texto-secundario" style={{ fontSize: 14 }}>{libro.Autor} · {libro.Nombre_Editorial} · {libro.Anio}</p>
                <p className="caption">ISBN {libro.ISBN}</p>
                <div className="fila espacio-8 mt-8">
                  <Insignia tono={libro.Ejemplares_Disponibles ? 'exito' : 'advertencia'}>{disponibilidadTexto(libro)}</Insignia>
                  {!activo && <Insignia tono="neutro">Inactivo</Insignia>}
                </div>
              </div>
            </Tarjeta>

            <div className="grid-2 mt-16" style={{ gap: 12 }}>
              <Opcion activa={modoCopia} titulo="Retirar una copia" texto="Inactiva un ejemplar específico." onClick={() => c.setModo('copia')} />
              <Opcion activa={!modoCopia} titulo="Activar o inactivar libro" texto="Retira o reactiva el libro completo." onClick={() => c.setModo('estatus')} />
            </div>

            <Tarjeta relleno={false} className="tabla-envoltura mt-16">
              <table className={`tabla ${modoCopia ? 'tabla--seleccionable' : ''}`}>
                <thead>
                  <tr>{modoCopia && <th>Elegir</th>}<th>Copia</th><th>Ubicación</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {copias.map((e) => {
                    const prestada = ['En prestamo', 'Apartado'].includes(e.Estatus);
                    return (
                      <tr
                        key={e.num_copia}
                        className={prestada ? 'fila--deshabilitada' : ''}
                        onClick={() => modoCopia && !prestada && activo && c.elegirCopia(e.num_copia)}
                      >
                        {modoCopia && <td><Radio marcado={c.copiaElegida === e.num_copia} deshabilitado={prestada || !activo} /></td>}
                        <td className="codigo-copia">{e.Codigo}</td>
                        <td>{ubicacionTexto(e)}</td>
                        <td><InsigniaCopia estatus={e.Estatus} /></td>
                      </tr>
                    );
                  })}
                  {!copias.length && <tr><td colSpan={4} className="tabla__vacia">El libro no tiene copias activas.</td></tr>}
                </tbody>
              </table>
            </Tarjeta>
            <p className="caption mt-8">Las copias en préstamo no se pueden retirar hasta que se devuelvan.</p>
          </div>

          <Tarjeta>
            {modoCopia ? (
              <>
                <h2 className="mb-16">Motivo de la baja</h2>
                {c.aviso && <div className="mb-16"><Alerta tipo={c.aviso.tipo} titulo={c.aviso.titulo}>{c.aviso.texto}</Alerta></div>}
                {!activo && <div className="mb-16"><Alerta tipo="advertencia" titulo="El libro está inactivo; reactívalo para retirar copias." /></div>}
                <div className="card" style={{ boxShadow: 'none' }} role="radiogroup" aria-label="Motivo de la baja">
                  {MOTIVOS_BAJA.map((m, i) => (
                    <button
                      key={m.valor}
                      type="button"
                      role="radio"
                      aria-checked={c.motivo === m.valor}
                      className="fila espacio-12"
                      disabled={!activo}
                      onClick={() => c.setMotivo(m.valor)}
                      style={{
                        width: '100%', padding: '12px 16px', background: 'none', border: 0, textAlign: 'left',
                        borderTop: i ? '1px solid var(--linea-divisoria)' : 0, cursor: 'pointer', font: 'inherit',
                      }}
                    >
                      <Radio marcado={c.motivo === m.valor} />
                      <span>
                        <strong style={{ display: 'block', fontSize: 14.5 }}>{m.etiqueta}</strong>
                        <span className="caption">{m.descripcion}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="fila fin espacio-12 mt-24">
                  <Boton variante="texto" onClick={c.cancelar}>Cancelar</Boton>
                  <Boton variante="peligro" onClick={c.retirarCopia} disabled={!activo || c.enviando}>
                    {c.enviando ? 'Retirando…' : 'Retirar copia'}
                  </Boton>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-16">{activo ? 'Inactivar libro' : 'Activar libro'}</h2>
                {c.aviso && <div className="mb-16"><Alerta tipo={c.aviso.tipo} titulo={c.aviso.titulo}>{c.aviso.texto}</Alerta></div>}
                <p className="texto-secundario" style={{ fontSize: 14.5 }}>
                  {activo ? (
                    <>
                      El sistema revisa que ninguna copia esté en préstamo. Si todas están libres, inactiva el libro junto
                      con sus copias y su ficha bibliográfica por <strong>obsolescencia</strong>, y deja de aparecer en el
                      catálogo y en las búsquedas.
                    </>
                  ) : (
                    'El libro volverá a aparecer en el catálogo y en las búsquedas, y se podrá editar de nuevo.'
                  )}
                </p>
                <div className="fila fin espacio-12 mt-24">
                  <Boton variante="texto" onClick={c.cancelar}>Cancelar</Boton>
                  <Boton variante={activo ? 'peligro' : 'primario'} onClick={c.cambiarEstatusLibro} disabled={c.enviando}>
                    {activo ? 'Inactivar libro' : 'Activar libro'}
                  </Boton>
                </div>
              </>
            )}
          </Tarjeta>
        </div>
      )}
    </Pagina>
  );
}
