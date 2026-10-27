import { Download, Printer } from 'lucide-react';
import { useListadoController } from '../../../controllers/CatalogoController';
import { formatoFecha } from '../../../models/dominio';
import { AlertaError, Boton, Cargando, Modal } from '../../components/ui';

/** BD-SP02-GL06 Vista previa del listado con impresión y descarga en PDF. */
export function ListadoModal({ filtros, onCerrar }) {
  const c = useListadoController(filtros);
  const l = c.listado;

  return (
    <Modal
      titulo="Vista previa del listado"
      onCerrar={onCerrar}
      acciones={(
        <div className="fila espacio-8">
          <Boton variante="secundario" chico icono={Printer} onClick={c.imprimir} disabled={!l}>Imprimir</Boton>
          <Boton chico icono={Download} onClick={c.guardarPdf} disabled={!l || c.generandoPdf}>
            {c.generandoPdf ? 'Generando…' : 'Guardar como PDF'}
          </Boton>
        </div>
      )}
    >
      {c.cargando && <Cargando />}
      <AlertaError error={c.error} />
      {l && (
        <div className="imprimible">
          <h2>Listado de libros</h2>
          <p className="caption mt-8 mb-16">
            Generado por {l.generadoPor} · {formatoFecha(l.generadoEl)} · Filtro: {l.filtro} · {l.total} {l.total === 1 ? 'libro' : 'libros'}
          </p>
          <div className="tabla-envoltura">
            <table className="tabla tabla--compacta">
              <thead>
                <tr><th>#</th><th>Título</th><th>Autor</th><th>Editorial</th><th>ISBN</th><th>Año</th><th>Tema</th><th>Sinopsis</th><th>Copias</th></tr>
              </thead>
              <tbody>
                {l.datos.map((libro, i) => (
                  <tr key={libro.id_libro}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 700 }}>{libro.Titulo}</td>
                    <td>{libro.Autores}</td>
                    <td>{libro.Nombre_Editorial}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{libro.ISBN}</td>
                    <td>{libro.Anio}</td>
                    <td>{libro.Temas}</td>
                    <td className="caption" style={{ minWidth: 220 }}>{libro.Sinopsis}</td>
                    <td>{libro.Ejemplares_Totales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption mt-16">Biblioteca Universidad Ducky</p>
        </div>
      )}
    </Modal>
  );
}
