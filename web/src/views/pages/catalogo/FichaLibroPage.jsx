import { PenLine } from 'lucide-react';
import { useFichaController } from '../../../controllers/CatalogoController';
import { ESTADOS_COPIA, ubicacionTexto } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import {
  Alerta, AlertaError, Boton, Cargando, DatoEtiquetado, EnlaceVolver, Insignia, InsigniaCopia, Portada, Tarjeta,
} from '../../components/ui';

function ResumenCopias({ resumen }) {
  return (
    <Tarjeta relleno={false}>
      {['Disponible', 'Consulta externa', 'En prestamo'].map((estado, i) => (
        <div
          key={estado}
          className="fila entre"
          style={{ padding: '14px 18px', borderTop: i ? '1px solid var(--linea-divisoria)' : 0 }}
        >
          <div>
            <InsigniaCopia estatus={estado} />
            <p className="caption mt-8">{ESTADOS_COPIA[estado].descripcion}.</p>
          </div>
          <strong style={{ fontSize: 20 }}>{resumen[estado]}</strong>
        </div>
      ))}
    </Tarjeta>
  );
}

/** BD-SP02-GL05 Consultar ficha bibliográfica (vista completa o resumida según el rol). */
export function FichaLibroPage() {
  const c = useFichaController();
  const libro = c.libro;
  const activos = libro?.ejemplares?.filter((e) => e.Estatus !== 'Baja') ?? [];
  const sinDisponibles = libro && !libro.Ejemplares_Disponibles;

  return (
    <Pagina miga="Catálogo · Ficha" titulo="Ficha bibliográfica">
      <EnlaceVolver to="/catalogo">Regresar al catálogo</EnlaceVolver>
      {c.cargando && <Cargando />}
      {c.noEncontrado ? (
        <Tarjeta style={{ textAlign: 'center', padding: 40 }}>
          <h3>No hay ningún libro registrado con esos datos.</h3>
        </Tarjeta>
      ) : <AlertaError error={c.error} />}

      {libro && (
        <div className="columnas" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}>
          <Tarjeta>
            <div className="fila espacio-24" style={{ alignItems: 'flex-start' }}>
              <Portada libro={libro} ancho={120} alto={170} />
              <div className="crece">
                <div className="fila entre" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <h2>{libro.Titulo}</h2>
                  {c.gestiona && libro.Estatus !== 'Activo' && <Insignia tono="neutro">Inactivo</Insignia>}
                </div>
                <p className="texto-secundario mt-8">{libro.Autor}</p>
                <p className="caption">{libro.Nombre_Editorial} · {libro.Pais}</p>
                <div className="grid-4 mt-16" style={{ gap: 16 }}>
                  <DatoEtiquetado etiqueta="ISBN" valor={libro.ISBN} />
                  <DatoEtiquetado etiqueta="Año" valor={libro.Anio} />
                  <DatoEtiquetado etiqueta="Tema" valor={libro.Tema} />
                  <DatoEtiquetado etiqueta="Número de copias" valor={libro.Ejemplares_Totales} />
                </div>
              </div>
            </div>
            <h3 className="mt-24">Sinopsis</h3>
            <p className="mt-8" style={{ lineHeight: 1.6 }}>{libro.Sinopsis || 'Sin sinopsis registrada.'}</p>
            <h3 className="mt-24">Ubicación</h3>
            <div className="grid-4 mt-8" style={{ gap: 16 }}>
              <DatoEtiquetado etiqueta="Pasillo" valor={libro.Pasillo} />
              <DatoEtiquetado etiqueta="Estante" valor={libro.Estante} />
              <DatoEtiquetado etiqueta="Nivel" valor={libro.Nivel} />
              <DatoEtiquetado etiqueta="Sección" valor={libro.Seccion} />
            </div>
            {c.gestiona && (
              <div className="fila fin mt-24">
                <Boton variante="secundario" icono={PenLine} onClick={c.editar}>Editar ficha</Boton>
              </div>
            )}
          </Tarjeta>

          <div>
            <h2 className="mb-16">Copias</h2>
            {c.gestiona ? (
              <Tarjeta relleno={false} className="tabla-envoltura">
                <table className="tabla">
                  <thead><tr><th>Copia</th><th>Ubicación</th><th>Estado</th></tr></thead>
                  <tbody>
                    {activos.map((e) => (
                      <tr key={e.num_copia}>
                        <td className="codigo-copia">{e.Codigo}</td>
                        <td className="caption">{ubicacionTexto(e)}</td>
                        <td><InsigniaCopia estatus={e.Estatus} /></td>
                      </tr>
                    ))}
                    {!activos.length && <tr><td colSpan={3} className="tabla__vacia">Sin copias activas.</td></tr>}
                  </tbody>
                </table>
              </Tarjeta>
            ) : (
              <>
                {sinDisponibles && (
                  <div className="mb-16">
                    <Alerta tipo="advertencia" titulo="No hay copias disponibles por ahora">
                      Puedes unirte a la lista de espera desde el mostrador de préstamos.
                    </Alerta>
                  </div>
                )}
                <ResumenCopias resumen={libro.resumenCopias} />
              </>
            )}
          </div>
        </div>
      )}
    </Pagina>
  );
}
