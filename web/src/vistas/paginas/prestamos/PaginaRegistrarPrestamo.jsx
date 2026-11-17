/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL01 · PaginaRegistrarPrestamo.jsx
 * Función: Registrar préstamo: lector, libro y ejemplar, fechas del préstamo, medio de entrega
 *          del recibo, resultado y vista previa del recibo.
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
 *     Componente                Objetivo
 *     TablaCondiciones          Condiciones del lector con su resultado
 *     TablaCopias               Copias del libro y si se pueden prestar
 *     PaginaRegistrarPrestamo   BD-SP03-PL01 Registrar préstamo
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

import { CircleAlert, Clock, FileText } from 'lucide-react';
import { useControladorRegistrarPrestamo } from '../../../controladores/ControladorPrestamos.js';
import {
  ESTADOS_COPIA,
  FechaCorta,
  FechaLarga,
  FormatoMoneda,
  IndicacionAdeudos,
  UbicacionTexto,
} from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Selector,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import {
  BuscadorMatricula,
  DocumentoRecibo,
  EntregaRecibo,
  ModalDocumento,
} from '../../componentes/Circulacion.jsx';

/*
 * Componente: TablaCondiciones
 * Objetivo: Condiciones del lector (cuenta, multas, préstamos y vencidos) con su resultado.
 * Uso: <TablaCondiciones condiciones={…} />
 */
