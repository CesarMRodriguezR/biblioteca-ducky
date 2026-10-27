import { useEditarLibroController } from '../../../controllers/LibrosController';
import { ESTADOS_COPIA } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import { FormularioFicha } from '../../components/FormularioFicha';
import {
  Alerta, AlertaError, Boton, Cargando, EnlaceVolver, Entrada, Insignia, InsigniaCopia, Radio, Selector, Tarjeta,
} from '../../components/ui';

/** BD-SP02-GL04 Editar libro y estado de copias (todas sus variantes). */
export function EditarLibroPage() {
  const c = useEditarLibroController();
  const libro = c.libro;
  const copiaPrestada = c.copia && ['En prestamo', 'Apartado'].includes(c.copia.Estatus);
  const editorialAnterior = c.ficha && c.original && c.ficha.id_editorial !== c.original.id_editorial
    ? c.editoriales.find((e) => e.valor === c.original.id_editorial)?.etiqueta
    : null;
  const copias = libro?.ejemplares?.filter((e) => e.Estatus !== 'Baja') ?? [];

  return (
    <Pagina miga="Libros · Editar ficha" titulo="Editar libro">
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      {c.cargando && <Cargando />}
      <AlertaError error={c.errorCarga} />
      {c.inactivo && (
        <div className="mb-16">
          <Alerta tipo="error" titulo="Este libro está inactivo y no se puede editar.">
            Primero reactívalo desde Libros para poder modificarlo.
          </Alerta>
        </div>
      )}

      {libro && c.ficha && (
        <div className="columnas">
          <Tarjeta>
            <div className="fila entre mb-16">
              <h2>Ficha bibliográfica</h2>
              <Insignia tono={c.inactivo ? 'neutro' : 'exito'}>{libro.Estatus}</Insignia>
            </div>
            {c.aviso && <div className="mb-16"><Alerta tipo={c.aviso.tipo} titulo={c.aviso.titulo}>{c.aviso.texto}</Alerta></div>}
            <form onSubmit={(e) => { e.preventDefault(); c.guardarCambios(); }} noValidate>
              <fieldset disabled={c.inactivo} style={{ border: 0, padding: 0, margin: 0 }}>
                <FormularioFicha
                  ficha={c.ficha}
                  errores={c.errores}
                  cambiar={c.cambiar}
                  editoriales={c.editoriales}
                  ocultos={['Precio']}
                  bloqueados={['ISBN']}
                  onIsbnClick={c.intentarCambiarIsbn}
                  ayudas={{
                    ISBN: 'Bloqueado: el ISBN no se puede cambiar.',
                    id_editorial: editorialAnterior ? `Antes: ${editorialAnterior}` : undefined,
                    Anio: 'Solo el año, 4 dígitos (p. ej. 1991).',
                  }}
                  extras={{
                    tituloPrimero: true,
                    despuesDeTema: (
                      <Entrada
                        etiqueta="Número de copias"
                        value={c.ficha.Numero_Copias}
                        onChange={c.cambiar('Numero_Copias')}
                        error={c.errores.Numero_Copias}
                        ayuda="Para reducir copias usa «Dar de baja»."
                        inputMode="numeric"
                      />
                    ),
                  }}
                />
              </fieldset>
              <div className="fila entre mt-24">
                <span className="caption">
                  {c.modificados.length
                    ? `${c.modificados.length} ${c.modificados.length === 1 ? 'campo modificado' : 'campos modificados'}`
                    : 'Sin cambios pendientes'} · {libro.Ejemplares_Totales} copias
                </span>
                <div className="fila espacio-12">
                  <Boton variante="texto" onClick={c.descartar} disabled={c.inactivo || !c.modificados.length}>Descartar</Boton>
                  <Boton type="submit" disabled={c.inactivo || !c.modificados.length || c.enviando}>
                    {c.enviando ? 'Guardando…' : 'Guardar cambios'}
                  </Boton>
                </div>
              </div>
            </form>
          </Tarjeta>

          <div>
            <h2>Estado de copias</h2>
            <p className="caption mt-8 mb-16">
              Elige en la lista la copia que quieres modificar. El cambio de estado se aplica solo a esa copia.
            </p>
            <Tarjeta relleno={false} className="tabla-envoltura">
              <table className="tabla tabla--seleccionable">
                <thead><tr><th>Elegir</th><th>Copia</th><th>Estado</th></tr></thead>
                <tbody>
                  {copias.map((e) => {
                    const prestada = ['En prestamo', 'Apartado'].includes(e.Estatus);
                    return (
                      <tr
                        key={e.num_copia}
                        className={prestada ? 'fila--deshabilitada' : ''}
                        onClick={() => !c.inactivo && c.elegirCopia(e.num_copia)}
                        aria-selected={c.copiaElegida === e.num_copia}
                      >
                        <td><Radio marcado={c.copiaElegida === e.num_copia} deshabilitado={prestada} /></td>
                        <td className="codigo-copia">{e.Codigo}</td>
                        <td><InsigniaCopia estatus={e.Estatus} /></td>
                      </tr>
                    );
                  })}
                  {!copias.length && <tr><td colSpan={3} className="tabla__vacia">El libro no tiene copias activas.</td></tr>}
                </tbody>
              </table>
            </Tarjeta>

            {c.copia && (
              <Tarjeta className="mt-16">
                <Selector
                  etiqueta={`Nuevo estado para ${c.copia.Codigo}`}
                  value={c.nuevoEstado}
                  onChange={(e) => c.setNuevoEstado(e.target.value)}
                  disabled={c.inactivo || copiaPrestada}
                  opciones={[
                    { valor: 'Disponible', etiqueta: 'Disponible' },
                    { valor: 'Consulta externa', etiqueta: 'Consulta externa' },
                  ]}
                  error={copiaPrestada ? 'Copia en préstamo: debe devolverse antes de reasignar su estado.' : null}
                  ayuda={ESTADOS_COPIA[c.nuevoEstado]?.descripcion.replace(/^./, (l) => l.toUpperCase()).concat('.')}
                />
                <p className="caption mt-16">
                  «En préstamo» lo asigna el sistema al registrar un préstamo y lo quita al devolver la copia.
                  Para inactivar una copia usa <strong>Dar de baja</strong> con un motivo.
                </p>
                {c.avisoCopia && <div className="mt-16"><Alerta tipo={c.avisoCopia.tipo} titulo={c.avisoCopia.titulo} /></div>}
                <div className="fila fin mt-16">
                  <Boton
                    onClick={c.guardarEstadoCopia}
                    disabled={c.inactivo || copiaPrestada || c.guardandoCopia || c.nuevoEstado === c.copia.Estatus}
                  >
                    {c.guardandoCopia ? 'Guardando…' : 'Guardar estado'}
                  </Boton>
                </div>
              </Tarjeta>
            )}
          </div>
        </div>
      )}
    </Pagina>
  );
}
