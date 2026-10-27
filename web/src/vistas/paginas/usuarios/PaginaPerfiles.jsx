/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · PaginaPerfiles.jsx
 * Función: Gestión de perfiles y sus funciones.
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
 *     Componente       Objetivo
 *     PaginaPerfiles   BD-SP01-GU02 Gestión de perfiles (roles y funciones)
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

import { Lock } from 'lucide-react';
import { useControladorPerfiles } from '../../../controladores/ControladorUsuarios.js';
import { DescribirFuncion } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  EnlaceVolver,
  Interruptor,
  Radio,
  Tarjeta,
} from '../../componentes/interfaz.jsx';

/*
 * Componente: PaginaPerfiles
 * Objetivo: BD-SP01-GU02 Gestión de perfiles (roles y funciones).
 * Uso: <PaginaPerfiles />
 */
export function PaginaPerfiles()
{
  const controlador = useControladorPerfiles();
  const protegido = controlador.perfil?.Protegido;

  return (
    <Pagina miga="Usuarios · Perfiles" titulo="Gestión de perfiles">
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <p className="texto-nota margen-abajo-16">
        Elige un rol y activa o desactiva las funciones que puede usar. Los cambios se aplican a
        todas las cuentas con ese perfil.
      </p>
      <AlertaError error={controlador.error} />
      {controlador.cargando && <Cargando />}
      {controlador.aviso && (
        <div className="margen-abajo-16">
          <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
            {controlador.aviso.texto}
          </Alerta>
        </div>
      )}

      {!controlador.cargando && controlador.perfil && (
        <>
          <div
            className="columnas"
            style={{ gridTemplateColumns: 'minmax(0, 0.75fr) minmax(0, 1.4fr)' }}
          >
            <Tarjeta>
              <h2 className="margen-abajo-16">Roles</h2>
              <div className="pila espacio-16" role="radiogroup" aria-label="Roles">
                {controlador.perfiles.map((perfil) => (
                  <button
                    key={perfil.id_perfil}
                    type="button"
                    role="radio"
                    aria-checked={perfil.id_perfil === controlador.perfil.id_perfil}
                    className="fila espacio-12"
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                    }}
                    onClick={() => controlador.Seleccionar(perfil.id_perfil)}
                  >
                    <span style={{ marginTop: 2 }}>
                      <Radio marcado={perfil.id_perfil === controlador.perfil.id_perfil} />
                    </span>
                    <span>
                      <span style={{ display: 'block', fontSize: 15 }}>{perfil.Nombre_Rol}</span>
                      <span className="texto-nota">{perfil.Descripcion_Perfil}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Tarjeta>

            <Tarjeta>
              <h2>Funciones de {controlador.perfil.Nombre_Rol}</h2>
              <p className="texto-nota margen-arriba-8">
                {protegido
                  ? 'El Administrador tiene acceso completo al sistema; sus funciones no se pueden modificar.'
                  : 'Activa las funciones que tendrá este perfil.'}
              </p>
              <div className="margen-arriba-16">
                {controlador.funciones.map((funcion) =>
                {
                  const { etiqueta, descripcion } = DescribirFuncion(funcion);
                  return (
                    <div
                      key={funcion.id_funcion}
                      className="fila espacio-16"
                      style={{ padding: '14px 0', borderTop: '1px solid var(--linea-divisoria)' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15 }}>{etiqueta}</div>
                        <div className="texto-nota">{descripcion}</div>
                      </div>
                      {protegido && <Lock size={16} aria-label="Bloqueado" />}
                      <Interruptor
                        etiqueta={etiqueta}
                        activo={protegido || controlador.asignadas.has(funcion.id_funcion)}
                        deshabilitado={protegido}
                        al_cambio={(activa) => controlador.Alternar(funcion.id_funcion, activa)}
                      />
                    </div>
                  );
                })}
              </div>
            </Tarjeta>
          </div>
          <div className="fila fin espacio-12 margen-arriba-24">
            <Boton
              variante="secundario"
              onClick={controlador.Cancelar}
              disabled={protegido || !controlador.hay_cambios}
            >
              Cancelar
            </Boton>
            <Boton
              onClick={controlador.GuardarCambios}
              disabled={protegido || !controlador.hay_cambios || controlador.enviando}
            >
              {controlador.enviando ? 'Guardando…' : 'Guardar cambios'}
            </Boton>
          </div>
        </>
      )}
    </Pagina>
  );
}
