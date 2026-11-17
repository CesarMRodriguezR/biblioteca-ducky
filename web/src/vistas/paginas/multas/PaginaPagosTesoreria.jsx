/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL07 · PaginaPagosTesoreria.jsx
 * Función: Pagos de multas recibidos de Tesorería (filtrados por periodo y matrícula) y multas
 *          pendientes de sincronizar.
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
 *     Componente             Objetivo
 *     PaginaPagosTesoreria   BD-SP03-DL07 Pagos de Tesorería
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { RotateCcw } from 'lucide-react';
import { useControladorPagos } from '../../../controladores/ControladorDevoluciones.js';
import { FechaCorta, FormatoMoneda } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaPagosTesoreria
 * Objetivo: BD-SP03-DL07 Pagos de Tesorería (conectado y falla de conexión).
 * Uso: <PaginaPagosTesoreria />
 */
export function PaginaPagosTesoreria()
{
  const controlador = useControladorPagos();
  const { datos, pagos } = controlador;
  const pendientes = datos?.pendientes ?? [];

  return (
    <Pagina miga="Multas y adeudos · Pagos" titulo="Pagos de Tesorería" ancho={1100}>
      <EnlaceVolver to="/multas">Volver a Multas y adeudos</EnlaceVolver>
      {controlador.cargando && !datos && <Cargando texto="Consultando a Tesorería…" />}
      <AlertaError error={controlador.error} />
      {datos && datos.disponible && (
        <Alerta tipo="informacion" titulo="Conectado con Tesorería">
          Los pagos se reciben automáticamente en cuanto Tesorería los registra. Las multas pagadas
          se marcan solas y el lector sale de la lista de deudores.
          {datos.enviadas > 0 &&
            ` Se enviaron ${datos.enviadas} ${datos.enviadas === 1 ? 'multa pendiente' : 'multas pendientes'} a Tesorería.`}
        </Alerta>
      )}
      {datos && !datos.disponible && (
        <Alerta tipo="error" titulo="Sin conexión con Tesorería">
          {pendientes.length
            ? `Hay ${pendientes.length} ${pendientes.length === 1 ? 'movimiento pendiente' : 'movimientos pendientes'} de sincronizar. `
            : 'No se pudieron consultar los pagos. '}
          El sistema los volverá a intentar cada vez que se abra esta pantalla.
        </Alerta>
      )}

      {datos && (
        <div className="fila entre espacio-12 margen-arriba-16 fila-filtros-pagos">
          <div className="filtros">
            {controlador.periodos.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                className={`filtro ${controlador.periodo === opcion.valor ? 'filtro-activo' : ''}`}
                onClick={() => controlador.SetPeriodo(opcion.valor)}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
          <form
            className="fila espacio-12"
            onSubmit={(evento) =>
            {
              evento.preventDefault();
              controlador.Buscar();
            }}
          >
            <input
              className="entrada"
              aria-label="Buscar por matrícula o no. de nómina"
              placeholder="Buscar por matrícula o no. de nómina"
              value={controlador.texto}
              onChange={(evento) => controlador.SetTexto(evento.target.value)}
            />
            <Boton type="submit">Buscar</Boton>
          </form>
        </div>
      )}

      {datos && (
        <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
          <table className="tabla">
            <thead>
              <tr>
                <th>Folio de Tesorería</th>
                <th>Lector</th>
                <th>Monto</th>
                <th>Fecha de pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {controlador.pendientes.map((multa) => (
                <tr key={`pendiente-${multa.id_multa}`}>
                  <td style={{ fontWeight: 700 }}>{multa.Folio} · envío de multa</td>
                  <td>
                    {multa.Nombre_Completo} · {multa.Matricula_Nomina}
                  </td>
                  <td>{FormatoMoneda(multa.Cantidad_a_Pagar)}</td>
                  <td>{FechaCorta(multa.Fecha_Multa)}</td>
                  <td>
                    <Insignia tono="advertencia">Pendiente de sincronizar</Insignia>
                  </td>
                </tr>
              ))}
              {pagos.map((pago) => (
                <tr key={pago.Folio}>
                  <td style={{ fontWeight: 700 }}>
                    {pago.Folio}
                    <span className="texto-nota" style={{ display: 'block' }}>
                      Multa {pago.Folio_Multa}
                    </span>
                  </td>
                  <td>
                    {pago.Lector} · {pago.Matricula}
                  </td>
                  <td>{FormatoMoneda(pago.Monto)}</td>
                  <td>
                    {FechaCorta(pago.Fecha_Pago)} · {pago.Fecha_Pago.slice(11, 16)}
                  </td>
                  <td>
                    <Insignia tono={pago.Estado.startsWith('Parcial') ? 'advertencia' : 'exito'}>
                      {pago.Estado}
                    </Insignia>
                  </td>
                </tr>
              ))}
              {!controlador.pendientes.length && !pagos.length && (
                <tr>
                  <td colSpan={5} className="tabla-vacia">
                    {controlador.matricula
                      ? `No hay pagos de ${controlador.matricula} en este periodo.`
                      : datos.pagos.length
                        ? 'No hay pagos en este periodo.'
                        : 'Tesorería todavía no ha registrado pagos de multas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Tarjeta>
      )}
      {datos && !datos.disponible && (
        <div className="margen-arriba-16">
          <Boton icono={RotateCcw} onClick={controlador.Reintentar} disabled={controlador.cargando}>
            {controlador.cargando ? 'Reintentando…' : 'Reintentar ahora'}
          </Boton>
        </div>
      )}
    </Pagina>
  );
}
