/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL03 · PaginaBajaLibro.jsx
 * Función: Retiro de una copia con motivo, o activación e inactivación del libro.
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
 *     Opcion            Pestaña para elegir entre retirar una copia o cambiar el…
 *     PaginaBajaLibro   BD-SP02-GL03 Baja de libro: retiro de una copia y…
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

import { useControladorBajaLibro } from '../../../controladores/ControladorLibros.js';
import { MOTIVOS_BAJA, DisponibilidadTexto, UbicacionTexto } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  EnlaceVolver,
  Insignia,
  InsigniaCopia,
  Portada,
  Radio,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: Opcion
 * Objetivo: Pestaña para elegir entre retirar una copia o cambiar el estatus del libro.
 * Uso: <Opcion activa={…} titulo={…} texto={…} onClick={…} />
 */
function Opcion({ activa, titulo, texto, onClick })
{
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className="tarjeta"
      style={{
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        borderColor: activa ? 'var(--azul-principal)' : 'var(--linea-divisoria)',
        borderWidth: activa ? 2 : 1,
        background: activa ? 'var(--informacion-fondo)' : 'var(--blanco)',
        boxShadow: 'none',
      }}
    >
      <strong style={{ fontSize: 14.5 }}>{titulo}</strong>
      <p className="texto-nota">{texto}</p>
    </button>
  );
}

/*
 * Componente: PaginaBajaLibro
 * Objetivo: BD-SP02-GL03 Baja de libro: retiro de una copia y activar/inactivar el libro.
 * Uso: <PaginaBajaLibro />
 */
