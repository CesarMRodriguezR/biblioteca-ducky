/*
 * ******************************************************************
 * Nombre del programa: BD-SP03 · Circulacion.jsx
 * Función: Componentes que comparten las pantallas de préstamos, devoluciones y multas:
 *          indicadores, accesos, búsqueda por matrícula, vista previa de impresión y los
 *          documentos imprimibles (recibo, multa y lista de deudores).
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Props de cada componente
 * Salida: Elementos JSX
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente          Objetivo
 *     TarjetaIndicador    Tarjeta con un número, su etiqueta y una insignia
 *     TarjetaAccion       Acceso a una función con ícono, texto y flecha
 *     BuscadorMatricula   Tarjeta para buscar a un lector por matrícula o nómina
 *     TablaPendientes     Préstamos pendientes del lector con una acción por renglón
 *     ModalDocumento      Vista previa de impresión con Imprimir y Descargar PDF
 *     DocumentoRecibo     Recibo de préstamo para mostrar o imprimir
 *     EntregaRecibo       Botones para imprimir el recibo o enviarlo por correo o WhatsApp
 *     DocumentoMulta      Comprobante de multa para imprimir
 *     DocumentoDeudores   Lista de alumnos deudores para imprimir
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vistas del patrón MVC: solo muestran lo que reciben; nunca llaman a la API.
 * (2) Lo que va dentro de .imprimible es lo único que sale al imprimir (estilos-globales.css,
 *     sección Impresión).
 * ******************************************************************
 */

import { ArrowRight, Download, Mail, MessageCircle, Printer } from 'lucide-react';
import {
  ESTADOS_PRESTAMO,
  FechaCorta,
  FechaLarga,
  FormatoMoneda,
  UbicacionTexto,
} from '../../modelos/dominio.js';
import { AlertaError, Boton, Cargando, DatoEtiquetado, Insignia, Modal, Tarjeta } from './interfaz.jsx';

/*
 * Componente: TarjetaIndicador
 * Objetivo: Tarjeta con un número, su etiqueta y una insignia (menús y detalle de usuario).
 * Uso: <TarjetaIndicador valor={…} etiqueta={…} icono={…} fondo={…} insignia={[tono, texto]} />
 */
export function TarjetaIndicador({ valor, etiqueta, icono: Icono, fondo = 'fondo-azul', insignia })
{
  return (
    <Tarjeta>
      <div className="fila espacio-16">
        <div className={`tarjeta-accion-icono ${fondo}`}>
          <Icono size={20} aria-hidden />
        </div>
        <div>
          <div className="indicador-valor">{valor}</div>
          <div className="indicador-etiqueta">{etiqueta}</div>
        </div>
      </div>
      {insignia && (
        <div className="margen-arriba-16">
          <Insignia tono={insignia[0]}>{insignia[1]}</Insignia>
        </div>
      )}
    </Tarjeta>
  );
}

/*
 * Componente: TarjetaAccion
 * Objetivo: Acceso a una función con ícono, título, texto y flecha.
 * Uso: <TarjetaAccion titulo={…} texto={…} icono={…} fondo={…} al_elegir={…} />
 */
export function TarjetaAccion({ titulo, texto, icono: Icono, fondo = 'fondo-azul', al_elegir })
{
  return (
    <button type="button" className="tarjeta tarjeta-accion" onClick={al_elegir}>
      <div className={`tarjeta-accion-icono ${fondo}`}>
        <Icono size={20} aria-hidden />
      </div>
      <div>
        <div className="tarjeta-accion-titulo">{titulo}</div>
        <p className="texto-nota margen-arriba-8" style={{ color: 'var(--texto-secundario)' }}>
          {texto}
        </p>
      </div>
      <ArrowRight className="tarjeta-accion-flecha" size={18} aria-hidden />
    </button>
  );
}

/*
 * Componente: BuscadorMatricula
 * Objetivo: Tarjeta para buscar a un lector por matrícula o número de nómina, con título,
 *           subtítulo y contenido adicional debajo.
 * Uso: <BuscadorMatricula titulo={…} subtitulo={…} valor={…} al_cambio={…} al_buscar={…}
 *        buscando={…} etiqueta={…} ejemplo={…}>…</BuscadorMatricula>
 */
export function BuscadorMatricula({
  titulo,
  subtitulo,
  valor,
  al_cambio,
  al_buscar,
  buscando,
  etiqueta = 'Matrícula o no. de nómina',
  ejemplo = 'Ej. 3105842',
  children,
})
{
  return (
    <Tarjeta>
      {titulo && <h2 className="titulo-seccion">{titulo}</h2>}
      {subtitulo && <p className="texto-nota margen-arriba-4">{subtitulo}</p>}
      <form
        className={`fila espacio-12 fila-buscador ${titulo ? 'margen-arriba-16' : ''}`}
        onSubmit={(evento) =>
        {
          evento.preventDefault();
          al_buscar();
        }}
      >
        <div className="campo campo-buscador">
          <label className="campo-etiqueta" htmlFor="buscar-lector">
            {etiqueta}
          </label>
          <input
            id="buscar-lector"
            className="entrada"
            value={valor}
            placeholder={ejemplo}
            onChange={(evento) => al_cambio(evento.target.value)}
          />
        </div>
        <Boton type="submit" disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </Boton>
      </form>
      {children}
    </Tarjeta>
  );
}

