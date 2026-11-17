/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL02 · PaginaGenerarMulta.jsx
 * Función: Generar la multa de un préstamo por entrega extemporánea, daño o pérdida.
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
 *     PaginaGenerarMulta   BD-SP03-DL02 Generar multa
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { FileText } from 'lucide-react';
import { useControladorGenerarMulta } from '../../../controladores/ControladorDevoluciones.js';
import { FechaCorta, FormatoMoneda, HoyIso, MOTIVOS_MULTA } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AreaTexto,
  Boton,
  DatoEtiquetado,
  EnlaceVolver,
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
 * Componente: PaginaGenerarMulta
 * Objetivo: BD-SP03-DL02 Generar multa (préstamos del lector, campos vacíos, datos incompletos
 *           y multas por daño o pérdida).
 * Uso: <PaginaGenerarMulta />
 */
export function PaginaGenerarMulta()
{
  const controlador = useControladorGenerarMulta();
  const { lector, seleccionado, resultado, vista } = controlador;
  const situacion = lector.situacion;
  const generada = Boolean(resultado);
  const subtitulo = seleccionado
    ? `${seleccionado.Titulo} · Copia ${seleccionado.num_copia} · ${seleccionado.Nombre_Completo} ` +
      `(${seleccionado.Nombre_Rol} · ${seleccionado.Matricula_Nomina})`
    : situacion && controlador.pendientes.length
      ? `${situacion.lector.Nombre_Completo} · ${situacion.lector.Nombre_Rol} · ` +
        `${controlador.pendientes.length} ${controlador.pendientes.length === 1 ? 'préstamo pendiente' : 'préstamos pendientes'}`
      : null;

  return (
    <Pagina miga="Multas y adeudos · Generar" titulo="Generar multa" ancho={1000}>
      <EnlaceVolver to="/multas">Volver a Multas y adeudos</EnlaceVolver>
      <BuscadorMatricula
        titulo="Préstamo"
        subtitulo={subtitulo}
        ejemplo="Ej. 1987345"
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
      {situacion && !controlador.pendientes.length && (
        <div className="margen-arriba-16">
          <Alerta
            tipo="informacion"
            titulo={`${situacion.lector.Nombre_Completo} no tiene préstamos pendientes`}
          >
            Las multas se generan sobre un préstamo que todavía no se ha devuelto.
          </Alerta>
        </div>
      )}
      {!seleccionado && controlador.pendientes.length > 0 && (
        <>
          <h2 className="margen-arriba-24">Préstamos pendientes</h2>
          <TablaPendientes
            prestamos={controlador.pendientes}
            etiqueta_accion="Seleccionar"
            al_elegir={controlador.Elegir}
          />
        </>
      )}

      {seleccionado && (
        <Tarjeta className="margen-arriba-16">
          <h2 className="titulo-seccion">Datos de la multa</h2>
          <p className="texto-nota margen-arriba-4">
            {controlador.motivo === 'Pérdida del libro'
              ? 'La multa por reposición es igual al precio de la última compra del libro (en MXN)'
              : 'Motivos: entrega extemporánea, daño o pérdida del libro'}
          </p>
          <div className="rejilla-3 margen-arriba-16" style={{ alignItems: 'start' }}>
            <Selector
              etiqueta="Motivo"
              value={controlador.motivo}
              onChange={(evento) => controlador.SetMotivo(evento.target.value)}
              opciones={MOTIVOS_MULTA}
              disabled={generada}
            />
            <DatoEtiquetado
              etiqueta={
                controlador.motivo === 'Entrega extemporánea'
                  ? `Monto de la multa (${seleccionado.Dias_Retraso} × $10.00)`
                  : 'Monto de la multa'
              }
              valor={FormatoMoneda(resultado?.multa.Cantidad_a_Pagar ?? controlador.monto)}
            />
            <DatoEtiquetado etiqueta="Fecha" valor={FechaCorta(HoyIso())} />
          </div>
          <AreaTexto
            className="margen-arriba-16"
            etiqueta="Justificación"
            placeholder="Describe el motivo de la multa"
            rows={3}
            maxLength={150}
            value={controlador.justificacion}
            onChange={(evento) => controlador.SetJustificacion(evento.target.value)}
            error={controlador.errores.justificacion}
            disabled={generada}
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

      <div className="fila espacio-12 margen-arriba-24">
        {seleccionado && !generada && (
          <>
            <Boton icono={FileText} onClick={controlador.Generar} disabled={controlador.enviando}>
              {controlador.enviando ? 'Generando…' : 'Generar multa'}
            </Boton>
            <Boton variante="texto" onClick={controlador.Cancelar}>
              Cancelar
            </Boton>
          </>
        )}
        {generada && (
          <Boton icono={FileText} onClick={controlador.ImprimirMulta}>
            Imprimir multa
          </Boton>
        )}
      </div>

      {vista.abierta && (
        <ModalDocumento
          titulo="Vista previa del recibo de multa"
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
