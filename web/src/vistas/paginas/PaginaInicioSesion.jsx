/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU01 · PaginaInicioSesion.jsx
 * Función: Pantalla de inicio de sesión y sus estados de error.
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
 *     Componente           Objetivo
 *     PaginaInicioSesion   Web · Iniciar sesión (general) y sus estados de error
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

import { Navigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useControladorInicioSesion } from '../../controladores/ControladorInicioSesion.js';
import { useSesion } from '../../controladores/ControladorSesion.jsx';
import { RutaInicial } from '../../modelos/ModeloAutenticacion.js';
import { Boton } from '../componentes/interfaz.jsx';
import './pagina-inicio-sesion.css';

/*
 * Componente: PaginaInicioSesion
 * Objetivo: Web · Iniciar sesión (general) y sus estados de error.
 * Uso: <PaginaInicioSesion />
 */
export function PaginaInicioSesion()
{
  const { usuario } = useSesion();
  const { form, errores, aviso, enviando, cambiar, enviar } = useControladorInicioSesion();

  if (usuario)
  {
    return <Navigate to={RutaInicial(usuario)} replace />;
  }

  return (
    <div className="inicio-sesion">
      <section className="inicio-sesion-imagen" aria-hidden>
        <div className="inicio-sesion-marca">
          <img src="/logo-ducky.png" alt="" width="30" height="28" />
          <span>Universidad Ducky</span>
        </div>
        <div className="inicio-sesion-lema">
          <h2>
            La biblioteca,
            <br />
            en una sola llave.
          </h2>
          <p>
            Administra usuarios, préstamos y el catálogo completo desde un solo lugar. Bienvenida de
            nuevo al sistema Biblio.
          </p>
          <div className="inicio-sesion-adorno">
            <span />
            <i />
          </div>
        </div>
      </section>

      <section className="inicio-sesion-panel">
        <a className="enlace-volver inicio-sesion-volver" href={import.meta.env.VITE_PORTAL_URL || '/'}>
          <ArrowLeft size={16} aria-hidden /> Volver al portal
        </a>
        <form className="inicio-sesion-formulario" onSubmit={enviar} noValidate>
          <img src="/logo-ducky.png" alt="Escudo de la Universidad Ducky" width="61" height="56" />
          <h1>Biblio</h1>
          <p className="texto-secundario">Inicia sesión con tus credenciales institucionales.</p>

          {aviso && (
            <div className={`inicio-sesion-aviso inicio-sesion-aviso-${aviso.tipo}`} role="alert">
              <AlertCircle size={18} aria-hidden />
              <div>
                <strong>{aviso.titulo}</strong>
                {aviso.texto && <p>{aviso.texto}</p>}
              </div>
            </div>
          )}

          <div className={`campo ${errores.usuario ? 'campo-con-error' : ''}`}>
            <label className="campo-etiqueta" htmlFor="usuario">
              Usuario{errores.usuario?.trim() ? ' *' : ''}
            </label>
            <input
              id="usuario"
              className="entrada"
              autoComplete="username"
              value={form.usuario}
              onChange={cambiar('usuario')}
              aria-invalid={Boolean(errores.usuario)}
              autoFocus
            />
            {errores.usuario?.trim() && <span className="campo-mensaje-error">{errores.usuario}</span>}
          </div>

          <div className={`campo ${errores.contrasena ? 'campo-con-error' : ''}`}>
            <label className="campo-etiqueta" htmlFor="contrasena">
              Contraseña{errores.contrasena?.trim() ? ' *' : ''}
            </label>
            <input
              id="contrasena"
              type="password"
              className="entrada"
              autoComplete="current-password"
              value={form.contrasena}
              onChange={cambiar('contrasena')}
              aria-invalid={Boolean(errores.contrasena)}
            />
            {errores.contrasena?.trim() && (
              <span className="campo-mensaje-error">{errores.contrasena}</span>
            )}
          </div>

          <Boton type="submit" disabled={enviando} className="inicio-sesion-boton">
            {enviando ? 'Entrando…' : 'Iniciar sesión'}
          </Boton>
        </form>
      </section>
    </div>
  );
}
