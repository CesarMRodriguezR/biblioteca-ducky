/*
 * ******************************************************************
 * Nombre del programa: WEB-RUTAS · RutasAplicacion.jsx
 * Función: Rutas de la versión web: portal público en / y pantallas protegidas por sesión y
 *          por función del perfil.
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
import { PaginaPortal } from '../vistas/paginas/PaginaPortal.jsx';
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
import { PaginaDetalleUsuario } from '../vistas/paginas/usuarios/PaginaDetalleUsuario.jsx';
import { PaginaPrestamos } from '../vistas/paginas/prestamos/PaginaPrestamos.jsx';
import { PaginaRegistrarPrestamo } from '../vistas/paginas/prestamos/PaginaRegistrarPrestamo.jsx';
import { PaginaReciboPrestamo } from '../vistas/paginas/prestamos/PaginaReciboPrestamo.jsx';
import { PaginaReimprimirRecibo } from '../vistas/paginas/prestamos/PaginaReimprimirRecibo.jsx';
import { PaginaRenovarPrestamo } from '../vistas/paginas/prestamos/PaginaRenovarPrestamo.jsx';
import { PaginaPrestamosUsuario } from '../vistas/paginas/prestamos/PaginaPrestamosUsuario.jsx';
import { PaginaListaEspera } from '../vistas/paginas/prestamos/PaginaListaEspera.jsx';
import { PaginaDevoluciones } from '../vistas/paginas/devoluciones/PaginaDevoluciones.jsx';
import { PaginaRegistrarDevolucion } from '../vistas/paginas/devoluciones/PaginaRegistrarDevolucion.jsx';
import { PaginaLibroPerdido } from '../vistas/paginas/devoluciones/PaginaLibroPerdido.jsx';
import { PaginaPrestamosVencidos } from '../vistas/paginas/devoluciones/PaginaPrestamosVencidos.jsx';
import { PaginaMultas } from '../vistas/paginas/multas/PaginaMultas.jsx';
import { PaginaGenerarMulta } from '../vistas/paginas/multas/PaginaGenerarMulta.jsx';
import { PaginaAdeudosUsuario } from '../vistas/paginas/multas/PaginaAdeudosUsuario.jsx';
import { PaginaDeudores } from '../vistas/paginas/multas/PaginaDeudores.jsx';
import { PaginaPagosTesoreria } from '../vistas/paginas/multas/PaginaPagosTesoreria.jsx';
import { PaginaAsistente } from '../vistas/paginas/asistente/PaginaAsistente.jsx';

/*
 * Componente: ConSesion
 * Objetivo: Exige sesión iniciada.
 * Uso: <ConSesion >…</ConSesion>
 */
function ConSesion({ children })
{
  const { usuario, cargando, salida_voluntaria } = useSesion();
  const ubicacion = useLocation();
  if (cargando)
  {
    return <Cargando />;
  }
  if (!usuario)
  {
    return (
      <Navigate
        to="/login"
        replace
        state={salida_voluntaria ? null : { desde: ubicacion.pathname + ubicacion.search }}
      />
    );
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
      <Route path="/" element={<PaginaPortal />} />
      <Route path="/login" element={<PaginaInicioSesion />} />
      <Route
        element={
          <ConSesion>
            <PlantillaAplicacion />
          </ConSesion>
        }
      >
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
              'Detalle de usuario',
              <PaginaDetalleUsuario />,
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
              ['gestionar_libros'],
              'Solicitud de compra de libros',
              <PaginaSolicitarLibros />,
            )}
          />
          <Route
            path=":id/solicitar"
            element={Proteger(
              ['gestionar_libros'],
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

        <Route path="prestamos">
          <Route
            index
            element={Proteger(['prestar_libros'], 'Préstamos', <PaginaPrestamos />)}
          />
          <Route
            path="registro"
            element={Proteger(
              ['prestar_libros'],
              'Registro de préstamos',
              <PaginaRegistrarPrestamo />,
            )}
          />
          <Route
            path="recibos"
            element={Proteger(['prestar_libros'], 'Recibo de préstamo', <PaginaReimprimirRecibo />)}
          />
          <Route
            path=":id/recibo"
            element={Proteger(['prestar_libros'], 'Recibo de préstamo', <PaginaReciboPrestamo />)}
          />
          <Route
            path="renovacion"
            element={Proteger(['prestar_libros'], 'Renovación de préstamos', <PaginaRenovarPrestamo />)}
          />
          <Route
            path="usuario"
            element={Proteger(['prestar_libros'], 'Préstamos de un usuario', <PaginaPrestamosUsuario />)}
          />
          <Route
            path="lista-espera"
            element={Proteger(['prestar_libros'], 'Lista de espera', <PaginaListaEspera />)}
          />
        </Route>

        <Route path="devoluciones">
          <Route
            index
            element={Proteger(['devolver_libros'], 'Devoluciones', <PaginaDevoluciones />)}
          />
          <Route
            path="registro"
            element={Proteger(
              ['devolver_libros'],
              'Registro de devoluciones',
              <PaginaRegistrarDevolucion />,
            )}
          />
          <Route
            path="perdido"
            element={Proteger(['devolver_libros'], 'Reporte de libro perdido', <PaginaLibroPerdido />)}
          />
          <Route
            path="vencidos"
            element={Proteger(['devolver_libros'], 'Préstamos vencidos', <PaginaPrestamosVencidos />)}
          />
        </Route>

        <Route path="multas">
          <Route
            index
            element={Proteger(['devolver_libros'], 'Multas y adeudos', <PaginaMultas />)}
          />
          <Route
            path="generar"
            element={Proteger(['devolver_libros'], 'Generación de multas', <PaginaGenerarMulta />)}
          />
          <Route
            path="adeudos"
            element={Proteger(['devolver_libros'], 'Multas y adeudos', <PaginaAdeudosUsuario />)}
          />
          <Route
            path="deudores"
            element={Proteger(['devolver_libros'], 'Lista de alumnos deudores', <PaginaDeudores />)}
          />
          <Route
            path="pagos"
            element={Proteger(['devolver_libros'], 'Pagos de Tesorería', <PaginaPagosTesoreria />)}
          />
        </Route>

        <Route
          path="asistente"
          element={Proteger(['usar_asistente'], 'Asistente Biblio', <PaginaAsistente />)}
        />

        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  );
}
