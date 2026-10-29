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
 *     Componente            Objetivo
 *     ESTADOS_RESUMEN       Estados de copia que se cuentan en la vista resumida
 *     InsigniaDisponibles   Etiqueta «3 de 5 disponibles»
 *     DatosLibro            ISBN, año, tema y número de copias
 *     Ubicacion             Pasillo, estante, nivel y sección
 *     FichaCompleta         Vista para quien gestiona libros (con ejemplares)
 *     FichaResumida         Vista para quien solo busca (copias por estado)
 *     PaginaFichaLibro      BD-SP02-GL05 Consultar un libro
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

import { ArrowLeft, MapPin, PenLine } from 'lucide-react';
import { useControladorFicha } from '../../../controladores/ControladorCatalogo.js';
import { ESTADOS_COPIA } from '../../../modelos/dominio.js';
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
 * Constante: ESTADOS_RESUMEN
 * Objetivo: Estados de copia que se cuentan en la vista resumida, en el orden del prototipo.
 */
const ESTADOS_RESUMEN = ['Disponible', 'Consulta Externa', 'En préstamo'];

/*
 * Componente: InsigniaDisponibles
 * Objetivo: Etiqueta «3 de 5 disponibles» (verde si hay copias, ámbar si no).
 * Uso: <InsigniaDisponibles libro={…} />
 */
function InsigniaDisponibles({ libro })
{
  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  return (
    <Insignia tono={disponibles ? 'exito' : 'advertencia'}>
      {disponibles} de {libro.Ejemplares_Totales ?? 0} disponibles
    </Insignia>
  );
}

/*
 * Componente: DatosLibro
 * Objetivo: ISBN, año, tema y número de copias en cuatro columnas.
 * Uso: <DatosLibro libro={…} />
 */
function DatosLibro({ libro })
{
  return (
    <div className="ficha-datos">
      <DatoEtiquetado etiqueta="ISBN" valor={libro.ISBN} />
      <DatoEtiquetado etiqueta="Año" valor={libro.Anio} />
      <DatoEtiquetado etiqueta="Tema" valor={libro.Tema} />
      <DatoEtiquetado etiqueta="Número de copias" valor={libro.Ejemplares_Totales} />
    </div>
  );
}

/*
 * Componente: Ubicacion
 * Objetivo: Pasillo, estante, nivel y sección del libro con su título.
 * Uso: <Ubicacion libro={…} titulo={…} className={…} />
 */
function Ubicacion({ libro, titulo, className = '' })
{
  return (
    <div className={`ficha-ubicacion ${className}`}>
      <div className="ficha-ubicacion-titulo">
        <MapPin size={16} aria-hidden />
        {titulo}
      </div>
      <div className="ficha-datos">
        <DatoEtiquetado etiqueta="Pasillo" valor={libro.Pasillo} />
        <DatoEtiquetado etiqueta="Estante" valor={libro.Estante} />
        <DatoEtiquetado etiqueta="Nivel" valor={libro.Nivel} />
        <DatoEtiquetado etiqueta="Sección" valor={libro.Seccion} />
      </div>
    </div>
  );
}

/*
 * Componente: FichaCompleta
 * Objetivo: BD-SP02-GL05 Consulta exitosa (quien gestiona libros): portada con «Editar ficha»
 *           y la tabla de ejemplares con su estado.
 * Uso: <FichaCompleta libro={…} al_editar={…} />
 */
