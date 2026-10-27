/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaCargaLista.jsx
 * Función: Alta de cuentas a partir de la lista de Servicios Escolares.
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
 *     TablaErrores        Tabla de filas con error de la lista cargada
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
import { SelectorArchivo } from '../../componentes/SelectorArchivo.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
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
 * Objetivo: Tabla de filas con error de la lista cargada.
 * Uso: <TablaErrores errores={…} />
 */
function TablaErrores({ errores })
{
  if (!errores.length)
  {
    return null;
  }
  return (
    <>
      <h2 className="margen-arriba-32 margen-abajo-16">Cuentas no creadas</h2>
      <p className="texto-nota margen-abajo-16">
        Corrige estos registros en la lista y vuelve a cargarla; los demás ya quedaron registrados.
      </p>
      <Tarjeta relleno={false} className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fila</th>
              <th>Matrícula / No. de nómina</th>
              <th>Nombre</th>
              <th>Campo</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {errores.map((error) => (
              <tr key={`${error.Fila}-${error.Campo}`}>
                <td style={{ fontWeight: 700 }}>{error.Fila}</td>
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
 * Objetivo: BD-SP01-GU02 Alta de cuentas por lista (revisión, versión exitosa y fallida).
 * Uso: <PaginaCargaLista />
 */
export function PaginaCargaLista()
{
  const controlador = useControladorCargaLista();

  return (
    <Pagina miga="Usuarios · Carga de lista" titulo="Alta de cuentas por lista">
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <AlertaError error={controlador.error} />

      {!controlador.revision && (
        <div className={controlador.error ? 'margen-arriba-16' : undefined}>
          <SelectorArchivo
            titulo="Carga la lista de Servicios Escolares"
            descripcion="Archivo .xlsx o .csv con las columnas Usuario, Matrícula / No. de nómina, Nombre y Correo institucional."
            al_archivo={controlador.CargarArchivo}
            procesando={controlador.procesando}
          />
        </div>
      )}

      {controlador.revision && !controlador.resultado && (
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
              <strong>Lista cargada</strong>
              <p className="texto-nota">
                {controlador.archivo?.name} · {controlador.revision.validos.length} registros ·
                asigna el rol de cada usuario y confirma el registro
              </p>
            </div>
            <Boton variante="texto" onClick={controlador.Reiniciar}>
              Cambiar archivo
            </Boton>
            <Boton
              onClick={controlador.ConfirmarRegistro}
              disabled={controlador.procesando || !controlador.revision.validos.length}
            >
              {controlador.procesando ? 'Registrando…' : 'Confirmar registro'}
            </Boton>
          </Tarjeta>

          <h2 className="margen-arriba-24">Nuevos usuarios</h2>
          <p className="texto-nota margen-arriba-8 margen-abajo-16">
            Revisa los usuarios de la lista y asigna el rol que tendrá cada uno. El rol define las
            funciones disponibles para la cuenta.
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
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {controlador.revision.validos.map((valido) => (
                  <tr key={valido.Fila}>
                    <td style={{ fontWeight: 700 }}>{valido.Nombre_Usuario}</td>
                    <td>{valido.Matricula_Nomina}</td>
                    <td>{valido.Nombre_Completo}</td>
                    <td>{valido.Correo}</td>
                    <td style={{ width: 180 }}>
                      <select
                        className="selector"
                        aria-label={`Rol de ${valido.Nombre_Usuario}`}
                        value={controlador.roles[valido.Fila] ?? ''}
                        onChange={(evento) =>
                          controlador.AsignarRol(valido.Fila, evento.target.value)
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
                {!controlador.revision.validos.length && (
                  <tr>
                    <td colSpan={5} className="tabla-vacia">
                      Ningún registro de la lista es válido.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Tarjeta>
          <TablaErrores errores={controlador.revision.errores} />
        </>
      )}

      {controlador.resultado && (
        <>
          {controlador.resultado.creados.length > 0 && (
            <Alerta
              tipo="exito"
              titulo={`Se crearon ${controlador.resultado.creados.length} ${controlador.resultado.creados.length === 1 ? 'cuenta' : 'cuentas'}. Ya están disponibles en tiempo real.`}
            />
          )}
          {controlador.resultado.creados.length === 0 && (
            <Alerta tipo="error" titulo="No se creó ninguna cuenta." />
          )}
          {controlador.resultado.creados.length > 0 && (
            <>
              <h2 className="margen-arriba-24 margen-abajo-16">Cuentas creadas</h2>
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
                    {controlador.resultado.creados.map((creado) => (
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
                La contraseña inicial es la matrícula a 10 dígitos; solo se muestra en esta
                pantalla.
              </p>
            </>
          )}
          <TablaErrores errores={controlador.resultado.errores} />
          <div className="fila espacio-12 margen-arriba-24">
            <Boton variante="secundario" onClick={controlador.RevisarBajas}>
              Revisar bajas de la lista
            </Boton>
            {controlador.resultado.errores.length > 0 && (
              <Boton variante="texto" onClick={controlador.Reiniciar}>
                Cargar registros corregidos
              </Boton>
            )}
          </div>
        </>
      )}
    </Pagina>
  );
}
