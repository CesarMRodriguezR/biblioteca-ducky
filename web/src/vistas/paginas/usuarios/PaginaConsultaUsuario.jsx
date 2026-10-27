/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaConsultaUsuario.jsx
 * Función: Consulta de un usuario por matrícula o número de nómina.
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
 *     Componente              Objetivo
 *     PaginaConsultaUsuario   BD-SP01-GU02 Consulta de un usuario (versiones exitosa y…
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

import { useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { useControladorConsultaUsuario } from '../../../controladores/ControladorUsuarios.js';
import {
  ESTADOS_USUARIO,
  TONOS_PERFIL,
  FormatoMoneda,
  Iniciales,
} from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  Boton,
  Cargando,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaConsultaUsuario
 * Objetivo: BD-SP01-GU02 Consulta de un usuario (versiones exitosa y fallida).
 * Uso: <PaginaConsultaUsuario />
 */
export function PaginaConsultaUsuario()
{
  const controlador = useControladorConsultaUsuario();
  const navegar = useNavigate();
  const usuario = controlador.usuario;

  return (
    <Pagina miga="Usuarios · Perfil" titulo="Consulta de usuario" ancho={980}>
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <Tarjeta>
        <form
          className="fila espacio-16"
          style={{ alignItems: 'flex-end' }}
          onSubmit={(evento) =>
          {
            evento.preventDefault();
            controlador.Buscar();
          }}
        >
          <div className="campo" style={{ flex: 1, maxWidth: 360 }}>
            <label className="campo-etiqueta" htmlFor="matricula">
              Matrícula o número de nómina
            </label>
            <input
              id="matricula"
              className="entrada"
              value={controlador.matricula}
              onChange={(evento) => controlador.SetMatricula(evento.target.value)}
              inputMode="numeric"
            />
          </div>
          <Boton type="submit">Buscar</Boton>
        </form>
      </Tarjeta>

      {controlador.cargando && <Cargando />}
      {controlador.error && (
        <div className="margen-arriba-16">
          <Alerta tipo="error" titulo={controlador.error.message}>
            Revisa que el número esté bien escrito.
          </Alerta>
        </div>
      )}

      {usuario && !controlador.cargando && (
        <Tarjeta className="margen-arriba-24">
          <div className="fila espacio-16">
            <div
              className="avatar"
              style={{
                width: 56,
                height: 56,
                fontSize: 18,
                background: 'var(--azul-principal)',
                color: '#fff',
              }}
            >
              {Iniciales(usuario.Nombre_Completo)}
            </div>
            <div style={{ flex: 1 }}>
              <h2>{usuario.Nombre_Completo}</h2>
              <span className="texto-nota">Perfil de usuario</span>
            </div>
            <Boton
              variante="secundario"
              icono={UserCog}
              onClick={() => navegar(`/usuarios/${usuario.id_usuario}/editar`)}
            >
              Modificar perfil
            </Boton>
          </div>
          <div className="rejilla-3 margen-arriba-24">
            <DatoEtiquetado etiqueta="Matrícula / No. de nómina" valor={usuario.Matricula_Nomina} />
            <DatoEtiquetado etiqueta="Usuario" valor={usuario.Nombre_Usuario} />
            <DatoEtiquetado etiqueta="Correo institucional" valor={usuario.Correo} />
            <div>
              <div className="etiqueta-dato">Perfil</div>
              <div className="margen-arriba-8">
                <Insignia tono={TONOS_PERFIL[usuario.Nombre_Rol]}>{usuario.Nombre_Rol}</Insignia>
              </div>
            </div>
            <div>
              <div className="etiqueta-dato">Estatus</div>
              <div className="margen-arriba-8">
                <Insignia tono={ESTADOS_USUARIO[usuario.Estatus].tono}>{usuario.Estatus}</Insignia>
              </div>
            </div>
            <DatoEtiquetado
              etiqueta="Préstamos / multas"
              valor={`${usuario.Libros_Prestados} libro(s) · ${usuario.Multas_Pendientes ? FormatoMoneda(usuario.Multas_Pendientes) : 'sin multas'}`}
            />
          </div>
          <p className="texto-nota margen-arriba-24">Por seguridad, la contraseña no se muestra.</p>
        </Tarjeta>
      )}
    </Pagina>
  );
}
