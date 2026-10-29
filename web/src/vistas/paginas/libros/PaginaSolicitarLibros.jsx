/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL01 · PaginaSolicitarLibros.jsx
 * Función: Solicitud de compra de libros nuevos o de más copias, y catálogo de editoriales.
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
 *     Componente              Objetivo
 *     TablaEditoriales        Tabla de editoriales con alta, edición y eliminación en…
 *     PaginaSolicitarLibros   BD-SP02-GL01 Solicitar libros (versión exitosa, fallida y…
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

import { useState } from 'react';
import { Check, PenLine, Plus, Trash2, X } from 'lucide-react';
import { useControladorSolicitudCompra } from '../../../controladores/ControladorLibros.js';
import { ESTADOS_SOLICITUD } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { FormularioFicha } from '../../componentes/FormularioFicha.jsx';
import {
  Alerta,
  Boton,
  BotonIcono,
  EnlaceVolver,
  Entrada,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: TablaEditoriales
 * Objetivo: Tabla de editoriales con alta, edición y eliminación en línea.
 * Uso: <TablaEditoriales editoriales={…} al_guardar={…} al_eliminar={…} />
 */
function TablaEditoriales({ editoriales, al_guardar, al_eliminar })
{
  const [editando, SetEditando] = useState(null); // id o 'nueva'
  const [form, SetForm] = useState({ Nombre_Editorial: '', Pais: '' });
  const [error, SetError] = useState(null);

  const Iniciar = (editorial) =>
  {
    SetEditando(editorial ? editorial.id_editorial : 'nueva');
    SetForm(
      editorial
        ? { Nombre_Editorial: editorial.Nombre_Editorial, Pais: editorial.Pais }
        : { Nombre_Editorial: '', Pais: '' },
    );
    SetError(null);
  };
  const Guardar = async () =>
  {
    try
    {
      await al_guardar(editando === 'nueva' ? null : editando, form);
      SetEditando(null);
    }
    catch (excepcion)
    {
      SetError(excepcion.message);
    }
  };
  const Eliminar = async (id) =>
  {
    try
    {
      await al_eliminar(id);
      SetError(null);
    }
    catch (excepcion)
    {
      SetError(excepcion.message);
    }
  };

  const fila_edicion = (
    <tr>
      <td>
        <input
          className="entrada"
          aria-label="Nombre"
          value={form.Nombre_Editorial}
          onChange={(evento) => SetForm({ ...form, Nombre_Editorial: evento.target.value })}
        />
      </td>
      <td>
        <input
          className="entrada"
          aria-label="País"
          value={form.Pais}
          onChange={(evento) => SetForm({ ...form, Pais: evento.target.value })}
        />
      </td>
      <td>
        <div className="fila espacio-8">
          <BotonIcono icono={Check} etiqueta="Guardar editorial" onClick={Guardar} />
          <BotonIcono icono={X} etiqueta="Cancelar" onClick={() => SetEditando(null)} />
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <div className="fila entre margen-arriba-32 margen-abajo-16">
        <h2>Editoriales</h2>
        <Boton variante="secundario" chico icono={Plus} onClick={() => Iniciar(null)}>
          Agregar
        </Boton>
      </div>
      {error && (
        <div className="margen-abajo-16">
          <Alerta tipo="error" titulo={error} />
        </div>
      )}
      <Tarjeta relleno={false} className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>País</th>
              <th>Editar / Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {editando === 'nueva' && fila_edicion}
            {editoriales.map((editorial) =>
              editando === editorial.id_editorial ? (
                <tbody key={editorial.id_editorial} style={{ display: 'contents' }}>
                  {fila_edicion}
                </tbody>
              ) : (
                <tr key={editorial.id_editorial}>
                  <td style={{ fontWeight: 700 }}>{editorial.Nombre_Editorial}</td>
                  <td>{editorial.Pais}</td>
                  <td>
                    <div className="fila espacio-8">
                      <BotonIcono
                        icono={PenLine}
                        etiqueta={`Editar ${editorial.Nombre_Editorial}`}
                        onClick={() => Iniciar(editorial)}
                      />
                      <BotonIcono
                        icono={Trash2}
                        etiqueta={`Eliminar ${editorial.Nombre_Editorial}`}
                        peligro
                        onClick={() => Eliminar(editorial.id_editorial)}
                      />
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </Tarjeta>
    </>
  );
}

/*
 * Componente: PaginaSolicitarLibros
 * Objetivo: BD-SP02-GL01 Solicitar libros (versión exitosa, fallida y "más copias").
 * Uso: <PaginaSolicitarLibros />
 */
export function PaginaSolicitarLibros()
{
  const controlador = useControladorSolicitudCompra();
  const copias = controlador.modo_copias;

  return (
    <Pagina
      miga={copias ? 'Libros · Solicitar copias' : 'Libros · Solicitar libros'}
      titulo={copias ? 'Solicitar más copias' : 'Solicitar libros'}
    >
      <EnlaceVolver to="/libros">Volver a Libros</EnlaceVolver>
      <div className="columnas" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.9fr)' }}>
        <Tarjeta>
          <h2>
            {copias ? (controlador.libro?.Titulo ?? 'Cargando…') : 'Nueva solicitud de compra'}
          </h2>
          <p className="texto-secundario margen-arriba-8 margen-abajo-16" style={{ fontSize: 14 }}>
            Registra los títulos de la lista de peticiones del periodo. Se envía a Tesorería para
            validar el presupuesto mensual.
          </p>
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
              controlador.EnviarSolicitud();
            }}
            noValidate
          >
            <FormularioFicha
              ficha={controlador.form}
              errores={controlador.errores}
              cambiar={controlador.Cambiar}
              editoriales={controlador.opciones_editorial}
              ocultos={['Precio']}
              bloqueados={
                copias
                  ? ['Titulo', 'Autor', 'ISBN', 'Anio', 'Tema', 'Sinopsis', 'id_editorial']
                  : []
              }
              ayudas={{ Anio: 'Año de 4 dígitos, p. ej. 2022' }}
              extras={{
                antes: (
                  <Entrada
                    etiqueta={copias ? 'Copias a solicitar' : 'Número de copias'}
                    value={controlador.form.Num_Ejemplares}
                    onChange={controlador.Cambiar('Num_Ejemplares')}
                    error={controlador.errores.Num_Ejemplares}
                    ayuda={
                      copias
                        ? `Número entero, 1 o más · Hoy hay ${controlador.libro?.Ejemplares_Totales ?? 0} copias registradas.`
                        : 'Número entero, 1 o más'
                    }
                    inputMode="numeric"
                  />
                ),
              }}
            />
            <div className="fila entre margen-arriba-24">
              <span className="texto-nota">
                {copias
                  ? 'Solo se puede editar el número de copias.'
                  : 'Todos los campos son obligatorios.'}
              </span>
              <div className="fila espacio-12">
                <Boton variante="texto" onClick={controlador.Cancelar}>
                  Cancelar
                </Boton>
                <Boton type="submit" disabled={controlador.enviando}>
                  {controlador.enviando ? 'Enviando…' : 'Enviar solicitud'}
                </Boton>
              </div>
            </div>
          </form>
        </Tarjeta>

        <div>
          <h2 className="margen-abajo-16">Solicitudes pendientes</h2>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Editorial</th>
                  <th>Cant.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {controlador.solicitudes.map((solicitud) => (
                  <tr key={`${solicitud.id_orden}-${solicitud.Tipo}-${solicitud.id_referencia}`}>
                    <td>
                      <strong>{solicitud.Titulo}</strong>
                      {solicitud.Folio_Tesoreria && (
                        <div className="texto-nota">Tesorería · {solicitud.Folio_Tesoreria}</div>
                      )}
                    </td>
                    <td>{solicitud.Editorial}</td>
                    <td>{solicitud.Num_Ejemplares}</td>
                    <td>
                      <Insignia tono={ESTADOS_SOLICITUD[solicitud.Estatus].tono}>
                        {ESTADOS_SOLICITUD[solicitud.Estatus].etiqueta}
                      </Insignia>
                      {solicitud.Motivo_Respuesta && (
                        <div className="texto-nota margen-arriba-8">
                          {solicitud.Motivo_Respuesta}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!controlador.solicitudes.length && (
                  <tr>
                    <td colSpan={4} className="tabla-vacia">
                      No hay solicitudes pendientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Tarjeta>
          <TablaEditoriales
            editoriales={controlador.editoriales}
            al_guardar={controlador.GuardarEditorial}
            al_eliminar={controlador.EliminarEditorial}
          />
        </div>
      </div>
    </Pagina>
  );
}
