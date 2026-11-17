/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL05 · PaginaPrestamosVencidos.jsx
 * Función: Préstamos vencidos sin devolver, con filtro por perfil o de un lector.
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
 *     Componente                Objetivo
 *     PaginaPrestamosVencidos   BD-SP03-DL05 Consulta de préstamos vencidos
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { useControladorVencidos } from '../../../controladores/ControladorDevoluciones.js';
import {
  FILTROS_PERFIL,
  FechaCorta,
  FechaLarga,
  FormatoMoneda,
  HoyIso,
} from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Cargando,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import { BuscadorMatricula } from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaPrestamosVencidos
 * Objetivo: BD-SP03-DL05 Préstamos vencidos (todos, por perfil, de un usuario, sin vencidos y
 *           usuario inactivo o no registrado).
 * Uso: <PaginaPrestamosVencidos />
 */
export function PaginaPrestamosVencidos()
{
  const controlador = useControladorVencidos();
  const { consulta } = controlador;
  const datos = controlador.error ? null : controlador.datos;
  const filtro = FILTROS_PERFIL.find((opcion) => opcion.valor === consulta.perfil);
  const de_lector = Boolean(datos?.lector);

  return (
    <Pagina miga="Devoluciones · Vencidos" titulo="Préstamos vencidos">
      <EnlaceVolver to="/devoluciones">Volver a Devoluciones</EnlaceVolver>
      <BuscadorMatricula
        titulo={`Al ${FechaLarga(HoyIso()).toLowerCase()}`}
        subtitulo="Préstamos cuya fecha de devolución ya pasó y no se han devuelto"
        etiqueta="Buscar por matrícula o no. de nómina"
        ejemplo="Ej. 3109921"
        valor={controlador.matricula}
        al_cambio={controlador.SetMatricula}
        al_buscar={controlador.Buscar}
        buscando={controlador.cargando}
      >
        <div className="filtros margen-arriba-16">
          {FILTROS_PERFIL.map((opcion) => (
            <button
              key={opcion.etiqueta}
              type="button"
              className={`filtro ${!consulta.matricula && controlador.perfil === opcion.valor ? 'filtro-activo' : ''}`}
              onClick={() => controlador.Filtrar(opcion.valor)}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      </BuscadorMatricula>

      {controlador.cargando && !datos && <Cargando />}
      {controlador.error && (
        <div className="margen-arriba-16">
          <AlertaError error={controlador.error} />
          {controlador.error.status === 404 && (
            <p className="texto-nota margen-arriba-8">Revisa la matrícula e intenta de nuevo.</p>
          )}
        </div>
      )}

      {datos && de_lector && (
        <Tarjeta className="margen-arriba-16">
          <div className="rejilla-3">
            <DatoEtiquetado etiqueta="Lector" valor={datos.lector.Nombre_Completo} />
            <DatoEtiquetado etiqueta="Perfil" valor={datos.lector.Nombre_Rol} />
            <DatoEtiquetado etiqueta="Préstamos vencidos" valor={datos.datos.length} />
          </div>
        </Tarjeta>
      )}

      {datos && !datos.datos.length && (
        <div className="margen-arriba-16">
          <Alerta
            tipo="exito"
            titulo={
              de_lector
                ? `${datos.lector.Nombre_Completo} no tiene préstamos vencidos`
                : `No hay préstamos vencidos${filtro?.valor ? ` de ${filtro.plural}` : ''}`
            }
          >
            {de_lector
              ? 'Ha devuelto sus libros a tiempo.'
              : `Todos ${filtro?.valor ? `los ${filtro.plural}` : 'los lectores'} han devuelto sus libros a tiempo.`}
          </Alerta>
        </div>
      )}

      {datos && datos.datos.length > 0 && (
        <>
          <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Folio</th>
                  {!de_lector && <th>Lector</th>}
                  {!de_lector && <th>Perfil</th>}
                  <th>Libro · Copia</th>
                  <th>Devolución</th>
                  <th>{de_lector ? 'Días de retraso' : 'Días'}</th>
                  <th>Multa acumulada</th>
                </tr>
              </thead>
              <tbody>
                {datos.datos.map((prestamo) => (
                  <tr key={prestamo.id_prestamo}>
                    <td style={{ fontWeight: 700 }}>{prestamo.Folio}</td>
                    {!de_lector && <td>{prestamo.Nombre_Completo}</td>}
                    {!de_lector && <td>{prestamo.Nombre_Rol}</td>}
                    <td>
                      {prestamo.Titulo} · Copia {prestamo.num_copia}
                    </td>
                    <td>{FechaCorta(prestamo.Fecha_Entrega_Programada)}</td>
                    <td>{prestamo.Dias_Retraso}</td>
                    <td>
                      <Insignia tono="error">{FormatoMoneda(prestamo.Multa_Acumulada)}</Insignia>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>
          {!de_lector && (
            <p className="texto-nota margen-arriba-16">
              {datos.datos.length} {datos.datos.length === 1 ? 'préstamo vencido' : 'préstamos vencidos'}
              {filtro?.valor ? ` de ${filtro.plural}` : ''} · mostrando 1–{datos.datos.length}
            </p>
          )}
        </>
      )}
    </Pagina>
  );
}
