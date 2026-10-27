/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaCambioUsuario.jsx
 * Función: Cambio de datos de un usuario.
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
 *     Componente            Objetivo
 *     PaginaCambioUsuario   BD-SP01-GU02 Cambio de datos de un usuario (versiones…
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

import { useControladorCambioUsuario } from '../../../controladores/ControladorUsuarios.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  EnlaceVolver,
  Entrada,
  Selector,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaCambioUsuario
 * Objetivo: BD-SP01-GU02 Cambio de datos de un usuario (versiones exitosa y fallida).
 * Uso: <PaginaCambioUsuario />
 */
export function PaginaCambioUsuario()
{
  const controlador = useControladorCambioUsuario();

  return (
    <Pagina miga="Usuarios · Modificar" titulo="Cambio de datos de usuario" ancho={980}>
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      {controlador.cargando && !controlador.usuario && <Cargando />}
      <AlertaError error={controlador.error_carga} />
      {controlador.resultado && (
        <div className="margen-abajo-16">
          <Alerta tipo={controlador.resultado.tipo} titulo={controlador.resultado.titulo}>
            {controlador.resultado.texto}
          </Alerta>
        </div>
      )}
      {controlador.usuario && (
        <Tarjeta>
          <form
            onSubmit={(evento) =>
            {
              evento.preventDefault();
              controlador.confirmar();
            }}
            noValidate
          >
            <div className="rejilla-2" style={{ gap: '20px 24px' }}>
              <Entrada
                etiqueta="Matrícula o número de nómina"
                value={controlador.usuario.Matricula_Nomina}
                bloqueado
                ayuda="Este dato no se puede modificar."
              />
              <Entrada
                etiqueta="Usuario"
                value={controlador.usuario.Nombre_Usuario}
                bloqueado
                ayuda="Este dato no se puede modificar."
              />
              <Selector
                etiqueta="Perfil / Tipo de usuario"
                value={controlador.form.id_perfil}
                onChange={controlador.cambiar('id_perfil')}
                opciones={controlador.perfiles.map((perfil) => ({
                  valor: String(perfil.id_perfil),
                  etiqueta: perfil.Nombre_Rol,
                }))}
                error={controlador.errores.id_perfil}
              />
              <Entrada
                etiqueta="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                value={controlador.form.Contrasena_Usuario}
                onChange={controlador.cambiar('Contrasena_Usuario')}
                error={controlador.errores.Contrasena_Usuario}
                ayuda="Mínimo 8 caracteres, una mayúscula y un número. Déjala vacía para conservar la actual."
              />
              <Selector
                etiqueta="Estatus de la cuenta"
                value={controlador.form.Estatus}
                onChange={controlador.cambiar('Estatus')}
                opciones={[
                  { valor: 'Activo', etiqueta: 'Activo' },
                  { valor: 'Bloqueado', etiqueta: 'Bloqueado' },
                  { valor: 'Inactivo', etiqueta: 'Inactivo' },
                ]}
                ayuda="Elige «Activo» para desbloquear una cuenta tras intentos fallidos."
              />
            </div>
            <hr
              style={{
                border: 0,
                borderTop: '1px solid var(--linea-divisoria)',
                margin: '24px 0 20px',
              }}
            />
            <div className="fila fin espacio-12">
              <Boton variante="texto" onClick={controlador.Cancelar}>
                Cancelar
              </Boton>
              <Boton type="submit" disabled={controlador.enviando}>
                {controlador.enviando ? 'Guardando…' : 'Confirmar cambios'}
              </Boton>
            </div>
          </form>
        </Tarjeta>
      )}
    </Pagina>
  );
}
