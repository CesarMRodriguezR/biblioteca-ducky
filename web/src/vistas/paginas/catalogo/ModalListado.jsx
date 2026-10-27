/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL06 · ModalListado.jsx
 * Función: Vista previa del listado de libros con impresión y descarga en PDF.
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
 *     ModalListado   BD-SP02-GL06 Vista previa del listado con impresión y…
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

import { Download, Printer } from 'lucide-react';
import { useControladorListado } from '../../../controladores/ControladorCatalogo.js';
import { FormatoFecha } from '../../../modelos/dominio.js';
import { AlertaError, Boton, Cargando, Modal } from '../../componentes/interfaz.jsx';

/*
 * Componente: ModalListado
 * Objetivo: BD-SP02-GL06 Vista previa del listado con impresión y descarga en PDF.
 * Uso: <ModalListado filtros={…} al_cerrar={…} />
 */
export function ModalListado({ filtros, al_cerrar })
{
  const controlador = useControladorListado(filtros);
  const libro = controlador.listado;

  return (
    <Modal
      titulo="Vista previa del listado"
      al_cerrar={al_cerrar}
      acciones={
        <div className="fila espacio-8">
          <Boton
            variante="secundario"
            chico
            icono={Printer}
            onClick={controlador.Imprimir}
            disabled={!libro}
          >
            Imprimir
          </Boton>
          <Boton
            chico
            icono={Download}
            onClick={controlador.GuardarPdf}
            disabled={!libro || controlador.generando_pdf}
          >
            {controlador.generando_pdf ? 'Generando…' : 'Guardar como PDF'}
          </Boton>
        </div>
      }
    >
      {controlador.cargando && <Cargando />}
      <AlertaError error={controlador.error} />
      {libro && (
        <div className="imprimible">
          <h2>Listado de libros</h2>
          <p className="texto-nota margen-arriba-8 margen-abajo-16">
            Generado por {libro.generado_por} · {FormatoFecha(libro.generado_el)} · Filtro:{' '}
            {libro.filtro} · {libro.total} {libro.total === 1 ? 'libro' : 'libros'}
          </p>
          <div className="tabla-envoltura">
            <table className="tabla tabla-compacta">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Autor</th>
                  <th>Editorial</th>
                  <th>ISBN</th>
                  <th>Año</th>
                  <th>Tema</th>
                  <th>Sinopsis</th>
                  <th>Copias</th>
                </tr>
              </thead>
              <tbody>
                {libro.datos.map((libro, indice) => (
                  <tr key={libro.id_libro}>
                    <td>{indice + 1}</td>
                    <td style={{ fontWeight: 700 }}>{libro.Titulo}</td>
                    <td>{libro.Autores}</td>
                    <td>{libro.Nombre_Editorial}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{libro.ISBN}</td>
                    <td>{libro.Anio}</td>
                    <td>{libro.Temas}</td>
                    <td className="texto-nota" style={{ minWidth: 220 }}>
                      {libro.Sinopsis}
                    </td>
                    <td>{libro.Ejemplares_Totales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="texto-nota margen-arriba-16">Biblioteca Universidad Ducky</p>
        </div>
      )}
    </Modal>
  );
}
