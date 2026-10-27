/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL04 · PaginaEditarLibro.jsx
 * Función: Edición de la ficha bibliográfica y del estado de cada copia.
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
 *     Componente          Objetivo
 *     PaginaEditarLibro   BD-SP02-GL04 Editar libro y estado de copias (todas sus…
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

import { useControladorEditarLibro } from '../../../controladores/ControladorLibros.js';
import { ESTADOS_COPIA } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { FormularioFicha } from '../../componentes/FormularioFicha.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  EnlaceVolver,
  Entrada,
  Insignia,
  InsigniaCopia,
  Radio,
  Selector,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaEditarLibro
 * Objetivo: BD-SP02-GL04 Editar libro y estado de copias (todas sus variantes).
 * Uso: <PaginaEditarLibro />
 */
export function PaginaEditarLibro()
{
  const controlador = useControladorEditarLibro();
  const libro = controlador.libro;
  const copia_prestada =
    controlador.copia && ['En prestamo', 'Apartado'].includes(controlador.copia.Estatus);
  const editorial_anterior =
    controlador.ficha &&
    controlador.original &&
    controlador.ficha.id_editorial !== controlador.original.id_editorial
      ? controlador.editoriales.find(
        (editorial) => editorial.valor === controlador.original.id_editorial,
      )?.etiqueta
      : null;
  const copias = libro?.ejemplares?.filter((evento) => evento.Estatus !== 'Baja') ?? [];

  return (
    <Pagina miga="Libros · Editar ficha" titulo="Editar libro">
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      {controlador.cargando && <Cargando />}
      <AlertaError error={controlador.error_carga} />
      {controlador.inactivo && (
        <div className="margen-abajo-16">
          <Alerta tipo="error" titulo="Este libro está inactivo y no se puede editar.">
            Primero reactívalo desde Libros para poder modificarlo.
          </Alerta>
        </div>
      )}

      {libro && controlador.ficha && (
        <div className="columnas">
          <Tarjeta>
            <div className="fila entre margen-abajo-16">
              <h2>Ficha bibliográfica</h2>
              <Insignia tono={controlador.inactivo ? 'neutro' : 'exito'}>{libro.Estatus}</Insignia>
            </div>
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
                controlador.GuardarCambios();
              }}
              noValidate
            >
              <fieldset
                disabled={controlador.inactivo}
                style={{ border: 0, padding: 0, margin: 0 }}
              >
                <FormularioFicha
                  ficha={controlador.ficha}
                  errores={controlador.errores}
                  cambiar={controlador.Cambiar}
                  editoriales={controlador.editoriales}
                  ocultos={['Precio']}
                  bloqueados={['ISBN']}
                  al_tocar_isbn={controlador.IntentarCambiarIsbn}
                  ayudas={{
                    ISBN: 'Bloqueado: el ISBN no se puede cambiar.',
                    id_editorial: editorial_anterior ? `Antes: ${editorial_anterior}` : undefined,
                    Anio: 'Solo el año, 4 dígitos (p. ej. 1991).',
                  }}
                  extras={{
                    titulo_primero: true,
                    despues_de_tema: (
                      <Entrada
                        etiqueta="Número de copias"
                        value={controlador.ficha.Numero_Copias}
                        onChange={controlador.Cambiar('Numero_Copias')}
                        error={controlador.errores.Numero_Copias}
                        ayuda="Para reducir copias usa «Dar de baja»."
                        inputMode="numeric"
                      />
                    ),
                  }}
                />
              </fieldset>
              <div className="fila entre margen-arriba-24">
                <span className="texto-nota">
                  {controlador.modificados.length
                    ? `${controlador.modificados.length} ${controlador.modificados.length === 1 ? 'campo modificado' : 'campos modificados'}`
                    : 'Sin cambios pendientes'}{' '}
                  · {libro.Ejemplares_Totales} copias
                </span>
                <div className="fila espacio-12">
                  <Boton
                    variante="texto"
                    onClick={controlador.Descartar}
                    disabled={controlador.inactivo || !controlador.modificados.length}
                  >
                    Descartar
                  </Boton>
                  <Boton
                    type="submit"
                    disabled={
                      controlador.inactivo ||
                      !controlador.modificados.length ||
                      controlador.enviando
                    }
                  >
                    {controlador.enviando ? 'Guardando…' : 'Guardar cambios'}
                  </Boton>
                </div>
              </div>
            </form>
          </Tarjeta>

          <div>
            <h2>Estado de copias</h2>
            <p className="texto-nota margen-arriba-8 margen-abajo-16">
              Elige en la lista la copia que quieres modificar. El cambio de estado se aplica solo a
              esa copia.
            </p>
            <Tarjeta relleno={false} className="tabla-envoltura">
              <table className="tabla tabla-seleccionable">
                <thead>
                  <tr>
                    <th>Elegir</th>
                    <th>Copia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {copias.map((copia) =>
                  {
                    const prestada = ['En prestamo', 'Apartado'].includes(copia.Estatus);
                    return (
                      <tr
                        key={copia.num_copia}
                        className={prestada ? 'fila-deshabilitada' : ''}
                        onClick={() =>
                          !controlador.inactivo && controlador.ElegirCopia(copia.num_copia)
                        }
                        aria-selected={controlador.copia_elegida === copia.num_copia}
                      >
                        <td>
                          <Radio
                            marcado={controlador.copia_elegida === copia.num_copia}
                            deshabilitado={prestada}
                          />
                        </td>
                        <td className="codigo-copia">{copia.Codigo}</td>
                        <td>
                          <InsigniaCopia estatus={copia.Estatus} />
                        </td>
                      </tr>
                    );
                  })}
                  {!copias.length && (
                    <tr>
                      <td colSpan={3} className="tabla-vacia">
                        El libro no tiene copias activas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Tarjeta>

            {controlador.copia && (
              <Tarjeta className="margen-arriba-16">
                <Selector
                  etiqueta={`Nuevo estado para ${controlador.copia.Codigo}`}
                  value={controlador.nuevo_estado}
                  onChange={(evento) => controlador.SetNuevoEstado(evento.target.value)}
                  disabled={controlador.inactivo || copia_prestada}
                  opciones={[
                    { valor: 'Disponible', etiqueta: 'Disponible' },
                    { valor: 'Consulta externa', etiqueta: 'Consulta externa' },
                  ]}
                  error={
                    copia_prestada
                      ? 'Copia en préstamo: debe devolverse antes de reasignar su estado.'
                      : null
                  }
                  ayuda={ESTADOS_COPIA[controlador.nuevo_estado]?.descripcion
                    .replace(/^./, (libro_actual) => libro_actual.toUpperCase())
                    .concat('.')}
                />
                <p className="texto-nota margen-arriba-16">
                  «En préstamo» lo asigna el sistema al registrar un préstamo y lo quita al devolver
                  la copia. Para inactivar una copia usa <strong>Dar de baja</strong> con un motivo.
                </p>
                {controlador.aviso_copia && (
                  <div className="margen-arriba-16">
                    <Alerta
                      tipo={controlador.aviso_copia.tipo}
                      titulo={controlador.aviso_copia.titulo}
                    />
                  </div>
                )}
                <div className="fila fin margen-arriba-16">
                  <Boton
                    onClick={controlador.GuardarEstadoCopia}
                    disabled={
                      controlador.inactivo ||
                      copia_prestada ||
                      controlador.guardando_copia ||
                      controlador.nuevo_estado === controlador.copia.Estatus
                    }
                  >
                    {controlador.guardando_copia ? 'Guardando…' : 'Guardar estado'}
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
