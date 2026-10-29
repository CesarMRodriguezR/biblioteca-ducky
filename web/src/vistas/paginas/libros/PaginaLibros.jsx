/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL · PaginaLibros.jsx
 * Función: Libros registrados (activos e inactivos) con sus acciones.
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
 *     Componente     Objetivo
 *     PaginaLibros   Pantalla principal de Libros
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

import { useNavigate } from 'react-router-dom';
import { ArrowRight, Archive, PenLine, RotateCcw, Search, ShoppingCart } from 'lucide-react';
import { useSesion } from '../../../controladores/ControladorSesion.jsx';
import { useControladorLibrosRegistrados } from '../../../controladores/ControladorLibros.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  AlertaError,
  Boton,
  BotonIcono,
  Buscador,
  Insignia,
  Paginacion,
  Portada,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaLibros
 * Objetivo: Pantalla principal de Libros.
 * Uso: <PaginaLibros />
 */
export function PaginaLibros()
{
  const controlador = useControladorLibrosRegistrados();
  const { Puede } = useSesion();
  const navegar = useNavigate();

  const acciones = [
    {
      titulo: 'Alta de libro',
      texto: 'Registra una ficha nueva o agrega ejemplares a una existente.',
      icono: PenLine,
      fondo: 'fondo-azul',
      ruta: '/libros/nuevo',
    },
    {
      titulo: 'Consultar libros',
      texto: 'Busca en el catálogo por título, autor, tema o ISBN.',
      icono: Search,
      fondo: 'fondo-brillante',
      ruta: '/catalogo',
    },
    Puede('gestionar_libros') && {
      titulo: 'Solicitar libros',
      texto: 'Pide la compra de títulos nuevos o más ejemplares.',
      icono: ShoppingCart,
      fondo: 'fondo-dorado',
      ruta: '/libros/solicitar',
    },
  ].filter(Boolean);

  return (
    <Pagina miga="Libros · Inicio" titulo="Libros">
      <div className="rejilla-3">
        {acciones.map((accion) => (
          <button
            key={accion.titulo}
            type="button"
            className="tarjeta tarjeta-accion"
            onClick={() => navegar(accion.ruta)}
          >
            <div className={`tarjeta-accion-icono ${accion.fondo}`}>
              <accion.icono size={20} aria-hidden />
            </div>
            <div>
              <div className="tarjeta-accion-titulo">{accion.titulo}</div>
              <p className="texto-nota margen-arriba-8" style={{ color: 'var(--texto-secundario)' }}>
                {accion.texto}
              </p>
            </div>
            <ArrowRight className="tarjeta-accion-flecha" size={18} aria-hidden />
          </button>
        ))}
      </div>

      <div className="fila entre margen-arriba-32 margen-abajo-16">
        <h2>Libros registrados</h2>
        <Buscador
          valor={controlador.texto}
          al_cambio={controlador.SetTexto}
          al_buscar={controlador.Buscar}
          placeholder="Buscar por título o ISBN…"
          className="buscador-libros"
        />
      </div>
      <AlertaError error={controlador.error} />

      <Tarjeta relleno={false} className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Copias</th>
              <th>Estado</th>
              <th>Editar / Solicitar</th>
              <th>Desactivar / Activar</th>
            </tr>
          </thead>
          <tbody>
            {controlador.libros.map((libro) =>
            {
              const activo = libro.Estatus === 'Activo';
              return (
                <tr key={libro.id_libro}>
                  <td>
                    <div className="fila espacio-12">
                      <Portada libro={libro} ancho={26} alto={36} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{libro.Titulo}</div>
                        <div className="texto-nota">
                          {libro.Autores_Apellidos} · {libro.Nombre_Editorial} · ISBN {libro.ISBN}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{libro.Ejemplares_Totales}</td>
                  <td>
                    <Insignia tono={activo ? 'exito' : 'neutro'}>{libro.Estatus}</Insignia>
                  </td>
                  <td>
                    <div className="fila espacio-8">
                      <BotonIcono
                        icono={PenLine}
                        etiqueta={`Editar ${libro.Titulo}`}
                        onClick={() => navegar(`/libros/${libro.id_libro}/editar`)}
                      />
                      {Puede('gestionar_libros') && (
                        <BotonIcono
                          icono={ShoppingCart}
                          etiqueta={`Solicitar copias de ${libro.Titulo}`}
                          onClick={() => navegar(`/libros/${libro.id_libro}/solicitar`)}
                          disabled={!activo}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    {activo ? (
                      <Boton
                        variante="peligro"
                        chico
                        icono={Archive}
                        onClick={() => navegar(`/libros/${libro.id_libro}/baja`)}
                      >
                        Dar de baja
                      </Boton>
                    ) : (
                      <Boton
                        variante="secundario"
                        chico
                        icono={RotateCcw}
                        onClick={() => navegar(`/libros/${libro.id_libro}/baja?modo=estatus`)}
                      >
                        Activar
                      </Boton>
                    )}
                  </td>
                </tr>
              );
            })}
            {!controlador.cargando && controlador.libros.length === 0 && (
              <tr>
                <td colSpan={5} className="tabla-vacia">
                  <strong style={{ display: 'block', color: 'var(--texto-principal)' }}>
                    No se encontraron libros
                  </strong>
                  No hay libros registrados que coincidan con «{controlador.q}».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Tarjeta>
      {controlador.total_paginas > 1 && (
        <div className="fila fin margen-arriba-16">
          <Paginacion
            pagina={controlador.pagina}
            total_paginas={controlador.total_paginas}
            al_cambio={controlador.IrAPagina}
          />
        </div>
      )}
    </Pagina>
  );
}