function FichaCompleta({ libro, al_editar })
{
  const activos = libro.ejemplares?.filter((ejemplar) => ejemplar.Estatus !== 'Inactivo') ?? [];
  return (
    <div className="ficha-completa">
      <div className="ficha-portada">
        <Portada libro={libro} ancho={160} alto={230} />
        <Boton variante="secundario" icono={PenLine} onClick={al_editar}>
          Editar ficha
        </Boton>
      </div>

      <div className="ficha-informacion">
        <div>
          <div className="fila entre" style={{ alignItems: 'flex-start', gap: 12 }}>
            <h1>{libro.Titulo}</h1>
            {libro.Estatus !== 'Activo' && <Insignia tono="neutro">Inactivo</Insignia>}
          </div>
          <p className="ficha-subtitulo">
            {[libro.Autor, libro.Nombre_Editorial, libro.Anio].filter(Boolean).join(' · ')}
          </p>
        </div>
        <DatosLibro libro={libro} />
        <p className="ficha-texto">{libro.Sinopsis || 'Sin sinopsis registrada.'}</p>
        <Ubicacion libro={libro} titulo="Ubicación" />
        <div>
          <div className="ficha-copias-encabezado">
            <h2>Copias</h2>
            <InsigniaDisponibles libro={libro} />
          </div>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th style={{ width: 240 }}>Ejemplar</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {activos.map((activo) => (
                  <tr key={activo.num_copia}>
                    <td style={{ fontWeight: 700 }}>{activo.Codigo}</td>
                    <td>
                      <InsigniaCopia estatus={activo.Estatus} />
                    </td>
                  </tr>
                ))}
                {!activos.length && (
                  <tr>
                    <td colSpan={2} className="tabla-vacia">
                      Sin copias activas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}

/*
 * Componente: FichaResumida
 * Objetivo: Detalle del libro para quien solo busca: datos, sinopsis, ubicación y número de
 *           copias por estado; aviso si no hay copias disponibles.
 * Uso: <FichaResumida libro={…} />
 */
function FichaResumida({ libro })
{
  const resumen = libro.resumen_copias ?? {};
  return (
    <div className="ficha-resumida">
      <div className="ficha-portada">
        <Portada libro={libro} ancho={200} alto={288} />
        <InsigniaDisponibles libro={libro} />
      </div>

      <div className="ficha-informacion">
        {!libro.Ejemplares_Disponibles && (
          <Alerta tipo="advertencia" titulo="No hay copias disponibles por ahora">
            Todas las copias están en préstamo. Consulta de nuevo más tarde o pregunta en el
            mostrador.
          </Alerta>
        )}
        <div className="ficha-caja">
          <DatosLibro libro={libro} />
        </div>
        <div className="ficha-sinopsis">
          <h3>Sinopsis</h3>
          <p className="ficha-texto">{libro.Sinopsis || 'Sin sinopsis registrada.'}</p>
        </div>
        <Ubicacion libro={libro} titulo="Ubicación en la biblioteca" className="ficha-caja" />
        <div>
          <div className="ficha-copias-encabezado">
            <h3>Copias</h3>
            <InsigniaDisponibles libro={libro} />
          </div>
          <div className="ficha-caja ficha-lista-estados">
            {ESTADOS_RESUMEN.map((estado) => (
              <div key={estado} className="ficha-estado">
                <InsigniaCopia estatus={estado} />
                <span className="ficha-estado-texto">{ESTADOS_COPIA[estado].descripcion}</span>
                <span className="ficha-estado-cantidad">
                  {resumen[estado] ?? 0} {resumen[estado] === 1 ? 'copia' : 'copias'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Componente: PaginaFichaLibro
 * Objetivo: BD-SP02-GL05 Consultar un libro: vista completa para quien gestiona libros y vista
 *           resumida para los demás perfiles.
 * Uso: <PaginaFichaLibro />
 */
export function PaginaFichaLibro()
{
  const controlador = useControladorFicha();
  const libro = controlador.libro;
  const estado = (
    <>
      {controlador.cargando && <Cargando />}
      {controlador.no_encontrado ? (
        <Tarjeta style={{ textAlign: 'center', padding: 40 }}>
          <h3>No hay ningún libro registrado con esos datos.</h3>
        </Tarjeta>
      ) : (
        <AlertaError error={controlador.error} />
      )}
    </>
  );

  if (controlador.gestiona)
  {
    return (
      <Pagina miga="Catálogo · Detalle" titulo="Ficha del libro">
        <EnlaceVolver to="/catalogo">Regresar al catálogo</EnlaceVolver>
        {estado}
        {libro && <FichaCompleta libro={libro} al_editar={controlador.Editar} />}
      </Pagina>
    );
  }

  return (
    <div className="contenido">
      <button type="button" className="ficha-regresar" onClick={controlador.RegresarCatalogo}>
        <ArrowLeft size={18} aria-hidden /> Regresar al catálogo
      </button>
      {libro && (
        <div className="ficha-encabezado">
          <p className="ficha-miga">Catálogo · Detalle</p>
          <h1>{libro.Titulo}</h1>
          <p className="ficha-subtitulo">
            {[libro.Autor, libro.Nombre_Editorial, libro.Anio].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
      {estado}
      {libro && <FichaResumida libro={libro} />}
    </div>
  );
}
