/*
 * ******************************************************************
 * Nombre del programa: WEB-PLANTILLA · PlantillaAplicacion.jsx
 * Función: Estructura común de las pantallas: barra lateral por funciones, encabezado y
 *          contenido.
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
 *     MENU                  Opciones del menú lateral y la función que requiere cada una
 *     PlantillaAplicacion   Barra lateral con el menú según las funciones, pie con el…
 *     Encabezado            Encabezado blanco con migas y título, común a todas las…
 *     Pagina                Encabezado y contenido de una pantalla
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

import { NavLink, Outlet } from 'react-router-dom';
import { BookMarked, LayoutGrid, Library, LogOut, Users } from 'lucide-react';
import { useSesion } from '../../controladores/ControladorSesion.jsx';
import { Iniciales } from '../../modelos/dominio.js';

/*
 * Constante: MENU
 * Objetivo: Opciones del menú lateral y la función que requiere cada una.
 */
const MENU = [
  { to: '/panel', etiqueta: 'Panel', icono: LayoutGrid, funcion: 'gestionar_usuarios' },
  { to: '/usuarios', etiqueta: 'Usuarios', icono: Users, funcion: 'gestionar_usuarios' },
  { to: '/libros', etiqueta: 'Libros', icono: BookMarked, funcion: 'gestionar_libros' },
  { to: '/catalogo', etiqueta: 'Catálogo', icono: Library, funcion: 'buscar_libros' },
];

/*
 * Componente: PlantillaAplicacion
 * Objetivo: Barra lateral con el menú según las funciones, pie con el usuario y área de
 *           contenido.
 * Uso: <PlantillaAplicacion />
 */
export function PlantillaAplicacion()
{
  const { usuario, Puede, CerrarSesion } = useSesion();
  const es_admin = usuario.Nombre_Rol === 'Administrador';

  return (
    <div className="aplicacion">
      <aside className="barra-lateral" aria-label="Menú principal">
        <div className="barra-lateral-marca">
          <div className="barra-lateral-icono">
            <Library size={22} aria-hidden />
          </div>
          <div>
            <div className="barra-lateral-nombre">Biblio</div>
            <div className="barra-lateral-subtitulo">Universidad Ducky</div>
          </div>
        </div>
        <nav className="barra-lateral-navegacion">
          {MENU.filter((elemento) => Puede(elemento.funcion)).map((elemento) => (
            <NavLink
              key={elemento.to}
              to={elemento.to}
              className={({ isActive: is_active }) =>
                `barra-lateral-enlace ${is_active ? 'barra-lateral-enlace-activo' : ''}`
              }
            >
              <elemento.icono size={19} aria-hidden />
              {elemento.etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="barra-lateral-pie">
          <div className="avatar" aria-hidden>
            {Iniciales(usuario.Nombre_Completo)}
          </div>
          <div className="barra-lateral-usuario">
            <strong>{usuario.Nombre_Completo}</strong>
            <span>{usuario.Nombre_Rol}</span>
            {!es_admin && <span style={{ display: 'block' }}>{usuario.Matricula_Nomina}</span>}
          </div>
          <button
            type="button"
            className="barra-lateral-salir"
            onClick={CerrarSesion}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="principal">
        <Outlet />
      </main>
    </div>
  );
}

/*
 * Componente: Encabezado
 * Objetivo: Encabezado blanco con migas y título, común a todas las pantallas.
 * Uso: <Encabezado miga={…} titulo={…} />
 */
export function Encabezado({ miga, titulo })
{
  return (
    <header className="encabezado">
      {miga && <div className="encabezado-miga">{miga}</div>}
      <h1>{titulo}</h1>
    </header>
  );
}

/*
 * Componente: Pagina
 * Objetivo: Encabezado y contenido de una pantalla.
 * Uso: <Pagina miga={…} titulo={…} ancho={…}>…</Pagina>
 */
export function Pagina({ miga, titulo, children, ancho })
{
  return (
    <>
      <Encabezado miga={miga} titulo={titulo} />
      <div className="contenido" style={ancho ? { maxWidth: ancho } : undefined}>
        {children}
      </div>
    </>
  );
}
