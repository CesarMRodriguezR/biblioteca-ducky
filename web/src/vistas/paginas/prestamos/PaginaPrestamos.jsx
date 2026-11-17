/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · PaginaPrestamos.jsx
 * Función: Menú Préstamos: indicadores del mostrador, accesos a cada función y últimos
 *          préstamos.
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
 *     Componente        Objetivo
 *     ACCIONES          Accesos del menú Préstamos
 *     PaginaPrestamos   Menú Préstamos
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

import { CalendarCheck, Clock, FileText, ReceiptText, RefreshCw, UserRoundSearch } from 'lucide-react';
import { useControladorMenuPrestamos } from '../../../controladores/ControladorPrestamos.js';
import { ESTADOS_PRESTAMO, FechaCorta } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { AlertaError, Cargando, Insignia, Tarjeta } from '../../componentes/interfaz.jsx';
import { TarjetaAccion, TarjetaIndicador } from '../../componentes/Circulacion.jsx';

/*
 * Constante: ACCIONES
 * Objetivo: Accesos del menú Préstamos.
 */
const ACCIONES = [
  {
    titulo: 'Registrar préstamo',
    texto: 'Presta un libro al lector que lo pide en mostrador',
    icono: FileText,
    fondo: 'fondo-azul',
    ruta: '/prestamos/registro',
  },
  {
    titulo: 'Recibo de préstamo',
    texto: 'Genera o reimprime el recibo de un préstamo',
    icono: ReceiptText,
    fondo: 'fondo-dorado',
    ruta: '/prestamos/recibos',
  },
  {
    titulo: 'Renovar préstamo',
    texto: 'Renueva un préstamo según las reglas de la biblioteca',
    icono: RefreshCw,
    fondo: 'fondo-brillante',
    ruta: '/prestamos/renovacion',
  },
  {
    titulo: 'Préstamos de un usuario',
    texto: 'Consulta los préstamos activos y el historial',
    icono: UserRoundSearch,
    fondo: 'fondo-azul',
    ruta: '/prestamos/usuario',
  },
  {
    titulo: 'Lista de espera',
    texto: 'Registra, consulta o quita lectores de la lista',
    icono: Clock,
    fondo: 'fondo-dorado',
    ruta: '/prestamos/lista-espera',
  },
];

/*
 * Componente: PaginaPrestamos
 * Objetivo: Menú Préstamos con indicadores, accesos y últimos préstamos.
 * Uso: <PaginaPrestamos />
 */
export function PaginaPrestamos()
{
  const controlador = useControladorMenuPrestamos();
  const resumen = controlador.resumen;

  return (
    <Pagina miga="Préstamos" titulo="Préstamos">
      <AlertaError error={controlador.error} />
      {controlador.cargando && !resumen && <Cargando />}
      {resumen && (
        <div className="rejilla-4">
          <TarjetaIndicador
            valor={resumen.activos}
            etiqueta="Préstamos activos"
            icono={FileText}
            insignia={['informacion', `${resumen.nuevos_hoy} nuevos hoy`]}
          />
          <TarjetaIndicador
            valor={resumen.vencen_semana}
            etiqueta="Vencen esta semana"
            icono={CalendarCheck}
            insignia={['advertencia', 'Por vencer']}
          />
          <TarjetaIndicador
            valor={resumen.vencidos}
            etiqueta="Préstamos vencidos"
            icono={Clock}
            insignia={['error', 'Requieren seguimiento']}
          />
          <TarjetaIndicador
            valor={resumen.en_espera}
            etiqueta="En lista de espera"
            icono={UserRoundSearch}
            insignia={[
              'informacion',
              `${resumen.libros_en_espera} ${resumen.libros_en_espera === 1 ? 'libro' : 'libros'}`,
            ]}
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
          <h2 className="margen-arriba-32 margen-abajo-16">Últimos préstamos</h2>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Lector</th>
                  <th>Libro · Copia</th>
                  <th>Devolución</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {resumen.ultimos.map((prestamo) => (
                  <tr key={prestamo.id_prestamo}>
                    <td style={{ fontWeight: 700 }}>{prestamo.Folio}</td>
                    <td>{prestamo.Nombre_Completo}</td>
                    <td>
                      {prestamo.Titulo} · Copia {prestamo.num_copia}
                    </td>
                    <td>{FechaCorta(prestamo.Fecha_Entrega_Programada)}</td>
                    <td>
                      <Insignia tono={ESTADOS_PRESTAMO[prestamo.Estado_Visible]}>
                        {prestamo.Estado_Visible}
                      </Insignia>
                    </td>
                  </tr>
                ))}
                {!resumen.ultimos.length && (
                  <tr>
                    <td colSpan={5} className="tabla-vacia">
                      No hay préstamos activos.
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
