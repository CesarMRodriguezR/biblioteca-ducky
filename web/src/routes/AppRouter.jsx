import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSesion } from '../controllers/SesionController';
import { rutaInicial } from '../models/AuthModel';
import { AppLayout } from '../views/layouts/AppLayout';
import { Cargando } from '../views/components/ui';
import { LoginPage } from '../views/pages/LoginPage';
import { PanelPage } from '../views/pages/PanelPage';
import { AccesoRestringidoPage } from '../views/pages/AccesoRestringidoPage';
import { UsuariosValidosPage } from '../views/pages/usuarios/UsuariosValidosPage';
import { ConsultaUsuarioPage } from '../views/pages/usuarios/ConsultaUsuarioPage';
import { CambioUsuarioPage } from '../views/pages/usuarios/CambioUsuarioPage';
import { CargaListaPage } from '../views/pages/usuarios/CargaListaPage';
import { BajasListaPage } from '../views/pages/usuarios/BajasListaPage';
import { PerfilesPage } from '../views/pages/usuarios/PerfilesPage';
import { LibrosPage } from '../views/pages/libros/LibrosPage';
import { AltaLibroPage } from '../views/pages/libros/AltaLibroPage';
import { EditarLibroPage } from '../views/pages/libros/EditarLibroPage';
import { BajaLibroPage } from '../views/pages/libros/BajaLibroPage';
import { SolicitarLibrosPage } from '../views/pages/libros/SolicitarLibrosPage';
import { CatalogoPage } from '../views/pages/catalogo/CatalogoPage';
import { FichaLibroPage } from '../views/pages/catalogo/FichaLibroPage';

/** Exige sesión iniciada. */
function ConSesion({ children }) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  return children;
}

/**
 * Exige una de las funciones indicadas. Si el perfil no la tiene, muestra
 * "Acceso restringido" en lugar de la pantalla (sin tocar datos).
 */
function ConFuncion({ funciones, nombre, children }) {
  const { puede } = useSesion();
  if (!puede(...funciones)) return <AccesoRestringidoPage funcion={nombre} />;
  return children;
}

const proteger = (funciones, nombre, elemento) => (
  <ConFuncion funciones={funciones} nombre={nombre}>{elemento}</ConFuncion>
);

function Inicio() {
  const { usuario } = useSesion();
  return <Navigate to={rutaInicial(usuario)} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ConSesion><AppLayout /></ConSesion>}>
        <Route index element={<Inicio />} />
        <Route path="panel" element={proteger(['gestionar_usuarios'], 'Panel de administración', <PanelPage />)} />

        <Route path="usuarios">
          <Route index element={proteger(['gestionar_usuarios'], 'Gestión de usuarios', <UsuariosValidosPage />)} />
          <Route path="consulta" element={proteger(['gestionar_usuarios'], 'Consulta de usuario', <ConsultaUsuarioPage />)} />
          <Route path="perfiles" element={proteger(['gestionar_usuarios'], 'Gestión de perfiles', <PerfilesPage />)} />
          <Route path="carga" element={proteger(['gestionar_usuarios'], 'Alta de cuentas por lista', <CargaListaPage />)} />
          <Route path="bajas" element={proteger(['gestionar_usuarios'], 'Baja de cuentas', <BajasListaPage />)} />
          <Route path=":id" element={proteger(['gestionar_usuarios'], 'Consulta de usuario', <ConsultaUsuarioPage />)} />
          <Route path=":id/editar" element={proteger(['gestionar_usuarios'], 'Cambio de datos de usuario', <CambioUsuarioPage />)} />
        </Route>

        <Route path="libros">
          <Route index element={proteger(['gestionar_libros'], 'Gestión de libros', <LibrosPage />)} />
          <Route path="nuevo" element={proteger(['gestionar_libros'], 'Registro de ficha bibliográfica', <AltaLibroPage />)} />
          <Route path="solicitar" element={proteger(['solicitar_compra'], 'Solicitud de compra de libros', <SolicitarLibrosPage />)} />
          <Route path=":id/solicitar" element={proteger(['solicitar_compra'], 'Solicitud de compra de libros', <SolicitarLibrosPage />)} />
          <Route path=":id/editar" element={proteger(['gestionar_libros'], 'Edición de ficha bibliográfica', <EditarLibroPage />)} />
          <Route path=":id/baja" element={proteger(['gestionar_libros'], 'Retiro y baja de libros', <BajaLibroPage />)} />
        </Route>

        <Route path="catalogo">
          <Route index element={proteger(['buscar_libros', 'gestionar_libros'], 'Búsqueda de libros', <CatalogoPage />)} />
          <Route path=":id" element={proteger(['buscar_libros', 'gestionar_libros'], 'Consulta de un libro', <FichaLibroPage />)} />
        </Route>

        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  );
}
