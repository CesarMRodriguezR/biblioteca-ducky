/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL05 · PaginaFichaLibro.jsx
 * Función: Ficha bibliográfica completa o resumida según el rol.
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
 *     Componente         Objetivo
 *     ResumenCopias      Número de copias por estado para los perfiles que no…
 *     PaginaFichaLibro   BD-SP02-GL05 Consultar ficha bibliográfica (vista…
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

import { PenLine } from 'lucide-react';
import { useControladorFicha } from '../../../controladores/ControladorCatalogo.js';
import { ESTADOS_COPIA, UbicacionTexto } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  InsigniaCopia,
  Portada,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: ResumenCopias
 * Objetivo: Número de copias por estado para los perfiles que no gestionan libros.
 * Uso: <ResumenCopias resumen={…} />
 */
function ResumenCopias({ resumen })
{
  return (
    <Tarjeta relleno={false}>
      {['Disponible', 'Consulta externa', 'En prestamo'].map((estado, indice) => (
        <div
          key={estado}
          className="fila entre"
          style={{
            padding: '14px 18px',
            borderTop: indice ? '1px solid var(--linea-divisoria)' : 0,
          }}
        >
          <div>
            <InsigniaCopia estatus={estado} />
            <p className="texto-nota margen-arriba-8">{ESTADOS_COPIA[estado].descripcion}.</p>
          </div>
          <strong style={{ fontSize: 20 }}>{resumen[estado]}</strong>
        </div>
      ))}
    </Tarjeta>
  );
}

/*
 * Componente: PaginaFichaLibro
 * Objetivo: BD-SP02-GL05 Consultar ficha bibliográfica (vista completa o resumida según el
 *           rol).
 * Uso: <PaginaFichaLibro />
 */
export function PaginaFichaLibro()
{
  const controlador = useControladorFicha();
  const libro = controlador.libro;
  const activos = libro?.ejemplares?.filter((evento) => evento.Estatus !== 'Baja') ?? [];
  const sin_disponibles = libro && !libro.Ejemplares_Disponibles;

  return (
    <Pagina miga="Catálogo · Ficha" titulo="Ficha bibliográfica">
      <EnlaceVolver to="/catalogo">Regresar al catálogo</EnlaceVolver>
      {controlador.cargando && <Cargando />}
      {controlador.no_encontrado ? (
        <Tarjeta style={{ textAlign: 'center', padding: 40 }}>
          <h3>No hay ningún libro registrado con esos datos.</h3>
        </Tarjeta>
      ) : (
        <AlertaError error={controlador.error} />
      )}

      {libro && (
        <div
          className="columnas"
          style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}
        >
          <Tarjeta>
            <div className="fila espacio-24" style={{ alignItems: 'flex-start' }}>
              <Portada libro={libro} ancho={120} alto={170} />
              <div className="crece">
                <div className="fila entre" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <h2>{libro.Titulo}</h2>
                  {controlador.gestiona && libro.Estatus !== 'Activo' && (
                    <Insignia tono="neutro">Inactivo</Insignia>
                  )}
                </div>
                <p className="texto-secundario margen-arriba-8">{libro.Autor}</p>
                <p className="texto-nota">
                  {libro.Nombre_Editorial} · {libro.Pais}
                </p>
                <div className="rejilla-4 margen-arriba-16" style={{ gap: 16 }}>
                  <DatoEtiquetado etiqueta="ISBN" valor={libro.ISBN} />
                  <DatoEtiquetado etiqueta="Año" valor={libro.Anio} />
                  <DatoEtiquetado etiqueta="Tema" valor={libro.Tema} />
                  <DatoEtiquetado etiqueta="Número de copias" valor={libro.Ejemplares_Totales} />
                </div>
              </div>
            </div>
            <h3 className="margen-arriba-24">Sinopsis</h3>
            <p className="margen-arriba-8" style={{ lineHeight: 1.6 }}>
              {libro.Sinopsis || 'Sin sinopsis registrada.'}
            </p>
            <h3 className="margen-arriba-24">Ubicación</h3>
            <div className="rejilla-4 margen-arriba-8" style={{ gap: 16 }}>
              <DatoEtiquetado etiqueta="Pasillo" valor={libro.Pasillo} />
              <DatoEtiquetado etiqueta="Estante" valor={libro.Estante} />
              <DatoEtiquetado etiqueta="Nivel" valor={libro.Nivel} />
              <DatoEtiquetado etiqueta="Sección" valor={libro.Seccion} />
            </div>
            {controlador.gestiona && (
              <div className="fila fin margen-arriba-24">
                <Boton variante="secundario" icono={PenLine} onClick={controlador.Editar}>
                  Editar ficha
                </Boton>
              </div>
            )}
          </Tarjeta>

          <div>
            <h2 className="margen-abajo-16">Copias</h2>
            {controlador.gestiona ? (
              <Tarjeta relleno={false} className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Copia</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activos.map((activo) => (
                      <tr key={activo.num_copia}>
                        <td className="codigo-copia">{activo.Codigo}</td>
                        <td className="texto-nota">{UbicacionTexto(activo)}</td>
                        <td>
                          <InsigniaCopia estatus={activo.Estatus} />
                        </td>
                      </tr>
                    ))}
                    {!activos.length && (
                      <tr>
                        <td colSpan={3} className="tabla-vacia">
                          Sin copias activas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Tarjeta>
            ) : (
              <>
                {sin_disponibles && (
                  <div className="margen-abajo-16">
                    <Alerta tipo="advertencia" titulo="No hay copias disponibles por ahora">
                      Puedes unirte a la lista de espera desde el mostrador de préstamos.
                    </Alerta>
                  </div>
                )}
                <ResumenCopias resumen={libro.resumen_copias} />
              </>
            )}
          </div>
        </div>
      )}
    </Pagina>
  );
}
