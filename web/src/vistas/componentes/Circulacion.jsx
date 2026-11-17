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
 *     ModalDocumento      Vista previa de impresión con Imprimir y Guardar como PDF
 *     EncabezadoDocumento Sección, título, quién lo generó y folio de un recibo
 *     RenglonesDocumento  Renglones de etiqueta y valor de un recibo
 *     DocumentoRecibo     Recibo de préstamo para mostrar o imprimir
 *     EntregaRecibo       Medios de entrega del recibo: imprimir, correo o WhatsApp
 *     DocumentoMulta      Recibo de multa para imprimir
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

import { ArrowRight, FileText, Mail, MessageCircle } from 'lucide-react';
import {
  ESTADOS_PRESTAMO,
  FechaCorta,
  FechaLarga,
  FormatoMoneda,
  MEDIOS_ENTREGA,
  UbicacionTexto,
} from '../../modelos/dominio.js';
import { AlertaError, Boton, Cargando, Insignia, Modal, Tarjeta } from './interfaz.jsx';

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
 *           acción por renglón (con ícono opcional).
 * Uso: <TablaPendientes prestamos={…} etiqueta_accion={…} icono_accion={…} al_elegir={…}
 *        elegido={…} />
 */
export function TablaPendientes({ prestamos, etiqueta_accion, icono_accion, al_elegir, elegido })
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
                  icono={icono_accion}
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
 * Objetivo: Vista previa de impresión de un documento con Imprimir y Guardar como PDF (el mismo
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
          <Boton variante="secundario" chico onClick={al_imprimir} disabled={cargando}>
            Imprimir
          </Boton>
          <Boton chico onClick={al_descargar} disabled={cargando || descargando}>
            {descargando ? 'Generando…' : 'Guardar como PDF'}
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
 * Componente: EncabezadoDocumento
 * Objetivo: Encabezado de un recibo: sección, título y, a la derecha, quién lo generó y el folio.
 * Uso: <EncabezadoDocumento seccion={…} titulo={…} generado={…} folio={…} />
 */
export function EncabezadoDocumento({ seccion, titulo, generado, folio })
{
  return (
    <div className="documento-encabezado">
      <div>
        <div className="documento-seccion">{seccion}</div>
        <h3 className="documento-titulo">{titulo}</h3>
      </div>
      <div className="documento-generado">
        <div>{generado}</div>
        <div>
          <strong>Folio:</strong> {folio}
        </div>
      </div>
    </div>
  );
}

/*
 * Componente: RenglonesDocumento
 * Objetivo: Renglones de etiqueta y valor de un recibo; el tercer elemento resalta el valor.
 * Uso: <RenglonesDocumento renglones={[[etiqueta, valor, resaltado]]} />
 */
export function RenglonesDocumento({ renglones })
{
  return (
    <table className="documento-renglones">
      <tbody>
        {renglones.map(([etiqueta, valor, resaltado]) => (
          <tr key={etiqueta}>
            <th scope="row">{etiqueta}</th>
            <td style={resaltado ? { fontWeight: 700 } : undefined}>{valor ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/*
 * Componente: DocumentoRecibo
 * Objetivo: Recibo de préstamo (BD-SP03-PL02) para mostrar en pantalla o imprimir.
 * Uso: <DocumentoRecibo recibo={…} medio={…} />
 */
export function DocumentoRecibo({ recibo, medio = 'Imprimir' })
{
  return (
    <>
      <EncabezadoDocumento
        seccion="Biblioteca · Préstamos"
        titulo="Recibo de préstamo"
        generado={`Generado el ${FechaCorta(recibo.Fecha_Prestamo)} · ${recibo.Atendio}`}
        folio={recibo.Folio}
      />
      <RenglonesDocumento
        renglones={[
          ['Lector', recibo.Nombre_Completo],
          [recibo.Nombre_Rol === 'Alumno' ? 'Matrícula' : 'Matrícula / Nómina', recibo.Matricula_Nomina],
          ['Perfil', recibo.Nombre_Rol],
          ['Libro', recibo.Titulo, true],
          ['Copia', `Copia ${recibo.num_copia} · Consulta Externa`],
          ['ISBN', recibo.ISBN],
          ['Ubicación', UbicacionTexto(recibo.ubicacion ?? {}, null) || '—'],
          ['Fecha de préstamo', FechaLarga(recibo.Fecha_Prestamo)],
          ['Fecha de devolución', FechaLarga(recibo.Fecha_Entrega_Programada)],
          ['Entrega del recibo', MEDIOS_ENTREGA[medio]],
          ['Atendió', recibo.Atendio],
        ]}
      />
      <p className="texto-nota margen-arriba-12">{recibo.Nota}</p>
    </>
  );
}

/*
 * Componente: EntregaRecibo
 * Objetivo: Tarjeta con los medios de entrega del recibo: imprimir (medio predeterminado),
 *           correo y WhatsApp. El medio elegido se marca como botón principal.
 * Uso: <EntregaRecibo titulo={…} medio={…} al_imprimir={…} al_enviar_correo={…}
 *        al_enviar_whatsapp={…} />
 */
export function EntregaRecibo({
  titulo = 'Entrega del recibo',
  medio = 'Imprimir',
  al_imprimir,
  al_enviar_correo,
  al_enviar_whatsapp,
})
{
  const Variante = (opcion) => (medio === opcion ? 'primario' : 'secundario');
  return (
    <Tarjeta className="margen-arriba-16">
      <h2 className="titulo-seccion">{titulo}</h2>
      <p className="texto-nota margen-arriba-4">Medio predeterminado: Imprimir</p>
      <div className="fila espacio-12 margen-arriba-16">
        <Boton variante={Variante('Imprimir')} icono={FileText} onClick={al_imprimir}>
          Imprimir
        </Boton>
        <Boton variante={Variante('Correo')} icono={Mail} onClick={al_enviar_correo}>
          Enviar por correo
        </Boton>
        <Boton variante={Variante('WhatsApp')} icono={MessageCircle} onClick={al_enviar_whatsapp}>
          Enviar por WhatsApp
        </Boton>
      </div>
    </Tarjeta>
  );
}

/*
 * Componente: DocumentoMulta
 * Objetivo: Recibo de una multa (BD-SP03-DL02 y DL03) para mostrar o imprimir.
 * Uso: <DocumentoMulta multa={…} />
 */
export function DocumentoMulta({ multa })
{
  const perdida = multa.Motivo === 'Pérdida del libro';
  return (
    <>
      <EncabezadoDocumento
        seccion="Biblioteca · Multas"
        titulo="Recibo de multa"
        generado={`Generado el ${FechaCorta(multa.Fecha_Multa)} · ${multa.Atendio}`}
        folio={multa.Folio}
      />
      <RenglonesDocumento
        renglones={[
          ['Folio de multa', multa.Folio],
          ['Lector', multa.Nombre_Completo],
          [multa.Nombre_Rol === 'Alumno' ? 'Matrícula' : 'Matrícula / Nómina', multa.Matricula_Nomina],
          ['Perfil', multa.Nombre_Rol],
          ...(multa.Titulo
            ? [
              ['Libro', multa.Titulo, true],
              ['Copia', `Copia ${multa.num_copia}${perdida ? ' · marcada como Perdida' : ''}`],
            ]
            : []),
          ['Motivo', multa.Motivo],
          ...(perdida ? [] : [['Justificación', multa.Justificacion]]),
          ['Fecha', FechaCorta(multa.Fecha_Multa)],
          ...(perdida && multa.Precio
            ? [['Precio de última compra', `${FormatoMoneda(multa.Precio)} MXN`]]
            : []),
          ['Monto de la multa', `${FormatoMoneda(multa.Cantidad_a_Pagar)} MXN`, true],
          [
            'Estado',
            multa.Fecha_Pagado ? `Pagada el ${FechaCorta(multa.Fecha_Pagado)}` : 'Pendiente de pago',
          ],
          ['Atendió', multa.Atendio],
        ]}
      />
      <p className="texto-nota margen-arriba-12">{multa.Nota}</p>
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
