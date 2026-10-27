import { useState } from 'react';
import { Check, PenLine, Plus, Trash2, X } from 'lucide-react';
import { useSolicitudCompraController } from '../../../controllers/LibrosController';
import { ESTADOS_SOLICITUD } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import { FormularioFicha } from '../../components/FormularioFicha';
import {
  Alerta, Boton, BotonIcono, EnlaceVolver, Entrada, Insignia, Tarjeta,
} from '../../components/ui';

function TablaEditoriales({ editoriales, onGuardar, onEliminar }) {
  const [editando, setEditando] = useState(null); // id o 'nueva'
  const [form, setForm] = useState({ Nombre_Editorial: '', Pais: '' });
  const [error, setError] = useState(null);

  const iniciar = (e) => {
    setEditando(e ? e.id_editorial : 'nueva');
    setForm(e ? { Nombre_Editorial: e.Nombre_Editorial, Pais: e.Pais } : { Nombre_Editorial: '', Pais: '' });
    setError(null);
  };
  const guardar = async () => {
    try {
      await onGuardar(editando === 'nueva' ? null : editando, form);
      setEditando(null);
    } catch (e) {
      setError(e.message);
    }
  };
  const eliminar = async (id) => {
    try { await onEliminar(id); setError(null); } catch (e) { setError(e.message); }
  };

  const filaEdicion = (
    <tr>
      <td><input className="input" aria-label="Nombre" value={form.Nombre_Editorial} onChange={(e) => setForm({ ...form, Nombre_Editorial: e.target.value })} /></td>
      <td><input className="input" aria-label="País" value={form.Pais} onChange={(e) => setForm({ ...form, Pais: e.target.value })} /></td>
      <td>
        <div className="fila espacio-8">
          <BotonIcono icono={Check} etiqueta="Guardar editorial" onClick={guardar} />
          <BotonIcono icono={X} etiqueta="Cancelar" onClick={() => setEditando(null)} />
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <div className="fila entre mt-32 mb-16">
        <h2>Editoriales</h2>
        <Boton variante="secundario" chico icono={Plus} onClick={() => iniciar(null)}>Agregar</Boton>
      </div>
      {error && <div className="mb-16"><Alerta tipo="error" titulo={error} /></div>}
      <Tarjeta relleno={false} className="tabla-envoltura">
        <table className="tabla">
          <thead><tr><th>Nombre</th><th>País</th><th>Editar / Eliminar</th></tr></thead>
          <tbody>
            {editando === 'nueva' && filaEdicion}
            {editoriales.map((e) => (editando === e.id_editorial ? <tbody key={e.id_editorial} style={{ display: 'contents' }}>{filaEdicion}</tbody> : (
              <tr key={e.id_editorial}>
                <td style={{ fontWeight: 700 }}>{e.Nombre_Editorial}</td>
                <td>{e.Pais}</td>
                <td>
                  <div className="fila espacio-8">
                    <BotonIcono icono={PenLine} etiqueta={`Editar ${e.Nombre_Editorial}`} onClick={() => iniciar(e)} />
                    <BotonIcono icono={Trash2} etiqueta={`Eliminar ${e.Nombre_Editorial}`} peligro onClick={() => eliminar(e.id_editorial)} />
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </Tarjeta>
    </>
  );
}

/** BD-SP02-GL01 Solicitar libros (versión exitosa, fallida y "más copias"). */
export function SolicitarLibrosPage() {
  const c = useSolicitudCompraController();
  const copias = c.modoCopias;

  return (
    <Pagina miga={copias ? 'Libros · Solicitar copias' : 'Libros · Solicitar libros'} titulo={copias ? 'Solicitar más copias' : 'Solicitar libros'}>
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      <div className="columnas" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.9fr)' }}>
        <Tarjeta>
          <h2>{copias ? c.libro?.Titulo ?? 'Cargando…' : 'Nueva solicitud de compra'}</h2>
          <p className="texto-secundario mt-8 mb-16" style={{ fontSize: 14 }}>
            Registra los títulos de la lista de peticiones del periodo. Se envía a Tesorería para validar el presupuesto mensual.
          </p>
          {c.aviso && <div className="mb-16"><Alerta tipo={c.aviso.tipo} titulo={c.aviso.titulo}>{c.aviso.texto}</Alerta></div>}
          <form onSubmit={(e) => { e.preventDefault(); c.enviarSolicitud(); }} noValidate>
            <FormularioFicha
              ficha={c.form}
              errores={c.errores}
              cambiar={c.cambiar}
              editoriales={c.opcionesEditorial}
              ocultos={['Precio']}
              bloqueados={copias ? ['Titulo', 'Autor', 'ISBN', 'Anio', 'Tema', 'Sinopsis', 'id_editorial'] : []}
              ayudas={{ Anio: 'Año de 4 dígitos, p. ej. 2022' }}
              extras={{
                antes: (
                  <Entrada
                    etiqueta={copias ? 'Copias a solicitar' : 'Número de copias'}
                    value={c.form.Num_Ejemplares}
                    onChange={c.cambiar('Num_Ejemplares')}
                    error={c.errores.Num_Ejemplares}
                    ayuda={copias
                      ? `Número entero, 1 o más · Hoy hay ${c.libro?.Ejemplares_Totales ?? 0} copias registradas.`
                      : 'Número entero, 1 o más'}
                    inputMode="numeric"
                  />
                ),
              }}
            />
            <div className="fila entre mt-24">
              <span className="caption">{copias ? 'Solo se puede editar el número de copias.' : 'Todos los campos son obligatorios.'}</span>
              <div className="fila espacio-12">
                <Boton variante="texto" onClick={c.cancelar}>Cancelar</Boton>
                <Boton type="submit" disabled={c.enviando}>{c.enviando ? 'Enviando…' : 'Enviar solicitud'}</Boton>
              </div>
            </div>
          </form>
        </Tarjeta>

        <div>
          <h2 className="mb-16">Solicitudes pendientes</h2>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead><tr><th>Título</th><th>Editorial</th><th>Cant.</th><th>Estado</th></tr></thead>
              <tbody>
                {c.solicitudes.map((s) => (
                  <tr key={`${s.id_orden}-${s.Tipo}-${s.id_referencia}`}>
                    <td style={{ fontWeight: 700 }}>{s.Titulo}</td>
                    <td>{s.Editorial}</td>
                    <td>{s.Num_Ejemplares}</td>
                    <td><Insignia tono={ESTADOS_SOLICITUD[s.Estatus].tono}>{ESTADOS_SOLICITUD[s.Estatus].etiqueta}</Insignia></td>
                  </tr>
                ))}
                {!c.solicitudes.length && <tr><td colSpan={4} className="tabla__vacia">No hay solicitudes pendientes.</td></tr>}
              </tbody>
            </table>
          </Tarjeta>
          <TablaEditoriales editoriales={c.editoriales} onGuardar={c.guardarEditorial} onEliminar={c.eliminarEditorial} />
        </div>
      </div>
    </Pagina>
  );
}
