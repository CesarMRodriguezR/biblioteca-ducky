/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · PaginaDevoluciones.jsx
 * Función: Menú Devoluciones: indicadores del día, accesos y últimas devoluciones.
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
 *     Componente           Objetivo
 *     ACCIONES             Accesos del menú Devoluciones
 *     PaginaDevoluciones   Menú Devoluciones
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { BookX, CircleCheck, Clock, RefreshCw, TriangleAlert } from 'lucide-react';
import { useControladorMenuDevoluciones } from '../../../controladores/ControladorDevoluciones.js';
import { FechaCorta, RESULTADOS_DEVOLUCION } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { AlertaError, Cargando, Insignia, Tarjeta } from '../../componentes/interfaz.jsx';
import { TarjetaAccion, TarjetaIndicador } from '../../componentes/Circulacion.jsx';

/*
 * Constante: ACCIONES
 * Objetivo: Accesos del menú Devoluciones.
 */
const ACCIONES = [
  {
    titulo: 'Registrar devolución',
    texto: 'Recibe un libro prestado y cierra el préstamo',
    icono: RefreshCw,
    fondo: 'fondo-azul',
    ruta: '/devoluciones/registro',
  },
  {
    titulo: 'Reportar libro perdido',
    texto: 'Marca el ejemplar como perdido y avisa a Servicios Escolares y Tesorería',
    icono: BookX,
    fondo: 'fondo-dorado',
    ruta: '/devoluciones/perdido',
  },
  {
    titulo: 'Préstamos vencidos',
    texto: 'Revisa los préstamos que no se han devuelto',
    icono: Clock,
    fondo: 'fondo-brillante',
    ruta: '/devoluciones/vencidos',
  },
];

/*
 * Componente: PaginaDevoluciones
 * Objetivo: Menú Devoluciones con indicadores, accesos y últimas devoluciones.
 * Uso: <PaginaDevoluciones />
 */
export function PaginaDevoluciones()
{
  const controlador = useControladorMenuDevoluciones();
  const resumen = controlador.resumen;

  return (
    <Pagina miga="Devoluciones" titulo="Devoluciones">
      <AlertaError error={controlador.error} />
      {controlador.cargando && !resumen && <Cargando />}
      {resumen && (
        <div className="rejilla-4">
          <TarjetaIndicador
            valor={resumen.hoy}
            etiqueta="Devoluciones hoy"
            icono={RefreshCw}
            insignia={['informacion', 'Registradas']}
          />
          <TarjetaIndicador
            valor={resumen.a_tiempo}
            etiqueta="Entregadas a tiempo"
            icono={CircleCheck}
            fondo="fondo-brillante"
            insignia={['exito', 'Sin multa']}
          />
          <TarjetaIndicador
            valor={resumen.con_retraso}
            etiqueta="Con retraso"
            icono={TriangleAlert}
            fondo="fondo-dorado"
            insignia={['error', 'Multa generada']}
          />
          <TarjetaIndicador
            valor={resumen.perdidos_mes}
            etiqueta="Libros perdidos"
            icono={BookX}
            insignia={['neutro', 'Este mes']}
          />
        </div>
      )}

      <h2 className="margen-arriba-32 margen-abajo-16">¿Qué quieres hacer?</h2>
      <div className="rejilla-3">
        {ACCIONES.map((accion) => (
          <TarjetaAccion
            key={accion.titulo}
            {...accion}
            al_elegir={() => controlador.Ir(accion.ruta)}
          />
        ))}
      </div>

      {resumen && (
        <>
          <h2 className="margen-arriba-32 margen-abajo-16">Últimas devoluciones</h2>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Lector</th>
                  <th>Libro · Copia</th>
                  <th>Fecha</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {resumen.ultimas.map((movimiento) => (
                  <tr key={`${movimiento.id_prestamo}-${movimiento.Resultado}`}>
                    <td style={{ fontWeight: 700 }}>{movimiento.Folio}</td>
                    <td>{movimiento.Nombre_Completo}</td>
                    <td>
                      {movimiento.Titulo} · Copia {movimiento.num_copia}
                    </td>
                    <td>{FechaCorta(movimiento.Fecha)}</td>
                    <td>
                      <Insignia tono={RESULTADOS_DEVOLUCION[movimiento.Resultado]}>
                        {movimiento.Resultado}
                      </Insignia>
                    </td>
                  </tr>
                ))}
                {!resumen.ultimas.length && (
                  <tr>
                    <td colSpan={5} className="tabla-vacia">
                      Aún no hay devoluciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Tarjeta>
        </>
      )}
    </Pagina>
  );
}
