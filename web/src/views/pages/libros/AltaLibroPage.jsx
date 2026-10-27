import { useAltaLibroController } from '../../../controllers/LibrosController';
import { Pagina } from '../../layouts/AppLayout';
import { FormularioFicha } from '../../components/FormularioFicha';
import { PanelEjemplares } from '../../components/PanelEjemplares';
import { Alerta, Boton, EnlaceVolver, Tarjeta } from '../../components/ui';

/** BD-SP02-GL02 Alta de libro (formulario, registro exitoso/fallido, ISBN duplicado, cancelación). */
export function AltaLibroPage() {
  const c = useAltaLibroController();
  const registrada = c.aviso?.tipo === 'exito';

  return (
    <Pagina miga="Libros · Nueva ficha" titulo="Alta de libro">
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      <div className="columnas">
        <Tarjeta>
          <h2 className="mb-16">Datos del libro</h2>
          {c.aviso && <div className="mb-16"><Alerta tipo={c.aviso.tipo} titulo={c.aviso.titulo}>{c.aviso.texto}</Alerta></div>}
          <form onSubmit={(e) => { e.preventDefault(); c.guardarFicha(); }} noValidate>
            <FormularioFicha
              ficha={c.ficha}
              errores={c.errores}
              cambiar={c.cambiar}
              editoriales={c.editoriales}
              onIsbnBlur={c.validarIsbn}
              ayudas={{ ISBN: 'Se valida primero. Prueba 978-0-262-03384-8 para ver un libro ya registrado.' }}
            />
            <div className="fila entre mt-24">
              <span className="caption">Todos los campos son obligatorios.</span>
              <div className="fila espacio-12">
                {registrada ? (
                  <Boton variante="secundario" onClick={c.nuevaFicha}>Agregar otro libro</Boton>
                ) : (
                  <>
                    <Boton variante="texto" onClick={c.cancelar}>Cancelar</Boton>
                    <Boton type="submit" disabled={c.enviando}>{c.enviando ? 'Guardando…' : 'Guardar ficha'}</Boton>
                  </>
                )}
              </div>
            </div>
          </form>
        </Tarjeta>

        <div>
          <h2 className="mb-16">{c.existente ? 'Ficha existente' : 'Ejemplares de la ficha'}</h2>
          <PanelEjemplares
            libro={c.libro}
            onAgregar={c.agregarEjemplares}
            agregando={c.agregando}
            error={c.errorEjemplares}
          />
        </div>
      </div>
    </Pagina>
  );
}
