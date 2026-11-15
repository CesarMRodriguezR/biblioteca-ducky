/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaDetalleUsuario.jsx
 * Función: Detalle de usuario: datos de la cuenta, teléfono, indicadores de préstamos y multas,
 *          préstamos activos y si puede pedir nuevos préstamos.
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
 *     PaginaDetalleUsuario   BD-SP01-GU02 Detalle de usuario
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { ArrowRight, CircleAlert, Clock, FileText, ListChecks, UserCog } from 'lucide-react';
import { useControladorDetalleUsuario } from '../../../controladores/ControladorUsuarios.js';
import {
  ESTADOS_PRESTAMO,
  ESTADOS_USUARIO,
  FechaCorta,
  FormatoMoneda,
  IndicacionAdeudos,
  Iniciales,
  TelefonoTexto,
} from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import { TarjetaIndicador } from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaDetalleUsuario
 * Objetivo: BD-SP01-GU02 Detalle de usuario (con préstamos activos, con vencidos y multas y sin
 *           préstamos).
 * Uso: <PaginaDetalleUsuario />
 */
export function PaginaDetalleUsuario()
{
  const controlador = useControladorDetalleUsuario();
  const usuario = controlador.usuario;
  const resumen = usuario?.resumen;
  const fallas = usuario?.condiciones.filter((condicion) => !condicion.Cumple) ?? [];

  return (
    <Pagina miga="Usuarios · Detalle" titulo="Detalle de usuario" ancho={1100}>
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      {controlador.cargando && !usuario && <Cargando />}
      <AlertaError error={controlador.error} />
      {usuario && (
        <>
          <Tarjeta>
            <div className="fila espacio-16">
              <div className="avatar avatar-grande">{Iniciales(usuario.Nombre_Completo)}</div>
              <div style={{ flex: 1 }}>
                <h2>{usuario.Nombre_Completo}</h2>
                <span className="texto-nota">
                  {usuario.Nombre_Rol} ·{' '}
                  {usuario.Nombre_Rol === 'Alumno' ? 'Matrícula' : 'No. de nómina'}{' '}
                  {usuario.Matricula_Nomina}
                </span>
              </div>
              <Insignia tono={ESTADOS_USUARIO[usuario.Estatus].tono}>{usuario.Estatus}</Insignia>
              <Boton variante="secundario" icono={UserCog} onClick={controlador.Modificar}>
                Modificar perfil
              </Boton>
            </div>
            <hr className="separador" />
            <div className="rejilla-4">
              <DatoEtiquetado etiqueta="Matrícula / No. de nómina" valor={usuario.Matricula_Nomina} />
              <DatoEtiquetado etiqueta="Usuario" valor={usuario.Nombre_Usuario} />
              <DatoEtiquetado etiqueta="Perfil de usuario" valor={usuario.Nombre_Rol} />
              <DatoEtiquetado etiqueta="Estatus" valor={usuario.Estatus} />
              <DatoEtiquetado etiqueta="Correo institucional" valor={usuario.Correo} />
              <DatoEtiquetado etiqueta="Teléfono celular" valor={TelefonoTexto(usuario.Telefono)} />
            </div>
          </Tarjeta>

          <div className="rejilla-4 margen-arriba-16">
            <TarjetaIndicador
              valor={resumen.Prestamos_Activos}
              etiqueta="Préstamos activos"
              icono={FileText}
              insignia={
                resumen.Prestamos_Activos >= resumen.Maximo_Prestamos
                  ? ['advertencia', 'Límite alcanzado']
                  : [
                    'informacion',
                    resumen.Prestamos_Activos
                      ? `${resumen.Prestamos_Activos} de ${resumen.Maximo_Prestamos} permitidos`
                      : 'Sin préstamos',
                  ]
              }
            />
            <TarjetaIndicador
              valor={resumen.Prestamos_Vencidos}
              etiqueta="Préstamos vencidos"
              icono={Clock}
              insignia={resumen.Prestamos_Vencidos ? ['error', 'Atención'] : ['exito', 'Al corriente']}
            />
            <TarjetaIndicador
              valor={FormatoMoneda(resumen.Multas_Pendientes)}
              etiqueta="Multas pendientes"
              icono={CircleAlert}
              insignia={resumen.Multas_Pendientes ? ['error', 'Pago pendiente'] : ['exito', 'Al corriente']}
            />
            <TarjetaIndicador
              valor={resumen.Prestamos_Totales}
              etiqueta="Préstamos en total"
              icono={ListChecks}
              insignia={['neutro', 'Historial']}
            />
          </div>

          <div className="fila entre margen-arriba-24 margen-abajo-16">
            <h2>Préstamos activos</h2>
            {controlador.ver_historial && (
              <Boton variante="texto" icono={ArrowRight} onClick={controlador.VerHistorial}>
                Ver historial completo
              </Boton>
            )}
          </div>
          {usuario.activos.length ? (
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
                  {usuario.activos.map((prestamo) => (
                    <tr key={prestamo.id_prestamo}>
                      <td style={{ fontWeight: 700 }}>{prestamo.Folio}</td>
                      <td>
                        {prestamo.Titulo} · Copia {prestamo.num_copia}
                      </td>
                      <td>{FechaCorta(prestamo.Fecha_Prestamo)}</td>
                      <td>{FechaCorta(prestamo.Fecha_Entrega_Programada)}</td>
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
          ) : (
            <Tarjeta>
              <div className="tabla-vacia">
                <strong style={{ display: 'block', color: 'var(--texto-principal)' }}>
                  No tiene préstamos activos
                </strong>
                Este usuario no tiene libros prestados en este momento.
              </div>
            </Tarjeta>
          )}
          {!usuario.puede_prestar && (
            <div className="margen-arriba-16">
              <Alerta tipo="error" titulo="No puede solicitar nuevos préstamos">
                No cumple: {fallas.map((condicion) => `${condicion.Condicion.toLowerCase()} (${condicion.Resultado})`).join(', ')}.
                {` ${IndicacionAdeudos(resumen)}`}
              </Alerta>
            </div>
          )}
        </>
      )}
    </Pagina>
  );
}
