import { useRef, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Boton, Tarjeta } from './ui';

/** Zona para soltar o elegir la lista de Servicios Escolares (.xlsx, .xls, .csv). */
export function SelectorArchivo({ titulo, descripcion, onArchivo, procesando }) {
  const entrada = useRef(null);
  const [encima, setEncima] = useState(false);

  return (
    <Tarjeta
      style={{
        borderStyle: 'dashed', borderWidth: 2, textAlign: 'center', padding: 40,
        borderColor: encima ? 'var(--azul-brillante)' : 'var(--linea-divisoria)',
      }}
      onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => { e.preventDefault(); setEncima(false); onArchivo(e.dataTransfer.files[0]); }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: 'var(--informacion-fondo)', color: 'var(--azul-principal)',
        display: 'grid', placeItems: 'center', margin: '0 auto 12px',
      }}
      >
        <FileSpreadsheet size={24} aria-hidden />
      </div>
      <h3>{titulo}</h3>
      <p className="caption mt-8">{descripcion}</p>
      <input
        ref={entrada}
        type="file"
        accept=".xlsx,.xls,.csv"
        hidden
        onChange={(e) => { onArchivo(e.target.files[0]); e.target.value = ''; }}
      />
      <Boton className="mt-16" onClick={() => entrada.current.click()} disabled={procesando}>
        {procesando ? 'Revisando lista…' : 'Elegir archivo'}
      </Boton>
    </Tarjeta>
  );
}
