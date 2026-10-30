/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL02 · PaginaAltaLibro.jsx
 * Función: Alta de libro con validación de ISBN y alta de ejemplares.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Props y estado del controlador de la pantalla
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente        Objetivo
 *     PaginaAltaLibro   BD-SP02-GL02 Alta de libro (formulario, registro…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) Los estilos están en las clases de estilos-globales.css; style en línea solo para valores
 *     calculados.
 * ******************************************************************
 */

import { useControladorAltaLibro } from '../../../controladores/ControladorLibros.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { FormularioFicha } from '../../componentes/FormularioFicha.jsx';
import { PanelEjemplares } from '../../componentes/PanelEjemplares.jsx';
import { Alerta, Boton, EnlaceVolver, Tarjeta } from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaAltaLibro
 * Objetivo: BD-SP02-GL02 Alta de libro (formulario, registro exitoso/fallido, ISBN duplicado,
 *           cancelación).
 * Uso: <PaginaAltaLibro />
 */
export function PaginaAltaLibro()
{
  const controlador = useControladorAltaLibro();
  const registrada = controlador.aviso?.tipo === 'exito';

  return (
    <Pagina miga="Libros · Nueva ficha" titulo="Alta de libro">
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      <div className="columnas">
        <Tarjeta>
          <h2 className="margen-abajo-16">Datos del libro</h2>
          {controlador.aviso && (
            <div className="margen-abajo-16">
              <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
                {controlador.aviso.texto}
              </Alerta>
            </div>
          )}
          <form
            onSubmit={(evento) =>
            {
              evento.preventDefault();
              controlador.GuardarFicha();
            }}
            noValidate
          >
            <FormularioFicha
              ficha={controlador.ficha}
              errores={controlador.errores}
              cambiar={controlador.Cambiar}
              editoriales={controlador.editoriales}
              al_salir_isbn={controlador.ValidarIsbn}
              ayudas={{
                ISBN:
                  'Se valida primero: si el libro ya está registrado se muestra su ficha, y si ' +
                  'se pidió en una solicitud de compra se cargan sus datos.',
              }}
            />
            <div className="fila entre margen-arriba-24">
              <span className="texto-nota">Todos los campos son obligatorios.</span>
              <div className="fila espacio-12">
                {registrada ? (
                  <Boton variante="secundario" onClick={controlador.NuevaFicha}>
                    Agregar otro libro
                  </Boton>
                ) : (
                  <>
                    <Boton variante="texto" onClick={controlador.Cancelar}>
                      Cancelar
                    </Boton>
                    <Boton type="submit" disabled={controlador.enviando}>
                      {controlador.enviando ? 'Guardando…' : 'Guardar ficha'}
                    </Boton>
                  </>
                )}
              </div>
            </div>
          </form>
        </Tarjeta>

        <div>
          <h2 className="margen-abajo-16">
            {controlador.existente ? 'Ficha existente' : 'Ejemplares de la ficha'}
          </h2>
          <PanelEjemplares
            libro={controlador.libro}
            al_agregar={controlador.AgregarEjemplares}
            agregando={controlador.agregando}
            error={controlador.error_ejemplares}
          />
        </div>
      </div>
    </Pagina>
  );
}
