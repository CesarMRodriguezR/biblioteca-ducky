/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaCargaLista.jsx
 * Función: Alta de cuentas a partir de la lista que se genera con CIAA (alumnos) y Empleados.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Props y estado del controlador de la pantalla
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente          Objetivo
 *     ETIQUETAS_FUNCION   Nombre corto de las funciones principales para el resumen…
 *     ResumenFunciones    Resumir las funciones principales de un perfil
 *     TablaErrores        Tabla de registros con error de CIAA o Empleados
 *     PaginaCargaLista    BD-SP01-GU02 Alta de cuentas por lista (revisión, versión…
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

import { ListChecks } from 'lucide-react';
import { useControladorCargaLista } from '../../../controladores/ControladorUsuarios.js';
import { TONOS_PERFIL, DescribirFuncion } from '../../../modelos/dominio.js';
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

/*
 * Constante: ETIQUETAS_FUNCION
 * Objetivo: Nombre corto de las funciones principales para el resumen de cada perfil.
 */
const ETIQUETAS_FUNCION = {
  gestionar_usuarios: 'Gestión de usuarios',
  gestionar_libros: 'Gestión de libros',
  buscar_libros: 'Búsqueda de libros',
};

/*
 * Función: ResumenFunciones
 * Objetivo: Resumir las funciones principales de un perfil.
 * Entrada: funciones (opcional)
 * Salida: Texto con las funciones
 */
function ResumenFunciones(funciones = [])
{
  const principales = funciones
    .filter((funcion) => ETIQUETAS_FUNCION[funcion])
    .map((funcion) => ETIQUETAS_FUNCION[funcion]);
  const texto = principales.join(', ');
  return texto
    ? texto.charAt(0) + texto.slice(1).toLowerCase()
    : DescribirFuncion({ Nombre_Funcion: funciones[0] ?? '—' }).etiqueta;
}

/*
 * Componente: TablaErrores
 * Objetivo: Tabla de registros de CIAA o Empleados que no se pudieron crear.
 * Uso: <TablaErrores errores={…} confirmado={…} />
 */
function TablaErrores({ errores, confirmado })
{
  if (!errores.length)
  {
    return null;
  }
  return (
    <>
      <h2 className="margen-arriba-32 margen-abajo-16">
        {confirmado ? 'Cuentas no creadas' : 'Registros con error'}
      </h2>
      <p className="texto-nota margen-abajo-16">
        {confirmado
          ? 'Corrige estos datos en el CIAA o en Empleados y genera la lista de nuevo; las demás cuentas ya quedaron registradas.'
          : 'Estos datos vienen mal capturados del sistema de origen y no se crearán. Corrígelos en el CIAA o en Empleados y genera la lista de nuevo.'}
      </p>
      <Tarjeta relleno={false} className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Origen</th>
              <th>Matrícula / No. de nómina</th>
              <th>Nombre</th>
              <th>Campo</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {errores.map((error) => (
              <tr key={`${error.Origen}-${error.Matricula_Nomina}-${error.Campo}`}>
                <td style={{ fontWeight: 700 }}>{error.Origen}</td>
                <td>{error.Matricula_Nomina}</td>
                <td>{error.Nombre_Completo}</td>
                <td>{error.Campo}</td>
                <td style={{ color: 'var(--error)', fontWeight: 700 }}>{error.Error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>
    </>
  );
}

/*
 * Componente: PaginaCargaLista
 * Objetivo: BD-SP01-GU02 Alta de cuentas por lista (revisión, versión exitosa y fallida, y
 *           registros corregidos).
 * Uso: <PaginaCargaLista />
 */
export function PaginaCargaLista()
{
  const controlador = useControladorCargaLista();
  const revision = controlador.revision;
  const total = controlador.validos.length;
  const creados = controlador.resultado?.creados ?? [];

  return (
    <Pagina miga="Usuarios · Carga de lista" titulo="Alta de cuentas por lista">
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <AlertaError error={controlador.error} />
      {controlador.error && !revision && (
        <Boton className="margen-arriba-16" onClick={controlador.GenerarDeNuevo}>
          Intentar de nuevo
        </Boton>
      )}
      {controlador.procesando && !revision && (
        <Cargando texto="Consultando CIAA y Empleados…" />
      )}

      {revision && !controlador.resultado && (
        <>
          <Tarjeta className="fila espacio-16">
            <div
              style={{
                width: 36,
                height: 28,
                borderRadius: 14,
                background: 'var(--informacion-fondo)',
                color: 'var(--azul-principal)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ListChecks size={16} aria-hidden />
            </div>
            <div style={{ flex: 1 }}>
              <strong>{controlador.corregidos ? 'Registros corregidos' : 'Lista generada'}</strong>
              <p className="texto-nota">
                {total} {total === 1 ? 'registro nuevo' : 'registros nuevos'} · CIAA (
                {revision.fuentes.CIAA} alumnos) y Empleados ({revision.fuentes.Empleados}{' '}
                empleados) · asigna el rol de cada usuario y confirma el registro
              </p>
            </div>
            <Boton
              variante="texto"
              onClick={controlador.GenerarDeNuevo}
              disabled={controlador.procesando}
            >
              Generar de nuevo
            </Boton>
            <Boton
              onClick={controlador.ConfirmarRegistro}
              disabled={controlador.procesando || !total}
            >
              {controlador.procesando ? 'Registrando…' : 'Confirmar registro'}
            </Boton>
          </Tarjeta>

          <h2 className="margen-arriba-24">Nuevos usuarios</h2>
          <p className="texto-nota margen-arriba-8 margen-abajo-16">
            Alumnos y empleados que aparecen en CIAA o en Empleados y aún no tienen cuenta. El
            usuario se forma con nombre.apellido y la contraseña inicial es la matrícula o
            nómina precedida de 000. El rol se sugiere según el tipo de persona; puedes cambiarlo.
            {controlador.sin_rol > 0 &&
              ` Los ${controlador.sin_rol} registro(s) sin rol no se crearán.`}
          </p>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Matrícula / No. de nómina</th>
                  <th>Nombre</th>
                  <th>Correo institucional</th>
                  <th>Origen</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {controlador.validos.map((valido) => (
                  <tr key={valido.Matricula_Nomina}>
                    <td style={{ fontWeight: 700 }}>{valido.Nombre_Usuario}</td>
                    <td>{valido.Matricula_Nomina}</td>
                    <td>{valido.Nombre_Completo}</td>
                    <td>{valido.Correo ?? '—'}</td>
                    <td>{valido.Origen}</td>
                    <td style={{ width: 180 }}>
                      <select
                        className="selector"
                        aria-label={`Rol de ${valido.Nombre_Usuario}`}
                        value={controlador.roles[valido.Matricula_Nomina] ?? ''}
                        onChange={(evento) =>
                          controlador.AsignarRol(valido.Matricula_Nomina, evento.target.value)
                        }
                      >
                        <option value="">Seleccionar rol</option>
                        {controlador.perfiles.map((perfil) => (
                          <option key={perfil.id_perfil} value={perfil.id_perfil}>
                            {perfil.Nombre_Rol}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!total && (
                  <tr>
                    <td colSpan={6} className="tabla-vacia">
                      No hay alumnos ni empleados nuevos: todos ya tienen cuenta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Tarjeta>
          <TablaErrores errores={revision.altas.errores} />
          <div className="fila espacio-12 margen-arriba-24">
            <Boton variante="secundario" onClick={controlador.RevisarBajas}>
              Revisar bajas de la lista ({revision.bajas.length})
            </Boton>
          </div>
        </>
      )}

      {controlador.resultado && (
        <>
          {creados.length > 0 && (
            <Alerta
              tipo="exito"
              titulo={
                controlador.resultado.errores.length
                  ? `Se crearon ${creados.length} ${creados.length === 1 ? 'cuenta' : 'cuentas'}. ${controlador.resultado.errores.length} ${controlador.resultado.errores.length === 1 ? 'registro no se creó' : 'registros no se crearon'}.`
                  : `Se crearon ${creados.length} ${creados.length === 1 ? 'cuenta' : 'cuentas'}${controlador.corregidos ? ' de los registros corregidos' : ''}. Ya están disponibles en tiempo real.`
              }
            />
          )}
          {creados.length === 0 && <Alerta tipo="error" titulo="No se creó ninguna cuenta." />}
          {creados.length > 0 && (
            <>
              <h2 className="margen-arriba-24 margen-abajo-16">
                {controlador.corregidos ? 'Cuentas creadas (registros corregidos)' : 'Cuentas creadas'}
              </h2>
              <Tarjeta relleno={false} className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Matrícula / No. de nómina</th>
                      <th>Contraseña</th>
                      <th>Perfil</th>
                      <th>Estatus</th>
                      <th>Funciones asignadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creados.map((creado) => (
                      <tr key={creado.id_usuario}>
                        <td style={{ fontWeight: 700 }}>{creado.Nombre_Usuario}</td>
                        <td>{creado.Matricula_Nomina}</td>
                        <td>{creado.Contrasena_Inicial}</td>
                        <td>
                          <Insignia tono={TONOS_PERFIL[creado.Nombre_Rol]}>
                            {creado.Nombre_Rol}
                          </Insignia>
                        </td>
                        <td>
                          <Insignia tono="exito">{creado.Estatus}</Insignia>
                        </td>
                        <td>{ResumenFunciones(creado.funciones)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tarjeta>
              <p className="texto-nota margen-arriba-8">
                La contraseña inicial es la matrícula o nómina precedida de 000; solo se muestra en
                esta pantalla.
              </p>
            </>
          )}
          <TablaErrores errores={controlador.resultado.errores} confirmado />
          <div className="fila espacio-12 margen-arriba-24">
            <Boton variante="secundario" onClick={controlador.RevisarBajas}>
              Revisar bajas de la lista
            </Boton>
            {controlador.resultado.errores.length > 0 && (
              <Boton variante="texto" onClick={controlador.GenerarDeNuevo}>
                Generar de nuevo con los registros corregidos
              </Boton>
            )}
          </div>
        </>
      )}
    </Pagina>
  );
}
