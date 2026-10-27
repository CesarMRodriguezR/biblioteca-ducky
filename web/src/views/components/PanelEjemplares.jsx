import { useEffect, useState } from 'react';
import { formatoFecha, ubicacionTexto } from '../../models/dominio';
import {
  AlertaError, Boton, InsigniaCopia, Portada, Selector, Tarjeta,
} from './ui';

const opciones = (valores, actual) => {
  const lista = actual && !valores.includes(actual) ? [actual, ...valores] : valores;
  return lista.map((v) => ({ valor: v, etiqueta: v }));
};
const PASILLOS = ['1', '2', '3', '4', '5', '6'];
const ESTANTES = ['A', 'B', 'C', 'D', 'E', 'F'];
const NIVELES = ['1', '2', '3', '4'];

/** "Ejemplares de la ficha": agrega copias con su ubicación y lista las registradas. */
export function PanelEjemplares({ libro, onAgregar, agregando, error }) {
  const [form, setForm] = useState({ cantidad: '1', Pasillo: '4', Estante: 'B', Nivel: '2' });
  const [errorCantidad, setErrorCantidad] = useState(null);

  useEffect(() => {
    if (libro?.Pasillo) {
      setForm((f) => ({ ...f, Pasillo: libro.Pasillo, Estante: libro.Estante ?? f.Estante, Nivel: libro.Nivel ?? f.Nivel }));
    }
  }, [libro?.id_libro, libro?.Pasillo, libro?.Estante, libro?.Nivel]);

  if (!libro) {
    return (
      <Tarjeta style={{ textAlign: 'center', padding: 32 }}>
        <p className="texto-secundario">Guarda la ficha bibliográfica para poder agregar ejemplares.</p>
      </Tarjeta>
    );
  }

  const cantidad = Number(form.cantidad);
  const cambiar = (campo) => (e) => { setForm((f) => ({ ...f, [campo]: e.target.value })); setErrorCantidad(null); };
  const activos = (libro.ejemplares ?? []).filter((e) => e.Estatus !== 'Baja');

  async function agregar() {
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setErrorCantidad('Debe ser 1 o más.');
      return;
    }
    await onAgregar({ ...form, cantidad }).catch(() => {});
  }

  return (
    <div className="pila espacio-16">
      <Tarjeta>
        <div className="fila espacio-16" style={{ alignItems: 'flex-start' }}>
          <Portada libro={libro} ancho={66} alto={96} />
          <div>
            <h3>{libro.Titulo}</h3>
            <p className="texto-secundario" style={{ fontSize: 14 }}>{libro.Autor} · {libro.Nombre_Editorial} · {libro.Anio}</p>
            <p className="caption">ISBN {libro.ISBN} · {activos.length} {activos.length === 1 ? 'copia' : 'copias'}</p>
          </div>
        </div>
        <hr style={{ border: 0, borderTop: '1px solid var(--linea-divisoria)', margin: '20px 0 16px' }} />
        <strong style={{ fontSize: 14 }}>Agregar ejemplares</strong>
        <div className="grid-4 mt-8" style={{ gridTemplateColumns: '0.8fr 1fr 1fr 1fr', gap: 10 }}>
          <div className={`campo ${errorCantidad ? 'campo--error' : ''}`}>
            <label className="campo__etiqueta" htmlFor="cantidad" style={{ fontSize: 14 }}>Cantidad</label>
            <input id="cantidad" className="input" inputMode="numeric" value={form.cantidad} onChange={cambiar('cantidad')} />
          </div>
          <Selector etiqueta="Pasillo" value={form.Pasillo} onChange={cambiar('Pasillo')} opciones={opciones(PASILLOS, form.Pasillo)} />
          <Selector etiqueta="Estante" value={form.Estante} onChange={cambiar('Estante')} opciones={opciones(ESTANTES, form.Estante)} />
          <Selector etiqueta="Nivel" value={form.Nivel} onChange={cambiar('Nivel')} opciones={opciones(NIVELES, form.Nivel)} />
        </div>
        {errorCantidad && <p className="campo__error mt-8">{errorCantidad}</p>}
        <p className="caption mt-8">Pasillo, estante y nivel: por defecto se usan los de las demás copias del libro.</p>
        <Boton className="mt-16" style={{ width: '100%' }} onClick={agregar} disabled={agregando || libro.Estatus !== 'Activo'}>
          {agregando ? 'Agregando…' : `Agregar ${Number.isInteger(cantidad) && cantidad > 0 ? cantidad : ''} ${cantidad === 1 ? 'ejemplar' : 'ejemplares'}`}
        </Boton>
        <div className="mt-8"><AlertaError error={error} /></div>
      </Tarjeta>

      {activos.length === 0 ? (
        <Tarjeta style={{ textAlign: 'center', padding: 28 }}>
          <p className="texto-secundario">Esta ficha aún no tiene ejemplares.</p>
        </Tarjeta>
      ) : (
        <Tarjeta relleno={false} className="tabla-envoltura">
          <div style={{ padding: '14px 16px', fontWeight: 700 }}>Ejemplares registrados</div>
          <table className="tabla">
            <thead><tr><th>Código</th><th>Ubicación</th><th>Alta</th><th>Estado</th></tr></thead>
            <tbody>
              {activos.map((e) => (
                <tr key={e.num_copia}>
                  <td className="codigo-copia">{e.Codigo}</td>
                  <td className="caption">{ubicacionTexto(e)}</td>
                  <td className="caption">{formatoFecha(e.Fecha_Alta)}</td>
                  <td><InsigniaCopia estatus={e.Estatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </div>
  );
}
