/*
 * ******************************************************************
 * Nombre del programa: WEB-RUTAS · RutasAplicacion.jsx
 * Función: Rutas de la versión web protegidas por sesión y por función del perfil.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: URL del navegador
 * Salida: Pantalla correspondiente
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente        Objetivo
 *     ConSesion         Exige sesión iniciada
 *     ConFuncion        Exige una de las funciones indicadas. Si el perfil no la…
 *     Proteger          Envolver una pantalla con la verificación de sesión y de…
 *     Inicio            Redirigir a la pantalla inicial según las funciones del…
 *     RutasAplicacion   Definir todas las rutas de la versión web
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Cada ruta exige sesión y, cuando aplica, una función del perfil; sin ella se muestra
 *     Acceso restringido.
 * ******************************************************************
 */

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSesion } from '../controladores/ControladorSesion.jsx';
import { RutaInicial } from '../modelos/ModeloAutenticacion.js';
import { PlantillaAplicacion } from '../vistas/plantillas/PlantillaAplicacion.jsx';
import { Cargando } from '../vistas/componentes/interfaz.jsx';
import { PaginaInicioSesion } from '../vistas/paginas/PaginaInicioSesion.jsx';
import { PaginaPanel } from '../vistas/paginas/PaginaPanel.jsx';
import { PaginaAccesoRestringido } from '../vistas/paginas/PaginaAccesoRestringido.jsx';
import { PaginaUsuariosValidos } from '../vistas/paginas/usuarios/PaginaUsuariosValidos.jsx';
import { PaginaConsultaUsuario } from '../vistas/paginas/usuarios/PaginaConsultaUsuario.jsx';
import { PaginaCambioUsuario } from '../vistas/paginas/usuarios/PaginaCambioUsuario.jsx';
import { PaginaCargaLista } from '../vistas/paginas/usuarios/PaginaCargaLista.jsx';
import { PaginaBajasLista } from '../vistas/paginas/usuarios/PaginaBajasLista.jsx';
import { PaginaPerfiles } from '../vistas/paginas/usuarios/PaginaPerfiles.jsx';
import { PaginaLibros } from '../vistas/paginas/libros/PaginaLibros.jsx';
import { PaginaAltaLibro } from '../vistas/paginas/libros/PaginaAltaLibro.jsx';
import { PaginaEditarLibro } from '../vistas/paginas/libros/PaginaEditarLibro.jsx';
import { PaginaBajaLibro } from '../vistas/paginas/libros/PaginaBajaLibro.jsx';
import { PaginaSolicitarLibros } from '../vistas/paginas/libros/PaginaSolicitarLibros.jsx';
import { PaginaCatalogo } from '../vistas/paginas/catalogo/PaginaCatalogo.jsx';
import { PaginaFichaLibro } from '../vistas/paginas/catalogo/PaginaFichaLibro.jsx';

/*
 * Componente: ConSesion
 * Objetivo: Exige sesión iniciada.
 * Uso: <ConSesion >…</ConSesion>
 */
function ConSesion({ children })
{
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando)
  {
    return <Cargando />;
  }
  if (!usuario)
  {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }
  return children;
}

/*
 * Componente: ConFuncion
 * Objetivo: Exige una de las funciones indicadas. Si el perfil no la tiene, muestra "Acceso
 *           restringido" en lugar de la pantalla (sin tocar datos).
 * Uso: <ConFuncion funciones={…} nombre={…}>…</ConFuncion>
 */
function ConFuncion({ funciones, nombre, children })
{
  const { Puede } = useSesion();
  if (!Puede(...funciones))
  {
    return <PaginaAccesoRestringido funcion={nombre} />;
  }
  return children;
}

/*
 * Componente: Proteger
 * Objetivo: Envolver una pantalla con la verificación de sesión y de función.
 * Uso: <Proteger />
 */
const Proteger = (funciones, nombre, elemento) => (
  <ConFuncion funciones={funciones} nombre={nombre}>
    {elemento}
  </ConFuncion>
);

/*
 * Componente: Inicio
 * Objetivo: Redirigir a la pantalla inicial según las funciones del perfil.
 * Uso: <Inicio />
 */
function Inicio()
{
  const { usuario } = useSesion();
  return <Navigate to={RutaInicial(usuario)} replace />;
}

/*
 * Componente: RutasAplicacion
 * Objetivo: Definir todas las rutas de la versión web.
 * Uso: <RutasAplicacion />
 */
export function RutasAplicacion()
{
  return (
    <Routes>
      <Route path="/login" element={<PaginaInicioSesion />} />
      <Route
        element={
          <ConSesion>
            <PlantillaAplicacion />
          </ConSesion>
        }
      >
        <Route index element={<Inicio />} />
        <Route
          path="panel"
          element={Proteger(['gestionar_usuarios'], 'Panel de administración', <PaginaPanel />)}
        />

        <Route path="usuarios">
          <Route
            index
            element={Proteger(
              ['gestionar_usuarios'],
              'Gestión de usuarios',
              <PaginaUsuariosValidos />,
            )}
          />
          <Route
            path="consulta"
            element={Proteger(
              ['gestionar_usuarios'],
              'Consulta de usuario',
              <PaginaConsultaUsuario />,
            )}
          />
          <Route
            path="perfiles"
            element={Proteger(['gestionar_usuarios'], 'Gestión de perfiles', <PaginaPerfiles />)}
          />
          <Route
            path="carga"
            element={Proteger(
              ['gestionar_usuarios'],
              'Alta de cuentas por lista',
              <PaginaCargaLista />,
            )}
          />
          <Route
            path="bajas"
            element={Proteger(['gestionar_usuarios'], 'Baja de cuentas', <PaginaBajasLista />)}
          />
          <Route
            path=":id"
            element={Proteger(
              ['gestionar_usuarios'],
              'Consulta de usuario',
              <PaginaConsultaUsuario />,
            )}
          />
          <Route
            path=":id/editar"
            element={Proteger(
              ['gestionar_usuarios'],
              'Cambio de datos de usuario',
              <PaginaCambioUsuario />,
            )}
          />
        </Route>

        <Route path="libros">
          <Route
            index
            element={Proteger(['gestionar_libros'], 'Gestión de libros', <PaginaLibros />)}
          />
          <Route
            path="nuevo"
            element={Proteger(
              ['gestionar_libros'],
              'Registro de ficha bibliográfica',
              <PaginaAltaLibro />,
            )}
          />
          <Route
            path="solicitar"
            element={Proteger(
              ['solicitar_compra'],
              'Solicitud de compra de libros',
              <PaginaSolicitarLibros />,
            )}
          />
          <Route
            path=":id/solicitar"
            element={Proteger(
              ['solicitar_compra'],
              'Solicitud de compra de libros',
              <PaginaSolicitarLibros />,
            )}
          />
          <Route
            path=":id/editar"
            element={Proteger(
              ['gestionar_libros'],
              'Edición de ficha bibliográfica',
              <PaginaEditarLibro />,
            )}
          />
          <Route
            path=":id/baja"
            element={Proteger(['gestionar_libros'], 'Retiro y baja de libros', <PaginaBajaLibro />)}
          />
        </Route>

        <Route path="catalogo">
          <Route
            index
            element={Proteger(
              ['buscar_libros', 'gestionar_libros'],
              'Búsqueda de libros',
              <PaginaCatalogo />,
            )}
          />
          <Route
            path=":id"
            element={Proteger(
              ['buscar_libros', 'gestionar_libros'],
              'Consulta de un libro',
              <PaginaFichaLibro />,
            )}
          />
        </Route>

        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  );
}