export function PaginaBajaLibro()
{
  const controlador = useControladorBajaLibro();
  const libro = controlador.libro;
  const activo = libro?.Estatus === 'Activo';
  const copias = libro?.ejemplares?.filter((evento) => evento.Estatus !== 'Baja') ?? [];
  const modo_copia = controlador.modo === 'copia';

  return (
    <Pagina miga="Libros · Dar de baja" titulo="Baja de libro">
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      {controlador.cargando && <Cargando />}
      <AlertaError error={controlador.error_carga} />

      {libro && (
        <div className="columnas" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          <div>
            <Tarjeta className="fila espacio-16" style={{ alignItems: 'flex-start' }}>
              <Portada libro={libro} ancho={66} alto={96} />
              <div>
                <h3>{libro.Titulo}</h3>
                <p className="texto-secundario" style={{ fontSize: 14 }}>
                  {libro.Autor} · {libro.Nombre_Editorial} · {libro.Anio}
                </p>
                <p className="texto-nota">ISBN {libro.ISBN}</p>
                <div className="fila espacio-8 margen-arriba-8">
                  <Insignia tono={libro.Ejemplares_Disponibles ? 'exito' : 'advertencia'}>
                    {DisponibilidadTexto(libro)}
                  </Insignia>
                  {!activo && <Insignia tono="neutro">Inactivo</Insignia>}
                </div>
              </div>
            </Tarjeta>

            <div className="rejilla-2 margen-arriba-16" style={{ gap: 12 }}>
              <Opcion
                activa={modo_copia}
                titulo="Retirar una copia"
                texto="Inactiva un ejemplar específico."
                onClick={() => controlador.SetModo('copia')}
              />
              <Opcion
                activa={!modo_copia}
                titulo="Activar o inactivar libro"
                texto="Retira o reactiva el libro completo."
                onClick={() => controlador.SetModo('estatus')}
              />
            </div>

            <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
              <table className={`tabla ${modo_copia ? 'tabla-seleccionable' : ''}`}>
                <thead>
                  <tr>
                    {modo_copia && <th>Elegir</th>}
                    <th>Copia</th>
                    <th>Ubicación</th>
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
                          modo_copia &&
                          !prestada &&
                          activo &&
                          controlador.ElegirCopia(copia.num_copia)
                        }
                      >
                        {modo_copia && (
                          <td>
                            <Radio
                              marcado={controlador.copia_elegida === copia.num_copia}
                              deshabilitado={prestada || !activo}
                            />
                          </td>
                        )}
                        <td className="codigo-copia">{copia.Codigo}</td>
                        <td>{UbicacionTexto(copia)}</td>
                        <td>
                          <InsigniaCopia estatus={copia.Estatus} />
                        </td>
                      </tr>
                    );
                  })}
                  {!copias.length && (
                    <tr>
                      <td colSpan={4} className="tabla-vacia">
                        El libro no tiene copias activas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Tarjeta>
            <p className="texto-nota margen-arriba-8">
              Las copias en préstamo no se pueden retirar hasta que se devuelvan.
            </p>
          </div>

          <Tarjeta>
            {modo_copia ? (
              <>
                <h2 className="margen-abajo-16">Motivo de la baja</h2>
                {controlador.aviso && (
                  <div className="margen-abajo-16">
                    <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
                      {controlador.aviso.texto}
                    </Alerta>
                  </div>
                )}
                {!activo && (
                  <div className="margen-abajo-16">
                    <Alerta
                      tipo="advertencia"
                      titulo="El libro está inactivo; reactívalo para retirar copias."
                    />
                  </div>
                )}
                <div
                  className="tarjeta"
                  style={{ boxShadow: 'none' }}
                  role="radiogroup"
                  aria-label="Motivo de la baja"
                >
                  {MOTIVOS_BAJA.map((elemento, indice) => (
                    <button
                      key={elemento.valor}
                      type="button"
                      role="radio"
                      aria-checked={controlador.motivo === elemento.valor}
                      className="fila espacio-12"
                      disabled={!activo}
                      onClick={() => controlador.SetMotivo(elemento.valor)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 0,
                        textAlign: 'left',
                        borderTop: indice ? '1px solid var(--linea-divisoria)' : 0,
                        cursor: 'pointer',
                        font: 'inherit',
                      }}
                    >
                      <Radio marcado={controlador.motivo === elemento.valor} />
                      <span>
                        <strong style={{ display: 'block', fontSize: 14.5 }}>
                          {elemento.etiqueta}
                        </strong>
                        <span className="texto-nota">{elemento.descripcion}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="fila fin espacio-12 margen-arriba-24">
                  <Boton variante="texto" onClick={controlador.Cancelar}>
                    Cancelar
                  </Boton>
                  <Boton
                    variante="peligro"
                    onClick={controlador.RetirarCopia}
                    disabled={!activo || controlador.enviando}
                  >
                    {controlador.enviando ? 'Retirando…' : 'Retirar copia'}
                  </Boton>
                </div>
              </>
            ) : (
              <>
                <h2 className="margen-abajo-16">{activo ? 'Inactivar libro' : 'Activar libro'}</h2>
                {controlador.aviso && (
                  <div className="margen-abajo-16">
                    <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
                      {controlador.aviso.texto}
                    </Alerta>
                  </div>
                )}
                <p className="texto-secundario" style={{ fontSize: 14.5 }}>
                  {activo ? (
                    <>
                      El sistema revisa que ninguna copia esté en préstamo. Si todas están libres,
                      inactiva el libro junto con sus copias y su ficha bibliográfica por{' '}
                      <strong>obsolescencia</strong>, y deja de aparecer en el catálogo y en las
                      búsquedas.
                    </>
                  ) : (
                    'El libro volverá a aparecer en el catálogo y en las búsquedas, y se podrá editar de nuevo.'
                  )}
                </p>
                <div className="fila fin espacio-12 margen-arriba-24">
                  <Boton variante="texto" onClick={controlador.Cancelar}>
                    Cancelar
                  </Boton>
                  <Boton
                    variante={activo ? 'peligro' : 'primario'}
                    onClick={controlador.CambiarEstatusLibro}
                    disabled={controlador.enviando}
                  >
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
