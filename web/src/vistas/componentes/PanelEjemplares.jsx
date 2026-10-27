/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL02 · PanelEjemplares.jsx
 * Función: Agregar ejemplares con su ubicación y listar los registrados.
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
 *     Opciones          Preparar las opciones de un selector incluyendo el valor…
 *     PASILLOS          Pasillos disponibles
 *     ESTANTES          Estantes disponibles
 *     NIVELES           Niveles disponibles
 *     PanelEjemplares   "Ejemplares de la ficha": agrega copias con su ubicación…
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

import { useEffect, useState } from 'react';
import { FormatoFecha, UbicacionTexto } from '../../modelos/dominio.js';
import { AlertaError, Boton, InsigniaCopia, Portada, Selector, Tarjeta } from './interfaz.jsx';

/*
 * Función: Opciones
 * Objetivo: Preparar las opciones de un selector incluyendo el valor actual.
 * Entrada: valores, actual
 * Salida: Lista de { valor, etiqueta }
 */
const Opciones = (valores, actual) =>
{
  const lista = actual && !valores.includes(actual) ? [actual, ...valores] : valores;
  return lista.map((elemento) => ({ valor: elemento, etiqueta: elemento }));
};
/*
 * Constante: PASILLOS
 * Objetivo: Pasillos disponibles.
 */
const PASILLOS = ['1', '2', '3', '4', '5', '6'];
/*
 * Constante: ESTANTES
 * Objetivo: Estantes disponibles.
 */
const ESTANTES = ['A', 'B', 'C', 'D', 'E', 'F'];
/*
 * Constante: NIVELES
 * Objetivo: Niveles disponibles.
 */
const NIVELES = ['1', '2', '3', '4'];

/*
 * Componente: PanelEjemplares
 * Objetivo: "Ejemplares de la ficha": agrega copias con su ubicación y lista las registradas.
 * Uso: <PanelEjemplares libro={…} al_agregar={…} agregando={…} error={…} />
 */
export function PanelEjemplares({ libro, al_agregar, agregando, error })
{
  const [form, SetForm] = useState({ cantidad: '1', Pasillo: '4', Estante: 'B', Nivel: '2' });
  const [error_cantidad, SetErrorCantidad] = useState(null);

  useEffect(() =>
  {
    if (libro?.Pasillo)
    {
      SetForm((form_previo) => ({
        ...form_previo,
        Pasillo: libro.Pasillo,
        Estante: libro.Estante ?? form_previo.Estante,
        Nivel: libro.Nivel ?? form_previo.Nivel,
      }));
    }
  }, [libro?.id_libro, libro?.Pasillo, libro?.Estante, libro?.Nivel]);

  if (!libro)
  {
    return (
      <Tarjeta style={{ textAlign: 'center', padding: 32 }}>
        <p className="texto-secundario">
          Guarda la ficha bibliográfica para poder agregar ejemplares.
        </p>
      </Tarjeta>
    );
  }

  const cantidad = Number(form.cantidad);
  const Cambiar = (campo) => (evento) =>
  {
    SetForm((form_previo) => ({ ...form_previo, [campo]: evento.target.value }));
    SetErrorCantidad(null);
  };
  const activos = (libro.ejemplares ?? []).filter((elemento) => elemento.Estatus !== 'Baja');

  async function Agregar()
  {
    if (!Number.isInteger(cantidad) || cantidad < 1)
    {
      SetErrorCantidad('Debe ser 1 o más.');
      return;
    }
    await al_agregar({ ...form, cantidad }).catch(() =>
    {});
  }

  return (
    <div className="pila espacio-16">
      <Tarjeta>
        <div className="fila espacio-16" style={{ alignItems: 'flex-start' }}>
          <Portada libro={libro} ancho={66} alto={96} />
          <div>
            <h3>{libro.Titulo}</h3>
            <p className="texto-secundario" style={{ fontSize: 14 }}>
              {libro.Autor} · {libro.Nombre_Editorial} · {libro.Anio}
            </p>
            <p className="texto-nota">
              ISBN {libro.ISBN} · {activos.length} {activos.length === 1 ? 'copia' : 'copias'}
            </p>
          </div>
        </div>
        <hr
          style={{
            border: 0,
            borderTop: '1px solid var(--linea-divisoria)',
            margin: '20px 0 16px',
          }}
        />
        <strong style={{ fontSize: 14 }}>Agregar ejemplares</strong>
        <div className="rejilla-4 margen-arriba-8" style={{ gridTemplateColumns: '0.8fr 1fr 1fr 1fr', gap: 10 }}>
          <div className={`campo ${error_cantidad ? 'campo-con-error' : ''}`}>
            <label className="campo-etiqueta" htmlFor="cantidad" style={{ fontSize: 14 }}>
              Cantidad
            </label>
            <input
              id="cantidad"
              className="entrada"
              inputMode="numeric"
              value={form.cantidad}
              onChange={Cambiar('cantidad')}
            />
          </div>
          <Selector
            etiqueta="Pasillo"
            value={form.Pasillo}
            onChange={Cambiar('Pasillo')}
            opciones={Opciones(PASILLOS, form.Pasillo)}
          />
          <Selector
            etiqueta="Estante"
            value={form.Estante}
            onChange={Cambiar('Estante')}
            opciones={Opciones(ESTANTES, form.Estante)}
          />
          <Selector
            etiqueta="Nivel"
            value={form.Nivel}
            onChange={Cambiar('Nivel')}
            opciones={Opciones(NIVELES, form.Nivel)}
          />
        </div>
        {error_cantidad && <p className="campo-mensaje-error margen-arriba-8">{error_cantidad}</p>}
        <p className="texto-nota margen-arriba-8">
          Pasillo, estante y nivel: por defecto se usan los de las demás copias del libro.
        </p>
        <Boton
          className="margen-arriba-16"
          style={{ width: '100%' }}
          onClick={Agregar}
          disabled={agregando || libro.Estatus !== 'Activo'}
        >
          {agregando
            ? 'Agregando…'
            : `Agregar ${Number.isInteger(cantidad) && cantidad > 0 ? cantidad : ''} ${cantidad === 1 ? 'ejemplar' : 'ejemplares'}`}
        </Boton>
        <div className="margen-arriba-8">
          <AlertaError error={error} />
        </div>
      </Tarjeta>

      {activos.length === 0 ? (
        <Tarjeta style={{ textAlign: 'center', padding: 28 }}>
          <p className="texto-secundario">Esta ficha aún no tiene ejemplares.</p>
        </Tarjeta>
      ) : (
        <Tarjeta relleno={false} className="tabla-envoltura">
          <div style={{ padding: '14px 16px', fontWeight: 700 }}>Ejemplares registrados</div>
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Alta</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((activo) => (
                <tr key={activo.num_copia}>
                  <td className="codigo-copia">{activo.Codigo}</td>
                  <td className="texto-nota">{UbicacionTexto(activo)}</td>
                  <td className="texto-nota">{FormatoFecha(activo.Fecha_Alta)}</td>
                  <td>
                    <InsigniaCopia estatus={activo.Estatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </div>
  );
}
