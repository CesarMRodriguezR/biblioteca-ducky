/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL02 · PaginaReimprimirRecibo.jsx
 * Función: Reimprimir el recibo de un préstamo activo del lector y entregarlo impreso (con
 *          vista previa), por correo o por WhatsApp.
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
 *     PaginaReimprimirRecibo   BD-SP03-PL02 Reimpresión del recibo de un préstamo
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { Printer } from 'lucide-react';
import { useControladorReimprimir } from '../../../controladores/ControladorPrestamos.js';
import { ESTADOS_PRESTAMO, FechaCorta } from '../../../modelos/dominio.js';
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
import {
  BuscadorMatricula,
  DocumentoRecibo,
  EntregaRecibo,
  ModalDocumento,
} from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaReimprimirRecibo
 * Objetivo: BD-SP03-PL02 Reimpresión del recibo (búsqueda, préstamos activos, recibo elegido
 *           con sus tres medios de entrega y lector sin préstamos activos).
 * Uso: <PaginaReimprimirRecibo />
 */
export function PaginaReimprimirRecibo()
{
  const controlador = useControladorReimprimir();
  const { lector, vista } = controlador;
  const situacion = lector.situacion;

  return (
    <Pagina miga="Préstamos · Recibo" titulo="Reimprimir recibo" ancho={1000}>
      <EnlaceVolver to="/prestamos">Volver a Préstamos</EnlaceVolver>
      <BuscadorMatricula
        titulo="Buscar préstamos activos del lector"
        valor={lector.matricula}
        al_cambio={lector.SetMatricula}
        al_buscar={controlador.Buscar}
        buscando={lector.buscando}
      />
      {lector.error && (
        <div className="margen-arriba-16">
          <Alerta tipo="error" titulo={lector.error.message}>
            Revisa la matrícula e intenta de nuevo.
          </Alerta>
        </div>
      )}
      {situacion && !controlador.activos.length && (
        <div className="margen-arriba-16">
          <Alerta
            tipo="informacion"
            titulo={`${situacion.lector.Nombre_Completo} no tiene préstamos activos`}
          >
            No hay recibos que reimprimir.
          </Alerta>
        </div>
      )}
      {controlador.activos.length > 0 && (
        <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
          <table className="tabla">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Lector</th>
                <th>Libro · Copia</th>
                <th>Devolución</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {controlador.activos.map((prestamo) => (
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
                  <td>
                    <Boton
                      variante={
                        controlador.recibo?.id_prestamo === prestamo.id_prestamo
                          ? 'primario'
                          : 'secundario'
                      }
                      chico
                      icono={Printer}
                      onClick={() => controlador.Reimprimir(prestamo)}
                    >
                      Reimprimir
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
      {controlador.cargando_recibo && <Cargando />}
      <AlertaError error={controlador.error_recibo} />
      {controlador.recibo && (
        <>
          <Tarjeta className="margen-arriba-16">
            <DocumentoRecibo recibo={controlador.recibo} />
          </Tarjeta>
          <EntregaRecibo
            al_imprimir={controlador.Imprimir}
            al_enviar_correo={controlador.EnviarCorreo}
            al_enviar_whatsapp={controlador.EnviarWhatsApp}
          />
        </>
      )}
      {controlador.aviso && (
        <div className="margen-arriba-16">
          <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
            {controlador.aviso.texto}
          </Alerta>
        </div>
      )}
      {vista.abierta && (
        <ModalDocumento
          titulo="Vista previa del recibo"
          al_cerrar={vista.Cerrar}
          al_imprimir={vista.Imprimir}
          al_descargar={vista.Descargar}
          descargando={vista.descargando}
          cargando={vista.cargando}
          error={vista.error}
        >
          {vista.datos && <DocumentoRecibo recibo={vista.datos} />}
        </ModalDocumento>
      )}
    </Pagina>
  );
}
