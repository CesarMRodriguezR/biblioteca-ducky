/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL03 · PaginaRenovarPrestamo.jsx
 * Función: Renovar un préstamo del lector según el máximo de renovaciones de su perfil.
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
 *     Componente              Objetivo
 *     PaginaRenovarPrestamo   BD-SP03-PL03 Renovar préstamo
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { FileText } from 'lucide-react';
import { useControladorRenovar } from '../../../controladores/ControladorPrestamos.js';
import { FechaCorta, FechaLarga, FormatoMoneda } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  Boton,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import { BuscadorMatricula } from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaRenovarPrestamo
 * Objetivo: BD-SP03-PL03 Renovar préstamo (renovación con y sin retraso y renovación rechazada
 *           por el máximo).
 * Uso: <PaginaRenovarPrestamo />
 */
export function PaginaRenovarPrestamo()
{
  const controlador = useControladorRenovar();
  const { lector, renovado } = controlador;
  const situacion = lector.situacion;

  return (
    <Pagina miga="Préstamos · Renovación" titulo="Renovar préstamo" ancho={1000}>
      <EnlaceVolver to="/prestamos">Volver a Préstamos</EnlaceVolver>
      <BuscadorMatricula
        titulo="Lector"
        subtitulo={
          situacion
            ? `${situacion.lector.Nombre_Completo} · ${situacion.lector.Nombre_Rol} · máximo ` +
              `${situacion.reglas.Max_Renovaciones} renovaciones por préstamo`
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
      {situacion && !controlador.activos.length && (
        <div className="margen-arriba-16">
          <Alerta
            tipo="informacion"
            titulo={`${situacion.lector.Nombre_Completo} no tiene préstamos activos`}
          >
            No hay préstamos que renovar.
          </Alerta>
        </div>
      )}
      {controlador.activos.length > 0 && (
        <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
          <table className="tabla">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Libro · Copia</th>
                <th>Fecha de vencimiento</th>
                <th>Renovaciones</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {controlador.activos.map((prestamo) => (
                <tr key={prestamo.id_prestamo}>
                  <td style={{ fontWeight: 700 }}>{prestamo.Folio}</td>
                  <td>
                    {prestamo.Titulo} · Copia {prestamo.num_copia}
                  </td>
                  <td>
                    {FechaCorta(prestamo.Fecha_Entrega_Programada)}
                    {prestamo.Dias_Retraso > 0 && (
                      <span className="texto-nota"> · vencido hace {prestamo.Dias_Retraso} días</span>
                    )}
                  </td>
                  <td>
                    {prestamo.Renovaciones} de {prestamo.Max_Renovaciones}
                  </td>
                  <td>
                    {renovado?.prestamo.id_prestamo === prestamo.id_prestamo ? (
                      <Insignia tono="exito">Renovado</Insignia>
                    ) : (
                      <Boton
                        variante="secundario"
                        chico
                        onClick={() => controlador.Renovar(prestamo)}
                        disabled={controlador.renovando === prestamo.id_prestamo}
                      >
                        {controlador.renovando === prestamo.id_prestamo ? 'Renovando…' : 'Renovar'}
                      </Boton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
      {renovado && (
        <Tarjeta className="margen-arriba-16">
          <h2 className="titulo-seccion">Renovación registrada</h2>
          <div className="rejilla-3 margen-arriba-16">
            <DatoEtiquetado
              etiqueta="Fecha de vencimiento anterior"
              valor={FechaLarga(renovado.renovacion.Fecha_Anterior)}
            />
            <DatoEtiquetado
              etiqueta="Nueva fecha de devolución"
              valor={FechaLarga(renovado.renovacion.Fecha_Nueva)}
            />
            <DatoEtiquetado
              etiqueta="Multa por retraso"
              valor={
                renovado.multa
                  ? `${FormatoMoneda(renovado.multa.Cantidad_a_Pagar)} · ` +
                    `${renovado.renovacion.Dias_Retraso} días`
                  : '$0.00 · sin retraso'
              }
            />
          </div>
        </Tarjeta>
      )}
      {controlador.aviso && (
        <div className="margen-arriba-16">
          <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
            {controlador.aviso.texto}
          </Alerta>
        </div>
      )}
      {renovado && (
        <div className="margen-arriba-24">
          <Boton icono={FileText} onClick={controlador.EntregarRecibo}>
            Entregar recibo
          </Boton>
        </div>
      )}
    </Pagina>
  );
}
