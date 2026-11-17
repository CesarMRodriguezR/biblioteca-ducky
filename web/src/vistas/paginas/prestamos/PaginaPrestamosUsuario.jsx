/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL04 · PaginaPrestamosUsuario.jsx
 * Función: Préstamos activos e historial de un usuario, con el historial filtrado por estado.
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
 *     Componente               Objetivo
 *     TablaPrestamos           Tabla de préstamos con fechas y estado
 *     PaginaPrestamosUsuario   BD-SP03-PL04 Préstamos de un usuario
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { useControladorPrestamosUsuario } from '../../../controladores/ControladorPrestamos.js';
import { ESTADOS_PRESTAMO, FechaCorta } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import { BuscadorMatricula } from '../../componentes/Circulacion.jsx';

/*
 * Componente: TablaPrestamos
 * Objetivo: Tabla de préstamos con folio, libro, fechas y estado.
 * Uso: <TablaPrestamos prestamos={…} />
 */
function TablaPrestamos({ prestamos })
{
  return (
    <Tarjeta relleno={false} className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Libro · Copia</th>
            <th>Fecha de préstamo</th>
            <th>Fecha de devolución</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {prestamos.map((prestamo) => (
            <tr key={prestamo.id_prestamo}>
              <td style={{ fontWeight: 700 }}>{prestamo.Folio}</td>
              <td>
                {prestamo.Titulo} · Copia {prestamo.num_copia}
              </td>
              <td>{FechaCorta(prestamo.Fecha_Prestamo)}</td>
              <td>{FechaCorta(prestamo.Fecha_Devolucion ?? prestamo.Fecha_Entrega_Programada)}</td>
              <td>
                <Insignia tono={ESTADOS_PRESTAMO[prestamo.Estado_Visible]}>
                  {prestamo.Estado_Visible}
                </Insignia>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tarjeta>
  );
}

/*
 * Componente: PaginaPrestamosUsuario
 * Objetivo: BD-SP03-PL04 Préstamos de un usuario (con préstamos, sin préstamos y usuario no
 *           registrado).
 * Uso: <PaginaPrestamosUsuario />
 */
export function PaginaPrestamosUsuario()
{
  const controlador = useControladorPrestamosUsuario();
  const { lector, situacion } = controlador;

  return (
    <Pagina miga="Préstamos · Consulta" titulo="Préstamos del usuario">
      <EnlaceVolver to="/prestamos">Volver a Préstamos</EnlaceVolver>
      <BuscadorMatricula
        valor={lector.matricula}
        al_cambio={lector.SetMatricula}
        al_buscar={lector.Buscar}
        buscando={lector.buscando}
      >
        {situacion && (
          <div className="rejilla-4 margen-arriba-16">
            <DatoEtiquetado etiqueta="Lector" valor={situacion.lector.Nombre_Completo} />
            <DatoEtiquetado etiqueta="Perfil" valor={situacion.lector.Nombre_Rol} />
            <DatoEtiquetado etiqueta="Préstamos activos" valor={situacion.resumen.Prestamos_Activos} />
            <DatoEtiquetado etiqueta="Préstamos totales" valor={situacion.resumen.Prestamos_Totales} />
          </div>
        )}
      </BuscadorMatricula>
      {lector.error && (
        <div className="margen-arriba-16">
          <Alerta tipo="error" titulo={lector.error.message}>
            Revisa la matrícula e intenta de nuevo.
          </Alerta>
        </div>
      )}
      {situacion && !situacion.resumen.Prestamos_Totales && (
        <div className="margen-arriba-16">
          <Alerta
            tipo="informacion"
            titulo={`${situacion.lector.Nombre_Completo} no tiene préstamos registrados`}
          >
            No tiene préstamos activos ni historial.
          </Alerta>
        </div>
      )}
      {situacion && situacion.activos.length > 0 && (
        <>
          <h2 className="margen-arriba-24 margen-abajo-16">Préstamos activos</h2>
          <TablaPrestamos prestamos={situacion.activos} />
        </>
      )}
      {situacion && situacion.historial.length > 0 && (
        <>
          <h2 className="margen-arriba-24 margen-abajo-16">Historial</h2>
          <div className="filtros margen-abajo-16">
            {controlador.filtros.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                className={`filtro ${controlador.filtro === opcion.valor ? 'filtro-activo' : ''}`}
                onClick={() => controlador.SetFiltro(opcion.valor)}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
          {controlador.historial.length ? (
            <TablaPrestamos prestamos={controlador.historial} />
          ) : (
            <Tarjeta>
              <div className="tabla-vacia">
                No hay préstamos con estado «{controlador.filtro}» en el historial.
              </div>
            </Tarjeta>
          )}
        </>
      )}
    </Pagina>
  );
}
