/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL04 · PaginaAdeudosUsuario.jsx
 * Función: Multas y libros sin devolver de un usuario.
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
 *     TablaMultas            Multas con motivo, préstamo, monto y pago
 *     PaginaAdeudosUsuario   BD-SP03-DL04 Multas y adeudos del usuario
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { useControladorAdeudos } from '../../../controladores/ControladorDevoluciones.js';
import { ESTADOS_MULTA, FechaCorta, FormatoMoneda } from '../../../modelos/dominio.js';
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
 * Componente: TablaMultas
 * Objetivo: Multas con motivo, préstamo, monto y estado; las pendientes muestran la fecha de la
 *           multa y las pagadas la fecha de pago.
 * Uso: <TablaMultas multas={…} pagadas />
 */
function TablaMultas({ multas, pagadas = false })
{
  return (
    <Tarjeta relleno={false} className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Motivo</th>
            <th>Préstamo</th>
            {!pagadas && <th>Fecha</th>}
            <th>Monto</th>
            {pagadas && <th>Fecha pagado</th>}
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {multas.map((multa) => (
            <tr key={multa.id_multa}>
              <td style={{ fontWeight: 700 }}>{multa.Folio}</td>
              <td>{multa.Motivo}</td>
              <td>{multa.Folio_Prestamo ?? '—'}</td>
              {!pagadas && <td>{FechaCorta(multa.Fecha_Multa)}</td>}
              <td>{FormatoMoneda(multa.Cantidad_a_Pagar)}</td>
              {pagadas && <td>{FechaCorta(multa.Fecha_Pagado)}</td>}
              <td>
                <Insignia tono={ESTADOS_MULTA[multa.Estado]}>{multa.Estado}</Insignia>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tarjeta>
  );
}

/*
 * Componente: PaginaAdeudosUsuario
 * Objetivo: BD-SP03-DL04 Multas y adeudos del usuario (con adeudos, sin adeudos y usuario
 *           inactivo o no registrado).
 * Uso: <PaginaAdeudosUsuario />
 */
export function PaginaAdeudosUsuario()
{
  const controlador = useControladorAdeudos();
  const { lector, situacion } = controlador;

  return (
    <Pagina miga="Multas y adeudos · Consulta" titulo="Multas y adeudos del usuario">
      <EnlaceVolver to="/multas">Volver a Multas y adeudos</EnlaceVolver>
      <BuscadorMatricula
        ejemplo="Ej. 3109921"
        valor={lector.matricula}
        al_cambio={lector.SetMatricula}
        al_buscar={lector.Buscar}
        buscando={lector.buscando}
      >
        {situacion && (
          <div className="rejilla-4 margen-arriba-16">
            <DatoEtiquetado etiqueta="Lector" valor={situacion.lector.Nombre_Completo} />
            <DatoEtiquetado etiqueta="Perfil" valor={situacion.lector.Nombre_Rol} />
            <DatoEtiquetado
              etiqueta="Total pendiente"
              valor={FormatoMoneda(situacion.resumen.Multas_Pendientes)}
            />
            <DatoEtiquetado etiqueta="Libros sin devolver" valor={controlador.sin_devolver.length} />
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
      {controlador.inactivo && (
        <div className="margen-arriba-16">
          <Alerta tipo="error" titulo={`El usuario ${lector.situacion.lector.Matricula_Nomina} está inactivo`}>
            No se pueden consultar sus multas y adeudos.
          </Alerta>
        </div>
      )}

      {situacion && controlador.con_adeudos && (
        <>
          <h2 className="margen-arriba-24 margen-abajo-16">Multas pendientes</h2>
          {controlador.pendientes.length ? (
            <TablaMultas multas={controlador.pendientes} />
          ) : (
            <p className="texto-nota">No tiene multas pendientes.</p>
          )}
          {controlador.sin_devolver.length > 0 && (
            <>
              <h2 className="margen-arriba-24 margen-abajo-16">Libros sin devolver</h2>
              <Tarjeta relleno={false} className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Libro · Copia</th>
                      <th>Fecha de devolución</th>
                      <th>Días de retraso</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controlador.sin_devolver.map((prestamo) => (
                      <tr key={prestamo.id_prestamo}>
                        <td style={{ fontWeight: 700 }}>{prestamo.Folio}</td>
                        <td>
                          {prestamo.Titulo} · Copia {prestamo.num_copia}
                        </td>
                        <td>{FechaCorta(prestamo.Fecha_Entrega_Programada)}</td>
                        <td>{prestamo.Dias_Retraso}</td>
                        <td>
                          <Insignia tono="error">Vencido</Insignia>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tarjeta>
            </>
          )}
          {controlador.pagadas.length > 0 && (
            <>
              <h2 className="margen-arriba-24 margen-abajo-16">Historial de multas pagadas</h2>
              <TablaMultas multas={controlador.pagadas} pagadas />
            </>
          )}
        </>
      )}

      {situacion && !controlador.con_adeudos && (
        <>
          <div className="margen-arriba-16">
            <Alerta tipo="exito" titulo={`${situacion.lector.Nombre_Completo} no tiene adeudos`}>
              No tiene multas pendientes ni libros sin devolver.
            </Alerta>
          </div>
          {controlador.pagadas.length > 0 && (
            <>
              <h2 className="margen-arriba-24 margen-abajo-16">Historial de multas pagadas</h2>
              <TablaMultas multas={controlador.pagadas} pagadas />
            </>
          )}
        </>
      )}
    </Pagina>
  );
}
