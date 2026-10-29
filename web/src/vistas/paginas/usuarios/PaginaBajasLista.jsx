/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaBajasLista.jsx
 * Función: Baja de cuentas que ya no aparecen en CIAA (alumnos) ni en Empleados.
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
 *     TablaUsuarios      Tabla de usuarios con su motivo de baja o rechazo
 *     PaginaBajasLista   BD-SP01-GU02 Baja de cuentas (revisión, versión exitosa y…
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

import { UserX } from 'lucide-react';
import { useControladorBajasLista } from '../../../controladores/ControladorUsuarios.js';
import { TONOS_PERFIL, FormatoMoneda } from '../../../modelos/dominio.js';
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
 * Componente: TablaUsuarios
 * Objetivo: Tabla de usuarios con su motivo de baja o rechazo.
 * Uso: <TablaUsuarios filas={…} con_motivo={…} />
 */
function TablaUsuarios({ filas, con_motivo })
{
  return (
    <Tarjeta relleno={false} className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Matrícula / No. de nómina</th>
            <th>Perfil</th>
            <th>Libros prestados</th>
            <th>Multas pendientes</th>
            <th>{con_motivo ? 'Motivo' : 'Estatus'}</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id_usuario}>
              <td style={{ fontWeight: 700 }}>{fila.Nombre_Usuario}</td>
              <td>{fila.Matricula_Nomina}</td>
              <td>
                <Insignia tono={TONOS_PERFIL[fila.Nombre_Rol]}>{fila.Nombre_Rol}</Insignia>
              </td>
              <td>{fila.Libros_Prestados}</td>
              <td>{fila.Multas_Pendientes > 0 ? FormatoMoneda(fila.Multas_Pendientes) : '—'}</td>
              <td>
                {con_motivo ? (
                  <span style={{ color: 'var(--error)', fontWeight: 700 }}>{fila.Motivo}</span>
                ) : (
                  <Insignia tono={fila.Estatus === 'Inactivo' ? 'neutro' : 'exito'}>
                    {fila.Estatus}
                  </Insignia>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tarjeta>
  );
}

/*
 * Componente: PaginaBajasLista
 * Objetivo: BD-SP01-GU02 Baja de cuentas (revisión, versión exitosa y fallida).
 * Uso: <PaginaBajasLista />
 */
export function PaginaBajasLista()
{
  const controlador = useControladorBajasLista();
  const total = controlador.candidatos?.length ?? 0;

  return (
    <Pagina miga="Usuarios · Baja" titulo="Baja de cuentas">
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <AlertaError error={controlador.error} />

      {controlador.procesando && !controlador.candidatos && (
        <Cargando texto="Consultando CIAA y Empleados…" />
      )}

      {controlador.candidatos && !controlador.resultado && (
        <>
          <Tarjeta className="fila espacio-16 margen-abajo-16">
            <div
              style={{
                width: 36,
                height: 28,
                borderRadius: 14,
                background: 'var(--advertencia-fondo)',
                color: 'var(--advertencia)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <UserX size={16} aria-hidden />
            </div>
            <div>
              <strong>
                {total === 1 ? '1 usuario ya no aparece' : `${total} usuarios ya no aparecen`} en la
                nueva lista
              </strong>
              <p className="texto-nota">
                Ya no están inscritos en el CIAA ni activos en Empleados · por egreso o baja de la
                universidad
              </p>
            </div>
          </Tarjeta>
          {total > 0 ? (
            <>
              <TablaUsuarios filas={controlador.candidatos} />
              <p className="texto-nota margen-arriba-8">
                Las cuentas con libros prestados o multas pendientes no se darán de baja.
              </p>
              <Boton
                className="margen-arriba-16"
                onClick={controlador.ConfirmarBajas}
                disabled={controlador.procesando}
              >
                {controlador.procesando ? 'Procesando…' : 'Confirmar bajas'}
              </Boton>
            </>
          ) : (
            <Alerta
              tipo="exito"
              titulo="Todas las cuentas activas aparecen en CIAA o en Empleados."
            />
          )}
        </>
      )}

      {controlador.resultado && (
        <>
          {controlador.resultado.dados_de_baja.length > 0 && (
            <>
              <Alerta
                tipo="exito"
                titulo={`Se dieron de baja ${controlador.resultado.dados_de_baja.length} ${controlador.resultado.dados_de_baja.length === 1 ? 'cuenta' : 'cuentas'}.`}
              >
                Las cuentas quedaron inactivas y ya no pueden iniciar sesión.
              </Alerta>
              <div className="margen-arriba-16">
                <TablaUsuarios filas={controlador.resultado.dados_de_baja} />
              </div>
            </>
          )}
          {controlador.resultado.rechazados.length > 0 && (
            <>
              <div className="margen-arriba-24">
                <Alerta
                  tipo="error"
                  titulo={`${controlador.resultado.rechazados.length === 1 ? '1 cuenta no se dio' : `${controlador.resultado.rechazados.length} cuentas no se dieron`} de baja.`}
                >
                  Deben devolver sus libros y pagar sus multas antes de la baja.
                </Alerta>
              </div>
              <div className="margen-arriba-16">
                <TablaUsuarios filas={controlador.resultado.rechazados} con_motivo />
              </div>
            </>
          )}
        </>
      )}
    </Pagina>
  );
}
