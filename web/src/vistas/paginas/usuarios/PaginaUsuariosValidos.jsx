/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaUsuariosValidos.jsx
 * Función: Lista de usuarios válidos con búsqueda y paginación.
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
 *     PaginaUsuariosValidos   BD-SP01-GU02 Consulta de usuarios válidos
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

import { Link, useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { useControladorUsuariosValidos } from '../../../controladores/ControladorUsuarios.js';
import { ESTADOS_USUARIO, TONOS_PERFIL } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import { AlertaError, Boton, Insignia, Paginacion, Tarjeta } from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaUsuariosValidos
 * Objetivo: BD-SP01-GU02 Consulta de usuarios válidos.
 * Uso: <PaginaUsuariosValidos />
 */
export function PaginaUsuariosValidos()
{
  const controlador = useControladorUsuariosValidos();
  const navegar = useNavigate();
  const desde = controlador.total ? (controlador.pagina - 1) * controlador.por_pagina + 1 : 0;
  const hasta = Math.min(controlador.pagina * controlador.por_pagina, controlador.total);

  return (
    <Pagina miga="Usuarios · Consulta" titulo="Usuarios válidos">
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
          <div className="campo" style={{ width: 300 }}>
            <label className="campo-etiqueta" htmlFor="buscar-matricula">
              Buscar por matrícula o no. de nómina
            </label>
            <input
              id="buscar-matricula"
              className="entrada"
              placeholder="Ej. 3105842"
              value={controlador.texto}
              onChange={(evento) => controlador.set_texto(evento.target.value)}
              inputMode="numeric"
            />
          </div>
          <Boton type="submit">Buscar</Boton>
          <div style={{ flex: 1 }} />
          <Boton onClick={() => navegar('/usuarios/perfiles')}>Gestión de perfiles</Boton>
          <Boton onClick={() => navegar('/usuarios/carga')}>Actualizar lista de usuarios</Boton>
        </form>
      </Tarjeta>

      <AlertaError error={controlador.error} />
      {controlador.buscado && !controlador.cargando && (
        <p className="margen-arriba-16" style={{ fontWeight: 700 }}>
          {controlador.total} {controlador.total === 1 ? 'resultado' : 'resultados'} para «
          {controlador.buscado}»
        </p>
      )}

      <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
        <table className="tabla">
          <thead>
            <tr>
              <th>Matrícula / No. de nómina</th>
              <th>Nombre</th>
              <th>Perfil</th>
              <th>Estado</th>
              <th>Modificar perfil</th>
            </tr>
          </thead>
          <tbody>
            {controlador.usuarios.map((usuario) =>
            {
              const estado = ESTADOS_USUARIO[usuario.Estatus];
              return (
                <tr key={usuario.id_usuario}>
                  <td style={{ fontWeight: 700 }}>{usuario.Matricula_Nomina}</td>
                  <td>
                    <Link to={`/usuarios/${usuario.id_usuario}`}>{usuario.Nombre_Completo}</Link>
                  </td>
                  <td>
                    <Insignia tono={TONOS_PERFIL[usuario.Nombre_Rol]}>
                      {usuario.Nombre_Rol}
                    </Insignia>
                  </td>
                  <td>
                    <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
                  </td>
                  <td>
                    <Boton
                      variante="secundario"
                      chico
                      icono={UserCog}
                      onClick={() => navegar(`/usuarios/${usuario.id_usuario}/editar`)}
                    >
                      Modificar perfil
                    </Boton>
                  </td>
                </tr>
              );
            })}
            {!controlador.cargando && controlador.usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="tabla-vacia">
                  No hay ningún usuario registrado con esos datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Tarjeta>

      <div className="fila entre margen-arriba-16">
        <span className="texto-nota">
          Mostrando {desde}–{hasta} de {controlador.total} usuarios
        </span>
        <Paginacion
          pagina={controlador.pagina}
          total_paginas={controlador.total_paginas}
          al_cambio={controlador.IrAPagina}
          mostrar_numeros={false}
        />
      </div>
    </Pagina>
  );
}
