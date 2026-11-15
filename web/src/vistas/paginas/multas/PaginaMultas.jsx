/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · PaginaMultas.jsx
 * Función: Menú Multas y adeudos: indicadores, accesos y multas recientes.
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
 *     Componente     Objetivo
 *     ACCIONES       Accesos del menú Multas y adeudos
 *     PaginaMultas   Menú Multas y adeudos
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { CircleAlert, CircleDollarSign, FileText, Landmark, ListChecks, Users } from 'lucide-react';
import { useControladorMenuMultas } from '../../../controladores/ControladorDevoluciones.js';
import { ESTADOS_MULTA, FormatoMoneda } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { AlertaError, Cargando, Insignia, Tarjeta } from '../../componentes/interfaz.jsx';
import { TarjetaAccion, TarjetaIndicador } from '../../componentes/Circulacion.jsx';

/*
 * Constante: ACCIONES
 * Objetivo: Accesos del menú Multas y adeudos.
 */
const ACCIONES = [
  {
    titulo: 'Pagos de Tesorería',
    texto: 'Pagos recibidos automáticamente de Tesorería',
    icono: Landmark,
    fondo: 'fondo-azul',
    ruta: '/multas/pagos',
  },
  {
    titulo: 'Consultar multas y adeudos',
    texto: 'Revisa lo que debe un usuario',
    icono: Users,
    fondo: 'fondo-dorado',
    ruta: '/multas/adeudos',
  },
  {
    titulo: 'Generar multa',
    texto: 'Por entrega extemporánea, daño o pérdida',
    icono: CircleAlert,
    fondo: 'fondo-brillante',
    ruta: '/multas/generar',
  },
  {
    titulo: 'Lista de alumnos deudores',
    texto: 'Para el periodo de exámenes',
    icono: ListChecks,
    fondo: 'fondo-azul',
    ruta: '/multas/deudores',
  },
];

/*
 * Componente: PaginaMultas
 * Objetivo: Menú Multas y adeudos con indicadores, accesos y multas recientes.
 * Uso: <PaginaMultas />
 */
export function PaginaMultas()
{
  const controlador = useControladorMenuMultas();
  const resumen = controlador.resumen;

  return (
    <Pagina miga="Multas y adeudos" titulo="Multas y adeudos">
      <AlertaError error={controlador.error} />
      {controlador.cargando && !resumen && <Cargando />}
      {resumen && (
        <div className="rejilla-4">
          <TarjetaIndicador
            valor={FormatoMoneda(resumen.monto_pendiente)}
            etiqueta="Multas pendientes"
            icono={CircleDollarSign}
            insignia={['advertencia', `${resumen.pendientes} ${resumen.pendientes === 1 ? 'multa' : 'multas'}`]}
          />
          <TarjetaIndicador
            valor={resumen.este_mes}
            etiqueta="Multas este mes"
            icono={FileText}
            fondo="fondo-dorado"
            insignia={['informacion', 'Generadas']}
          />
          <TarjetaIndicador
            valor={resumen.pagos_mes}
            etiqueta="Pagos registrados"
            icono={Landmark}
            fondo="fondo-brillante"
            insignia={['exito', 'Este mes']}
          />
          <TarjetaIndicador
            valor={resumen.deudores}
            etiqueta="Alumnos deudores"
            icono={Users}
            insignia={['error', 'Con adeudo']}
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
          <h2 className="margen-arriba-32 margen-abajo-16">Multas recientes</h2>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Lector</th>
                  <th>Motivo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {resumen.recientes.map((multa) => (
                  <tr key={multa.id_multa}>
                    <td style={{ fontWeight: 700 }}>{multa.Folio}</td>
                    <td>{multa.Nombre_Completo}</td>
                    <td>{multa.Motivo}</td>
                    <td>{FormatoMoneda(multa.Cantidad_a_Pagar)}</td>
                    <td>
                      <Insignia tono={ESTADOS_MULTA[multa.Estado]}>{multa.Estado}</Insignia>
                    </td>
                  </tr>
                ))}
                {!resumen.recientes.length && (
                  <tr>
                    <td colSpan={5} className="tabla-vacia">
                      No hay multas registradas.
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