function TablaCondiciones({ condiciones })
{
  return (
    <table className="tabla tabla-compacta margen-arriba-16">
      <thead>
        <tr>
          <th>Condición</th>
          <th>Resultado</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {condiciones.map((condicion) => (
          <tr key={condicion.Condicion}>
            <td>{condicion.Condicion}</td>
            <td style={{ fontWeight: 700 }}>{condicion.Resultado}</td>
            <td>
              <Insignia tono={condicion.Cumple ? 'exito' : 'error'}>
                {condicion.Cumple ? 'Cumple' : 'No cumple'}
              </Insignia>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/*
 * Componente: TablaCopias
 * Objetivo: Copias del libro con su estatus, si se prestan a domicilio y su fecha de
 *           devolución.
 * Uso: <TablaCopias copias={…} />
 */
function TablaCopias({ copias })
{
  return (
    <table className="tabla tabla-compacta margen-arriba-16">
      <thead>
        <tr>
          <th>Copia</th>
          <th>Estatus</th>
          <th>Préstamo externo</th>
          <th>Fecha de devolución</th>
        </tr>
      </thead>
      <tbody>
        {copias.map((copia) => (
          <tr key={copia.num_copia}>
            <td style={{ fontWeight: 700 }}>Copia {copia.num_copia}</td>
            <td>
              <Insignia tono={ESTADOS_COPIA[copia.Estatus]?.tono}>
                {copia.Estatus === 'Disponible' ? 'Disponible (solo en sala)' : copia.Estatus}
              </Insignia>
            </td>
            <td>{copia.Prestable ? 'Sí' : 'No'}</td>
            <td>{FechaCorta(copia.Fecha_Entrega_Programada)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/*
 * Componente: PaginaRegistrarPrestamo
 * Objetivo: BD-SP03-PL01 Registrar préstamo (formulario, lector con adeudos, libro sin
 *           ejemplares, datos incompletos, registro exitoso y vista previa del recibo).
 * Uso: <PaginaRegistrarPrestamo />
 */
export function PaginaRegistrarPrestamo()
{
  const controlador = useControladorRegistrarPrestamo();
  const { lector, situacion, libro, resultado, rechazo } = controlador;
  const registrado = Boolean(resultado);
  const fallas = situacion?.condiciones.filter((condicion) => !condicion.Cumple) ?? [];

  return (
    <Pagina miga="Préstamos · Registro" titulo="Registrar préstamo" ancho={1000}>
      <EnlaceVolver to="/prestamos">Volver a Préstamos</EnlaceVolver>

      <BuscadorMatricula
        titulo="1. Lector"
        subtitulo="Busca al lector por matrícula o número de nómina"
        valor={lector.matricula}
        al_cambio={lector.SetMatricula}
        al_buscar={lector.Buscar}
        buscando={lector.buscando}
      >
        {lector.error && (
          <div className="margen-arriba-16">
            <AlertaError error={lector.error} />
          </div>
        )}
        {situacion && rechazo !== 'lector' && (
          <div className="rejilla-4 margen-arriba-16">
            <DatoEtiquetado etiqueta="Lector" valor={situacion.lector.Nombre_Completo} />
            <DatoEtiquetado etiqueta="Perfil" valor={situacion.lector.Nombre_Rol} />
            <DatoEtiquetado
              etiqueta="Préstamos activos"
              valor={`${situacion.resumen.Prestamos_Activos} de ${situacion.resumen.Maximo_Prestamos}`}
            />
            <DatoEtiquetado
              etiqueta="Multas pendientes"
              valor={FormatoMoneda(situacion.resumen.Multas_Pendientes)}
            />
          </div>
        )}
        {situacion && rechazo === 'lector' && (
          <>
            <p className="texto-nota margen-arriba-16">
              Sin multas, máximo {situacion.resumen.Maximo_Prestamos} ejemplares prestados y sin
              préstamos vencidos
            </p>
            <div className="rejilla-3 margen-arriba-16">
              <DatoEtiquetado etiqueta="Lector" valor={situacion.lector.Nombre_Completo} />
              <DatoEtiquetado etiqueta="Perfil" valor={situacion.lector.Nombre_Rol} />
              <DatoEtiquetado
                etiqueta="Estatus de la cuenta"
                valor={situacion.lector.Estatus === 'Activo' ? 'Activa' : 'Inactiva'}
              />
            </div>
            <TablaCondiciones condiciones={situacion.condiciones} />
          </>
        )}
      </BuscadorMatricula>

      <Tarjeta className="margen-arriba-16">
        <h2 className="titulo-seccion">2. Libro y ejemplar</h2>
        <p className="texto-nota margen-arriba-4">Busca el libro por su ISBN y elige el ejemplar</p>
        <form
          className="fila espacio-12 fila-buscador margen-arriba-16"
          onSubmit={(evento) =>
          {
            evento.preventDefault();
            controlador.BuscarLibro();
          }}
        >
          <div className="campo campo-buscador">
            <label className="campo-etiqueta" htmlFor="isbn-prestamo">
              ISBN
            </label>
            <input
              id="isbn-prestamo"
              className="entrada"
              placeholder="Ej. 978-607-442-046-3"
              value={controlador.isbn}
              onChange={(evento) => controlador.SetIsbn(evento.target.value)}
              disabled={registrado}
            />
          </div>
          <Boton type="submit" disabled={controlador.buscando_libro || registrado}>
            {controlador.buscando_libro ? 'Buscando…' : 'Buscar'}
          </Boton>
        </form>
        {controlador.error_libro && (
          <div className="margen-arriba-16">
            <AlertaError error={controlador.error_libro} />
          </div>
        )}
        {libro && (
          <div className="rejilla-3 margen-arriba-16">
            <DatoEtiquetado etiqueta="Título" valor={libro.Titulo} />
            <DatoEtiquetado
              etiqueta="Autor · Editorial"
              valor={`${libro.Autores_Apellidos ?? '—'} · ${libro.Nombre_Editorial}`}
            />
            <DatoEtiquetado
              etiqueta="Ubicación"
              valor={UbicacionTexto(libro.ubicacion ?? {}, null) || '—'}
            />
          </div>
        )}
        {libro && rechazo === 'libro' ? (
          <TablaCopias copias={libro.copias} />
        ) : (
          <Selector
            className="margen-arriba-16 campo-mediano"
            etiqueta="Ejemplar"
            value={controlador.num_copia}
            onChange={(evento) => controlador.SetNumCopia(evento.target.value)}
            disabled={!libro || !libro.prestables.length || registrado}
            marcador={
              !libro
                ? 'Primero busca el libro'
                : libro.prestables.length
                  ? 'Selecciona un ejemplar'
                  : 'Sin ejemplares disponibles para préstamo externo'
            }
            opciones={(libro?.prestables ?? []).map((copia) => ({
              valor: String(copia.num_copia),
              etiqueta: `Copia ${copia.num_copia} · Consulta Externa`,
            }))}
            error={controlador.errores.num_copia}
          />
        )}
        {libro && libro.Estatus !== 'Activo' && (
          <div className="margen-arriba-16">
            <Alerta tipo="advertencia" titulo="El libro está inactivo">
              Un libro inactivo no se presta; primero debe reactivarse en Libros.
            </Alerta>
          </div>
        )}
        {libro && libro.lista_espera.length > 0 && libro.prestables.length > 0 && !registrado && (
          <div className="margen-arriba-16">
            <Alerta tipo="informacion" titulo={`Hay ${libro.lista_espera.length} lectores en la lista de espera`}>
              {libro.lista_espera[0].Nombre_Completo} tiene prioridad porque fue el primero en
              registrarse; solo a ese lector se le puede prestar.
            </Alerta>
          </div>
        )}
      </Tarjeta>

      <Tarjeta className="margen-arriba-16">
        <h2 className="titulo-seccion">3. Fechas del préstamo</h2>
        <p className="texto-nota margen-arriba-4">
          Alumno y colaborador: 5 días hábiles · Profesor: 10 días hábiles, sin contar sábados ni
          domingos
        </p>
        {situacion && controlador.copia_elegida ? (
          <div className="rejilla-3 margen-arriba-16">
            <DatoEtiquetado
              etiqueta="Fecha de préstamo"
              valor={FechaLarga(
                resultado?.prestamo.Fecha_Prestamo ?? situacion.reglas.Fecha_Prestamo,
              )}
            />
            <DatoEtiquetado
              etiqueta="Fecha de devolución"
              valor={FechaLarga(
                resultado?.prestamo.Fecha_Entrega_Programada ?? situacion.reglas.Fecha_Devolucion,
              )}
            />
            <DatoEtiquetado
              etiqueta="Renovaciones permitidas"
              valor={situacion.reglas.Max_Renovaciones}
            />
          </div>
        ) : (
          <p className="texto-nota margen-arriba-16">
            Las fechas se calculan cuando se elige el lector y el ejemplar.
          </p>
        )}
      </Tarjeta>

      <EntregaRecibo
        titulo="4. Entrega del recibo"
        medio={controlador.medio}
        al_imprimir={() => controlador.SetMedio('Imprimir')}
        al_enviar_correo={() => controlador.SetMedio('Correo')}
        al_enviar_whatsapp={() => controlador.SetMedio('WhatsApp')}
      />

      {rechazo === 'lector' && situacion && (
        <div className="margen-arriba-16">
          <Alerta tipo="error" titulo={`No se puede prestar a ${situacion.lector.Nombre_Completo}`}>
            No cumple: {fallas.map((condicion) => condicion.Condicion.toLowerCase()).join(', ')}.{' '}
            {IndicacionAdeudos(situacion.resumen)}
          </Alerta>
        </div>
      )}
      {rechazo === 'libro' && (
        <div className="margen-arriba-16">
          <Alerta tipo="error" titulo="No hay copias disponibles para préstamo externo">
            Todas las copias están prestadas o son solo para consulta en sala. Puedes agregar al
            lector a la lista de espera.
          </Alerta>
        </div>
      )}

      {registrado && (
        <div className="margen-arriba-16">
          <Alerta tipo="exito" titulo="Préstamo registrado correctamente">
            «{resultado.prestamo.Titulo}» (Copia {resultado.prestamo.num_copia}) quedó prestado a{' '}
            {resultado.prestamo.Nombre_Completo}.
            {resultado.lista_espera.atendida &&
              ` Salió de la lista de espera${
                resultado.lista_espera.siguiente
                  ? `; ahora ${resultado.lista_espera.siguiente} tiene prioridad`
                  : ''
              }.`}
          </Alerta>
        </div>
      )}

      {controlador.aviso && (
        <div className="margen-arriba-16">
          <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
            {controlador.aviso.texto}
          </Alerta>
        </div>
      )}

      <div className="fila espacio-12 margen-arriba-24">
        {registrado && (
          <>
            <Boton
              icono={FileText}
              onClick={controlador.GenerarRecibo}
              disabled={controlador.generando}
            >
              {controlador.generando ? 'Generando…' : 'Generar recibo'}
            </Boton>
            <Boton variante="secundario" onClick={controlador.Reiniciar}>
              Registrar otro préstamo
            </Boton>
          </>
        )}
        {!registrado && rechazo === 'lector' && (
          <>
            <Boton variante="secundario" icono={CircleAlert} onClick={controlador.VerAdeudos}>
              Ver multas y adeudos
            </Boton>
            <Boton variante="texto" onClick={controlador.Cancelar}>
              Cancelar
            </Boton>
          </>
        )}
        {!registrado && rechazo === 'libro' && (
          <>
            <Boton variante="secundario" icono={Clock} onClick={controlador.AgregarEspera}>
              Agregar a lista de espera
            </Boton>
            <Boton variante="texto" onClick={controlador.Cancelar}>
              Cancelar
            </Boton>
          </>
        )}
        {!registrado && !rechazo && (
          <>
            <Boton icono={FileText} onClick={controlador.Registrar} disabled={controlador.enviando}>
              {controlador.enviando ? 'Registrando…' : 'Registrar préstamo'}
            </Boton>
            <Boton variante="texto" onClick={controlador.Cancelar}>
              Cancelar
            </Boton>
          </>
        )}
      </div>

      {controlador.vista.abierta && (
        <ModalDocumento
          titulo="Vista previa del recibo"
          al_cerrar={controlador.vista.Cerrar}
          al_imprimir={controlador.vista.Imprimir}
          al_descargar={controlador.vista.Descargar}
          descargando={controlador.vista.descargando}
          cargando={controlador.vista.cargando}
          error={controlador.vista.error}
        >
          {controlador.vista.datos && (
            <DocumentoRecibo recibo={controlador.vista.datos} medio={controlador.medio} />
          )}
        </ModalDocumento>
      )}
    </Pagina>
  );
}
