/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL05 · PaginaListaEspera.jsx
 * Función: Lista de espera de un libro: consulta, registro y baja de lectores y prioridad
 *          cuando hay un ejemplar disponible.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Estado del controlador de la pantalla
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
 *     PaginaListaEspera   BD-SP03-PL05 Lista de espera
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { Trash2, UserPlus } from 'lucide-react';
import { useControladorListaEspera } from '../../../controladores/ControladorPrestamos.js';
import { FechaCorta, FechaLarga, UbicacionTexto } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaListaEspera
 * Objetivo: BD-SP03-PL05 Lista de espera (consulta, registro exitoso y rechazado, lector que
 *           ya tiene el libro, baja de un lector y prioridad al primero de la lista).
 * Uso: <PaginaListaEspera />
 */
export function PaginaListaEspera()
{
  const controlador = useControladorListaEspera();
  const { datos } = controlador;
  const prioridad = datos?.prioridad;

  return (
    <Pagina miga="Préstamos · Lista de espera" titulo="Lista de espera" ancho={1000}>
      <EnlaceVolver to="/prestamos">Volver a Préstamos</EnlaceVolver>
      <Tarjeta>
        <form
          className="fila espacio-12 fila-buscador"
          onSubmit={(evento) =>
          {
            evento.preventDefault();
            controlador.Buscar();
          }}
        >
          <div className="campo campo-buscador">
            <label className="campo-etiqueta" htmlFor="libro-espera">
              Título o ISBN del libro
            </label>
            <input
              id="libro-espera"
              className="entrada"
              placeholder="Ej. Introduction to Algorithms o 978-0-262-03384-8"
              value={controlador.texto}
              onChange={(evento) => controlador.SetTexto(evento.target.value)}
            />
          </div>
          <Boton type="submit" disabled={controlador.buscando}>
            {controlador.buscando ? 'Buscando…' : 'Buscar'}
          </Boton>
        </form>
      </Tarjeta>
      {controlador.error && (
        <div className="margen-arriba-16">
          <AlertaError error={controlador.error} />
        </div>
      )}

      {datos && (
        <Tarjeta className="margen-arriba-16">
          <h2 className="titulo-seccion">{datos.libro.Titulo}</h2>
          <p className="texto-nota margen-arriba-4">
            {datos.libro.Autores_Apellidos} · {datos.libro.Nombre_Editorial} ·{' '}
            {UbicacionTexto(datos.libro.ubicacion ?? {}, null)}
          </p>
          <div className="rejilla-3 margen-arriba-16">
            <DatoEtiquetado
              etiqueta="Ejemplares para préstamo externo"
              valor={`${datos.prestables_libres} de ${datos.prestables}`}
            />
            <DatoEtiquetado
              etiqueta="Próxima devolución"
              valor={datos.proxima_devolucion ? FechaLarga(datos.proxima_devolucion) : '—'}
            />
            <DatoEtiquetado etiqueta="Lectores en espera" valor={datos.lista.length} />
          </div>
          {!prioridad && (
            <form
              className="fila espacio-12 fila-buscador margen-arriba-16"
              onSubmit={(evento) =>
              {
                evento.preventDefault();
                controlador.Agregar();
              }}
            >
              <div className="campo campo-buscador">
                <label className="campo-etiqueta" htmlFor="lector-espera">
                  Matrícula o no. de nómina del lector
                </label>
                <input
                  id="lector-espera"
                  className="entrada"
                  placeholder="Ej. 3111456"
                  value={controlador.matricula}
                  onChange={(evento) => controlador.SetMatricula(evento.target.value)}
                />
              </div>
              <Boton type="submit" icono={UserPlus} disabled={controlador.enviando}>
                Agregar a la lista
              </Boton>
            </form>
          )}
        </Tarjeta>
      )}

      {controlador.aviso && (
        <div className="margen-arriba-16">
          <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
            {controlador.aviso.texto}
          </Alerta>
        </div>
      )}

      {datos && controlador.filas.length > 0 && (
        <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
          <table className="tabla">
            <thead>
              <tr>
                <th>Turno</th>
                <th>Lector</th>
                <th>Matrícula / Nómina</th>
                <th>Perfil</th>
                <th>Fecha de petición</th>
                <th>Estatus</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {controlador.filas.map((registro) => (
                <tr key={registro.id_lista_espera}>
                  <td>
                    {registro.Cancelado
                      ? '—'
                      : `${registro.Turno}.º${registro.Turno === 1 && prioridad ? ' · Prioridad' : ''}`}
                  </td>
                  <td style={{ fontWeight: 700 }}>{registro.Nombre_Completo}</td>
                  <td>{registro.Matricula_Nomina}</td>
                  <td>{registro.Nombre_Rol}</td>
                  <td>{FechaCorta(registro.Fecha_Peticion)}</td>
                  <td>
                    {registro.Cancelado && <Insignia tono="neutro">Cancelado</Insignia>}
                    {!registro.Cancelado && registro.id_lista_espera === controlador.agregado && (
                      <Insignia tono="exito">Agregado</Insignia>
                    )}
                    {!registro.Cancelado && registro.id_lista_espera !== controlador.agregado && (
                      <Insignia tono="advertencia">En espera</Insignia>
                    )}
                  </td>
                  <td>
                    {!registro.Cancelado && (
                      <Boton
                        variante="peligro"
                        chico
                        icono={Trash2}
                        onClick={() => controlador.Quitar(registro)}
                      >
                        Quitar
                      </Boton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
      {datos && !datos.lista.length && !controlador.filas.length && (
        <p className="texto-nota margen-arriba-16">Nadie está esperando este libro.</p>
      )}
      {datos && datos.lista.length > 0 && (
        <p className="texto-nota margen-arriba-16">
          {datos.lista.length} {datos.lista.length === 1 ? 'lector' : 'lectores'} en espera ·
          Cuando haya un ejemplar disponible, se le dará prioridad al lector que se registró primero
          en la lista (no se envían notificaciones).
        </p>
      )}

      {prioridad && (
        <>
          <div className="margen-arriba-16">
            <Alerta tipo="informacion" titulo={`Hay un ejemplar disponible de ${datos.libro.Titulo}`}>
              {prioridad.Nombre_Completo} tiene prioridad porque fue el primero en registrarse en la
              lista ({FechaCorta(prioridad.Fecha_Peticion)}).
            </Alerta>
          </div>
          <div className="margen-arriba-16">
            <Boton onClick={() => controlador.Prestar(prioridad)}>
              Prestar a {prioridad.Nombre_Completo}
            </Boton>
          </div>
        </>
      )}
    </Pagina>
  );
}
