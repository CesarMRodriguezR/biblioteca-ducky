/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-BL01 · PaginaCatalogo.jsx
 * Función: Búsqueda de libros en el catálogo.
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
 *     Componente       Objetivo
 *     TarjetaLibro     Tarjeta de un libro con portada, autores, disponibilidad…
 *     PaginaCatalogo   BD-SP02-BL01 Búsqueda de libros (catálogo)
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

import { Link } from 'react-router-dom';
import { FileText, MapPin } from 'lucide-react';
import { useControladorCatalogo } from '../../../controladores/ControladorCatalogo.js';
import { CAMPOS_BUSQUEDA, ORDENES_CATALOGO, UbicacionTexto } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  AlertaError,
  Boton,
  Buscador,
  Cargando,
  Insignia,
  Paginacion,
  Portada,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import { ModalListado } from './ModalListado.jsx';

/*
 * Componente: TarjetaLibro
 * Objetivo: Tarjeta de un libro con portada, autores, disponibilidad y ubicación.
 * Uso: <TarjetaLibro libro={…} />
 */
function TarjetaLibro({ libro })
{
  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  const total = libro.Ejemplares_Totales ?? 0;
  return (
    <Link to={`/catalogo/${libro.id_libro}`} className="tarjeta-libro tarjeta">
      <Portada libro={libro} ancho={78} alto={108} />
      <div className="tarjeta-libro-datos">
        <h3 className="tarjeta-libro-titulo">{libro.Titulo}</h3>
        <p className="texto-secundario" style={{ fontSize: 13.5 }}>
          {libro.Autores_Apellidos} · {libro.Nombre_Editorial}
        </p>
        <p className="texto-nota">
          {libro.Anio}
          {libro.Temas ? ` · ${libro.Temas}` : ''}
        </p>
        <div className="fila espacio-8 margen-arriba-8" style={{ flexWrap: 'wrap' }}>
          <Insignia tono={disponibles ? 'exito' : 'advertencia'}>
            {total} {total === 1 ? 'copia' : 'copias'} · {disponibles} de {total} disponibles
          </Insignia>
        </div>
        {libro.Pasillo && (
          <p className="texto-nota margen-arriba-8 fila espacio-8">
            <MapPin size={14} aria-hidden /> {UbicacionTexto(libro)}
          </p>
        )}
      </div>
    </Link>
  );
}

/*
 * Componente: PaginaCatalogo
 * Objetivo: BD-SP02-BL01 Búsqueda de libros (catálogo).
 * Uso: <PaginaCatalogo />
 */
export function PaginaCatalogo()
{
  const controlador = useControladorCatalogo();

  return (
    <Pagina miga="Catálogo" titulo="Buscar libros">
      <Tarjeta>
        <div className="fila espacio-12" style={{ flexWrap: 'wrap' }}>
          <Buscador
            valor={controlador.texto}
            al_cambio={controlador.SetTexto}
            al_buscar={controlador.Buscar}
            placeholder="Busca por título, autor, editorial, ISBN, año o tema"
            className="crece"
          />
          <Boton onClick={controlador.Buscar}>Buscar</Boton>
          {controlador.q && (
            <Boton variante="texto" onClick={controlador.Limpiar}>
              Limpiar
            </Boton>
          )}
        </div>
        <div className="fila entre margen-arriba-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="filtros" role="group" aria-label="Buscar en">
            {CAMPOS_BUSQUEDA.map((campo) => (
              <button
                key={campo.valor}
                type="button"
                className={`filtro ${controlador.campo === campo.valor ? 'filtro-activo' : ''}`}
                aria-pressed={controlador.campo === campo.valor}
                onClick={() => controlador.ElegirCampo(campo.valor)}
              >
                {campo.etiqueta.toUpperCase()}
              </button>
            ))}
          </div>
          <label className="fila espacio-8 texto-nota">
            Ordenar por
            <select
              className="selector"
              style={{ width: 'auto' }}
              value={controlador.orden}
              onChange={(evento) => controlador.ElegirOrden(evento.target.value)}
            >
              {ORDENES_CATALOGO.map((elemento) => (
                <option key={elemento.valor} value={elemento.valor}>
                  {elemento.etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Tarjeta>

      <div className="fila entre margen-arriba-24 margen-abajo-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <p className="texto-secundario">
          <strong>{controlador.resumen}</strong>
          {controlador.rango && ` · ${controlador.rango}`}
        </p>
        {controlador.puede_listar && (
          <Boton
            variante="secundario"
            icono={FileText}
            onClick={controlador.AbrirListado}
            disabled={!controlador.total}
          >
            Generar listado
          </Boton>
        )}
      </div>

      {controlador.cargando && !controlador.libros.length && <Cargando />}
      <AlertaError error={controlador.error} />
      {!controlador.cargando && !controlador.error && !controlador.libros.length && (
        <Tarjeta style={{ textAlign: 'center', padding: 40 }}>
          <h3>No hay ningún libro registrado con esos datos.</h3>
          <p className="texto-secundario margen-arriba-8">Revisa la ortografía o busca en otro campo.</p>
        </Tarjeta>
      )}

      <div className="rejilla-libros">
        {controlador.libros.map((libro) => (
          <TarjetaLibro key={libro.id_libro} libro={libro} />
        ))}
      </div>

      {controlador.total > 0 && (
        <div className="margen-arriba-24">
          <Paginacion
            pagina={controlador.pagina}
            total_paginas={controlador.total_paginas}
            al_cambio={controlador.IrAPagina}
          />
        </div>
      )}

      {controlador.listado_abierto && (
        <ModalListado filtros={controlador.filtros} al_cerrar={controlador.CerrarListado} />
      )}
    </Pagina>
  );
}
