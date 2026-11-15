/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL01 · PaginaRegistrarDevolucion.jsx
 * Función: Registrar la devolución de un préstamo: préstamos pendientes del lector, retraso,
 *          multa y aviso de la lista de espera.
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
 *     Componente                  Objetivo
 *     PaginaRegistrarDevolucion   BD-SP03-DL01 Registrar devolución
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { CircleAlert, Clock, RefreshCw } from 'lucide-react';
import { useControladorRegistrarDevolucion } from '../../../controladores/ControladorDevoluciones.js';
import {
  CONDICIONES_LIBRO,
  FechaCorta,
  FormatoMoneda,
  HoyIso,
} from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  Boton,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Selector,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import {
  BuscadorMatricula,
  DocumentoMulta,
  ModalDocumento,
  TablaPendientes,
} from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaRegistrarDevolucion
 * Objetivo: BD-SP03-DL01 Registrar devolución (a tiempo, extemporánea con multa, usuario no
 *           registrado y lector sin préstamos pendientes).
 * Uso: <PaginaRegistrarDevolucion />
 */
export function PaginaRegistrarDevolucion()
{
  const controlador = useControladorRegistrarDevolucion();
  const { lector, seleccionado, resultado, vista } = controlador;
  const situacion = lector.situacion;
  const retraso = seleccionado?.Dias_Retraso ?? 0;

  return (
    <Pagina miga="Devoluciones · Registro" titulo="Registrar devolución" ancho={1000}>
      <EnlaceVolver to="/devoluciones">Volver a Devoluciones</EnlaceVolver>
      <BuscadorMatricula
        titulo="Préstamo a devolver"
        subtitulo={
          situacion && situacion.activos.length
            ? `${situacion.lector.Nombre_Completo} · ${situacion.lector.Nombre_Rol} · ` +
              `${situacion.activos.length} ${situacion.activos.length === 1 ? 'préstamo pendiente' : 'préstamos pendientes'}`
            : null
        }
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
      {situacion && !controlador.pendientes.length && !resultado && (
        <div className="margen-arriba-16">
          <Alerta
            tipo="informacion"
            titulo={`${situacion.lector.Nombre_Completo} no tiene préstamos pendientes`}
          >
            No hay libros por devolver.
          </Alerta>
        </div>
      )}
      {!seleccionado && controlador.pendientes.length > 0 && (
        <>
          <h2 className="margen-arriba-24">Préstamos pendientes</h2>
          <TablaPendientes
            prestamos={controlador.pendientes}
            etiqueta_accion="Devolver"
            al_elegir={controlador.Elegir}
          />
        </>
      )}

      {seleccionado && (
        <Tarjeta className="margen-arriba-16">
          <h2 className="titulo-seccion">
            {seleccionado.Titulo} · Copia {seleccionado.num_copia}
          </h2>
          <p className="texto-nota margen-arriba-4">
            Prestado a {seleccionado.Nombre_Completo} ({seleccionado.Nombre_Rol} ·{' '}
            {seleccionado.Matricula_Nomina})
          </p>
          <div className="rejilla-4 margen-arriba-16">
            <DatoEtiquetado etiqueta="Fecha de préstamo" valor={FechaCorta(seleccionado.Fecha_Prestamo)} />
            <DatoEtiquetado
              etiqueta="Devolución programada"
              valor={FechaCorta(seleccionado.Fecha_Entrega_Programada)}
            />
            <DatoEtiquetado etiqueta="Devolución real" valor={FechaCorta(HoyIso())} />
            <DatoEtiquetado
              etiqueta={retraso > 0 ? `Multa (${retraso} × $10.00)` : 'Días de retraso'}
              valor={retraso > 0 ? FormatoMoneda(retraso * 10) : 0}
            />
          </div>
          {retraso > 0 && (
            <div className="margen-arriba-16">
              <Insignia tono="error">Entrega extemporánea · {retraso} días de retraso</Insignia>
            </div>
          )}
          <Selector
            className="margen-arriba-16 campo-angosto"
            etiqueta="Condición del libro al recibirlo"
            value={controlador.condicion}
            onChange={(evento) => controlador.SetCondicion(evento.target.value)}
            opciones={CONDICIONES_LIBRO}
            disabled={Boolean(resultado)}
          />
        </Tarjeta>
      )}

      {controlador.aviso && (
        <div className="margen-arriba-16">
          <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
            {controlador.aviso.texto}
          </Alerta>
        </div>
      )}

      {resultado && (
        <>
          <div className="margen-arriba-16">
            {resultado.multa ? (
              <Alerta tipo="advertencia" titulo="Devolución registrada con multa">
                Se generó la multa {resultado.multa.Folio} por{' '}
                {FormatoMoneda(resultado.multa.Cantidad_a_Pagar)} por {resultado.dias_retraso} días
                de retraso. Debe pagarse en Tesorería.
              </Alerta>
            ) : (
              <Alerta tipo="exito" titulo="Devolución registrada">
                La copia {seleccionado.num_copia} ya está disponible en el catálogo. No se generó
                multa.
              </Alerta>
            )}
          </div>
          {resultado.condicion === 'Dañado' && (
            <div className="margen-arriba-16">
              <Alerta tipo="advertencia" titulo="El libro se recibió dañado">
                Genera la multa por daño con su justificación en Multas y adeudos.
              </Alerta>
            </div>
          )}
          {resultado.lista_espera.total > 0 && (
            <div className="margen-arriba-16">
              <Alerta
                tipo="informacion"
                titulo={`Hay ${resultado.lista_espera.total} ${resultado.lista_espera.total === 1 ? 'lector' : 'lectores'} en la lista de espera de este libro`}
              >
                {resultado.lista_espera.primero} tiene prioridad porque fue el primero en
                registrarse.
              </Alerta>
            </div>
          )}
        </>
      )}

      <div className="fila espacio-12 margen-arriba-24">
        {seleccionado && !resultado && (
          <>
            <Boton
              icono={RefreshCw}
              onClick={controlador.Registrar}
              disabled={controlador.enviando}
            >
              {controlador.enviando ? 'Registrando…' : 'Registrar devolución'}
            </Boton>
            <Boton variante="texto" onClick={controlador.Cancelar}>
              Cancelar
            </Boton>
          </>
        )}
        {resultado && (
          <>
            {resultado.multa && (
              <Boton variante="secundario" icono={CircleAlert} onClick={controlador.VerMulta}>
                Ver multa
              </Boton>
            )}
            {resultado.condicion === 'Dañado' && (
              <Boton variante="secundario" icono={CircleAlert} onClick={controlador.MultaPorDano}>
                Generar multa por daño
              </Boton>
            )}
            {resultado.lista_espera.total > 0 && controlador.puede_prestar && (
              <Boton variante="texto" icono={Clock} onClick={controlador.VerListaEspera}>
                Ver lista de espera
              </Boton>
            )}
            <Boton variante="texto" onClick={controlador.Reiniciar}>
              Registrar otra devolución
            </Boton>
          </>
        )}
      </div>

      {vista.abierta && (
        <ModalDocumento
          titulo="Vista previa de la multa"
          al_cerrar={vista.Cerrar}
          al_imprimir={vista.Imprimir}
          al_descargar={vista.Descargar}
          descargando={vista.descargando}
          cargando={vista.cargando}
          error={vista.error}
        >
          {vista.datos && <DocumentoMulta multa={vista.datos} />}
        </ModalDocumento>
      )}
    </Pagina>
  );
}