/*
 * Componente: TablaPendientes
 * Objetivo: Préstamos pendientes del lector (a tiempo o con días de retraso) con un botón de
 *           acción por renglón.
 * Uso: <TablaPendientes prestamos={…} etiqueta_accion={…} al_elegir={…} elegido={…} />
 */
export function TablaPendientes({ prestamos, etiqueta_accion, al_elegir, elegido })
{
  return (
    <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
      <table className="tabla">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Libro · Copia</th>
            <th>Fecha de devolución</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {prestamos.map((prestamo) => (
            <tr key={prestamo.id_prestamo}>
              <td style={{ fontWeight: 700 }}>{prestamo.Folio}</td>
              <td>
                {prestamo.Titulo} · Copia {prestamo.num_copia}
              </td>
              <td>{FechaCorta(prestamo.Fecha_Entrega_Programada)}</td>
              <td>
                {prestamo.Estado !== 'Activo' ? (
                  <Insignia tono={ESTADOS_PRESTAMO[prestamo.Estado_Visible]}>
                    {prestamo.Estado_Visible}
                  </Insignia>
                ) : (
                  <Insignia tono={prestamo.Dias_Retraso > 0 ? 'error' : 'exito'}>
                    {prestamo.Dias_Retraso > 0
                      ? `${prestamo.Dias_Retraso} días de retraso`
                      : 'A tiempo'}
                  </Insignia>
                )}
              </td>
              <td>
                <Boton
                  variante={elegido === prestamo.id_prestamo ? 'primario' : 'secundario'}
                  chico
                  onClick={() => al_elegir(prestamo)}
                >
                  {etiqueta_accion}
                </Boton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tarjeta>
  );
}

/*
 * Componente: ModalDocumento
 * Objetivo: Vista previa de impresión de un documento con Imprimir y Descargar PDF (el mismo
 *           patrón que la vista previa del listado de libros).
 * Uso: <ModalDocumento titulo={…} al_cerrar={…} al_imprimir={…} al_descargar={…}
 *        descargando={…} cargando={…} error={…}>…</ModalDocumento>
 */
export function ModalDocumento({
  titulo,
  al_cerrar,
  al_imprimir,
  al_descargar,
  descargando,
  cargando,
  error,
  children,
})
{
  return (
    <Modal
      titulo={titulo}
      al_cerrar={al_cerrar}
      acciones={
        <div className="fila espacio-8">
          <Boton
            variante="secundario"
            chico
            icono={Download}
            onClick={al_descargar}
            disabled={cargando || descargando}
          >
            {descargando ? 'Generando…' : 'Descargar PDF'}
          </Boton>
          <Boton chico icono={Printer} onClick={al_imprimir} disabled={cargando}>
            Imprimir
          </Boton>
        </div>
      }
    >
      {cargando && <Cargando />}
      <AlertaError error={error} />
      {!cargando && <div className="imprimible documento">{children}</div>}
    </Modal>
  );
}

/*
 * Componente: DocumentoRecibo
 * Objetivo: Recibo de préstamo (BD-SP03-PL02) para mostrar en pantalla o imprimir.
 * Uso: <DocumentoRecibo recibo={…} />
 */
export function DocumentoRecibo({ recibo })
{
  return (
    <>
      <div className="fila entre">
        <div>
          <h3>Biblio · Universidad Ducky</h3>
          <p className="texto-nota margen-arriba-4">Recibo de préstamo No. {recibo.Folio}</p>
        </div>
        {recibo.Estado === 'Activo' ? (
          <Insignia tono="advertencia">En préstamo</Insignia>
        ) : (
          <Insignia tono={ESTADOS_PRESTAMO[recibo.Estado_Visible] ?? 'neutro'}>
            {recibo.Estado_Visible}
          </Insignia>
        )}
      </div>
      <div className="rejilla-3 margen-arriba-16">
        <DatoEtiquetado etiqueta="Lector" valor={recibo.Nombre_Completo} />
        <DatoEtiquetado etiqueta="Matrícula" valor={recibo.Matricula_Nomina} />
        <DatoEtiquetado etiqueta="Perfil" valor={recibo.Nombre_Rol} />
        <DatoEtiquetado etiqueta="Libro prestado" valor={recibo.Titulo} />
        <DatoEtiquetado etiqueta="Copia" valor={`Copia ${recibo.num_copia} · ISBN ${recibo.ISBN}`} />
        <DatoEtiquetado
          etiqueta="Ubicación"
          valor={UbicacionTexto(recibo.ubicacion ?? {}, null) || '—'}
        />
        <DatoEtiquetado etiqueta="Fecha de préstamo" valor={FechaLarga(recibo.Fecha_Prestamo)} />
        <DatoEtiquetado
          etiqueta="Fecha de devolución"
          valor={FechaLarga(recibo.Fecha_Entrega_Programada)}
        />
        <DatoEtiquetado etiqueta="Atendió" valor={recibo.Atendio} />
      </div>
      <p className="texto-nota margen-arriba-16">{recibo.Nota}</p>
    </>
  );
}

/*
 * Componente: EntregaRecibo
 * Objetivo: Tarjeta con los medios de entrega del recibo: imprimir (medio predeterminado),
 *           correo y WhatsApp.
 * Uso: <EntregaRecibo al_imprimir={…} al_enviar_correo={…} al_enviar_whatsapp={…} />
 */
export function EntregaRecibo({ al_imprimir, al_enviar_correo, al_enviar_whatsapp })
{
  return (
    <Tarjeta className="margen-arriba-16">
      <h2 className="titulo-seccion">Entrega del recibo · Medio predeterminado: Imprimir</h2>
      <div className="fila espacio-12 margen-arriba-16">
        <Boton icono={Printer} onClick={al_imprimir}>
          Imprimir
        </Boton>
        <Boton variante="secundario" icono={Mail} onClick={al_enviar_correo}>
          Enviar por correo
        </Boton>
        <Boton variante="secundario" icono={MessageCircle} onClick={al_enviar_whatsapp}>
          Enviar por WhatsApp
        </Boton>
      </div>
    </Tarjeta>
  );
}

/*
 * Componente: DocumentoMulta
 * Objetivo: Comprobante de una multa (BD-SP03-DL02) para imprimir.
 * Uso: <DocumentoMulta multa={…} />
 */
export function DocumentoMulta({ multa })
{
  return (
    <>
      <div className="fila entre">
        <div>
          <h3>Biblio · Universidad Ducky</h3>
          <p className="texto-nota margen-arriba-4">Multa {multa.Folio}</p>
        </div>
        <Insignia tono={multa.Estado === 'Pagada' ? 'exito' : 'advertencia'}>
          {multa.Estado}
        </Insignia>
      </div>
      <div className="rejilla-3 margen-arriba-16">
        <DatoEtiquetado etiqueta="Lector" valor={multa.Nombre_Completo} />
        <DatoEtiquetado etiqueta="Matrícula" valor={multa.Matricula_Nomina} />
        <DatoEtiquetado etiqueta="Perfil" valor={multa.Nombre_Rol} />
        <DatoEtiquetado etiqueta="Motivo" valor={multa.Motivo} />
        <DatoEtiquetado etiqueta="Monto de la multa" valor={FormatoMoneda(multa.Cantidad_a_Pagar)} />
        <DatoEtiquetado etiqueta="Fecha" valor={FechaCorta(multa.Fecha_Multa)} />
        <DatoEtiquetado etiqueta="Préstamo" valor={multa.Folio_Prestamo ?? '—'} />
        <DatoEtiquetado
          etiqueta="Libro"
          valor={multa.Titulo ? `${multa.Titulo} · Copia ${multa.num_copia}` : '—'}
        />
        <DatoEtiquetado etiqueta="Fecha de pago" valor={FechaCorta(multa.Fecha_Pagado)} />
      </div>
      <p className="texto-nota margen-arriba-16">Justificación: {multa.Justificacion}</p>
      <p className="texto-nota margen-arriba-8">
        La multa se paga en Tesorería; el pago se refleja en Biblio en cuanto Tesorería lo registra.
      </p>
    </>
  );
}

/*
 * Componente: DocumentoDeudores
 * Objetivo: Lista de alumnos deudores (BD-SP03-DL06) para imprimir.
 * Uso: <DocumentoDeudores lista={…} />
 */
export function DocumentoDeudores({ lista })
{
  return (
    <>
      <div className="fila entre">
        <h3>Biblio · Universidad Ducky</h3>
        <span className="texto-nota">
          Generado el {FechaCorta(lista.generado_el.slice(0, 10))} ·{' '}
          {new Date(lista.generado_el).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <h2 className="margen-arriba-16">Lista de alumnos deudores</h2>
      <p className="texto-nota margen-arriba-4">Periodo de exámenes: {lista.periodo}</p>
      <table className="tabla tabla-compacta margen-arriba-16">
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Alumno</th>
            <th>Libros sin devolver</th>
            <th>Multas pendientes</th>
            <th>Total adeudo</th>
          </tr>
        </thead>
        <tbody>
          {lista.datos.map((alumno) => (
            <tr key={alumno.Matricula_Nomina}>
              <td style={{ fontWeight: 700 }}>{alumno.Matricula_Nomina}</td>
              <td>{alumno.Nombre_Completo}</td>
              <td>{alumno.Libros_Sin_Devolver}</td>
              <td>{alumno.Multas_Pendientes}</td>
              <td>{FormatoMoneda(alumno.Total_Adeudo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="margen-arriba-16" style={{ fontWeight: 700 }}>
        {lista.datos.length} {lista.datos.length === 1 ? 'alumno deudor' : 'alumnos deudores'} ·
        Total pendiente: {FormatoMoneda(lista.total_adeudo)}
      </p>
      <p className="texto-nota margen-arriba-8">
        Los alumnos de esta lista no podrán presentar exámenes hasta liquidar sus adeudos.
      </p>
    </>
  );
}
