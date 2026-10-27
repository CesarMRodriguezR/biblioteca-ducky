import { NavLink, Outlet } from 'react-router-dom';
import { BookMarked, LayoutGrid, Library, LogOut, Users } from 'lucide-react';
import { useSesion } from '../../controllers/SesionController';
import { iniciales } from '../../models/dominio';

/** Menú lateral: cada opción aparece solo si el perfil tiene la función. */
const MENU = [
  { to: '/panel', etiqueta: 'Panel', icono: LayoutGrid, funcion: 'gestionar_usuarios' },
  { to: '/usuarios', etiqueta: 'Usuarios', icono: Users, funcion: 'gestionar_usuarios' },
  { to: '/libros', etiqueta: 'Libros', icono: BookMarked, funcion: 'gestionar_libros' },
  { to: '/catalogo', etiqueta: 'Catálogo', icono: Library, funcion: 'buscar_libros' },
];

export function AppLayout() {
  const { usuario, puede, cerrarSesion } = useSesion();
  const esAdmin = usuario.Nombre_Rol === 'Administrador';

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Menú principal">
        <div className="sidebar__marca">
          <div className="sidebar__icono"><Library size={22} aria-hidden /></div>
          <div>
            <div className="sidebar__nombre">Biblio</div>
            <div className="sidebar__sub">Universidad Ducky</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {MENU.filter((m) => puede(m.funcion)).map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--activo' : ''}`}
            >
              <m.icono size={19} aria-hidden />
              {m.etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__pie">
          <div className="avatar" aria-hidden>{iniciales(usuario.Nombre_Completo)}</div>
          <div className="sidebar__usuario">
            <strong>{usuario.Nombre_Completo}</strong>
            <span>{usuario.Nombre_Rol}</span>
            {!esAdmin && <span style={{ display: 'block' }}>{usuario.Matricula_Nomina}</span>}
          </div>
          <button type="button" className="sidebar__salir" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión">
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

/** Encabezado blanco con migas y título, común a todas las pantallas. */
export function Encabezado({ miga, titulo }) {
  return (
    <header className="encabezado">
      {miga && <div className="encabezado__miga">{miga}</div>}
      <h1>{titulo}</h1>
    </header>
  );
}

export function Pagina({ miga, titulo, children, ancho }) {
  return (
    <>
      <Encabezado miga={miga} titulo={titulo} />
      <div className="contenido" style={ancho ? { maxWidth: ancho } : undefined}>{children}</div>
    </>
  );
}
