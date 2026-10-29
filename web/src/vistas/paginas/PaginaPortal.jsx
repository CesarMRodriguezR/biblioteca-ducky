/*
 * ******************************************************************
 * Nombre del programa: WEB-PORTAL · PaginaPortal.jsx
 * Función: Inicio-Portal de biblioteca: página pública con la búsqueda, los accesos a los
 *          servicios y el acceso al sistema.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Estado y acciones de useControladorPortal
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente     Objetivo
 *     SERVICIOS      Tarjetas de servicios del portal
 *     PaginaPortal   Inicio-Portal de biblioteca
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) Los íconos y el logo de CCJMops están en public/portal/ (exportados de Figma).
 * ******************************************************************
 */

import { useControladorPortal } from '../../controladores/ControladorPortal.js';
import './pagina-portal.css';

/*
 * Constante: SERVICIOS
 * Objetivo: Tarjetas de servicios del portal con su ícono y color.
 */
const SERVICIOS = [
  {
    titulo: 'Renovar préstamos',
    texto: 'Extiende la fecha de tus libros sin ir al mostrador.',
    icono: '/portal/icono-renovar.svg',
    color: 'var(--azul-principal)',
  },
  {
    titulo: 'Reservar espacios',
    texto: 'Aparta un cubículo o sala de estudio.',
    icono: '/portal/icono-reservar.svg',
    color: 'var(--azul-brillante)',
  },
  {
    titulo: 'Pregunte a un bibliotecario',
    texto: 'Resuelve dudas sobre servicios y recursos.',
    icono: '/portal/icono-preguntar.svg',
    color: 'var(--dorado)',
  },
  {
    titulo: 'Guías de investigación',
    texto: 'Encuentra fuentes recomendadas por tema.',
    icono: '/portal/icono-guias.svg',
    color: 'var(--azul-marino)',
  },
];

/*
 * Componente: PaginaPortal
 * Objetivo: Inicio-Portal de biblioteca.
 * Uso: <PaginaPortal />
 */
export function PaginaPortal()
{
  const controlador = useControladorPortal();

  return (
    <div className="portal">
      <header className="portal-encabezado">
        <div className="portal-contenedor portal-encabezado-contenido">
          <div className="portal-escudo">
            <img src="/logo-ducky.png" alt="Escudo de la Universidad Ducky" width="61" height="56" />
            <span className="portal-separador" aria-hidden />
            <div>
              <div className="portal-nombre">Biblioteca</div>
              <div className="portal-universidad">Universidad Ducky</div>
            </div>
          </div>
          <div className="portal-acciones">
            <div className="portal-desarrollado">
              <span>Desarrollado por</span>
              <img src="/portal/logo-ccjmops-blanco.svg" alt="CCJMops" width="72" height="15.0881" />
            </div>
            <span className="portal-separador portal-separador-chico" aria-hidden />
            <button type="button" className="portal-boton-sesion" onClick={controlador.IniciarSesion}>
              {controlador.con_sesion ? 'Ir a Biblio' : 'Iniciar sesión'}
            </button>
          </div>
        </div>
      </header>

      <main className="portal-principal">
        <section className="portal-heroe">
          <div className="portal-contenedor">
            <h1 className="portal-titulo">Encuentra lo que necesitas leer</h1>
            <form className="portal-busqueda" role="search" onSubmit={controlador.Buscar}>
              <label className="portal-campo">
                <img src="/portal/icono-buscar.svg" alt="" width="15.7091" height="16.2" />
                <input
                  type="search"
                  placeholder="Busca por título, autor o tema"
                  aria-label="Buscar en el catálogo"
                  value={controlador.texto}
                  onChange={(evento) => controlador.SetTexto(evento.target.value)}
                />
              </label>
              <button type="submit" className="portal-boton-buscar">
                Buscar
              </button>
            </form>
          </div>
        </section>

        <section className="portal-contenedor portal-servicios" aria-label="Accesos rápidos">
          {SERVICIOS.map((servicio) => (
            <article key={servicio.titulo} className="portal-tarjeta">
              <div className="portal-tarjeta-icono" style={{ background: servicio.color }}>
                <img src={servicio.icono} alt="" width="24" height="24" />
              </div>
              <h2>{servicio.titulo}</h2>
              <p>{servicio.texto}</p>
              <button type="button" className="portal-ir" onClick={controlador.IrAServicio}>
                Ir ahora
                <span className="portal-ir-icono">
                  <img src="/portal/icono-flecha.svg" alt="" width="20" height="20" />
                </span>
              </button>
            </article>
          ))}
        </section>
      </main>

      <footer className="portal-pie">
        <div className="portal-contenedor">
          © 2026 Universidad Ducky · biblioteca@ducky.edu.mx · Lun–Vie 7:00–22:00 h
        </div>
      </footer>
    </div>
  );
}
