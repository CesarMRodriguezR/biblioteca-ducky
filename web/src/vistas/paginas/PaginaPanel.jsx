/*
 * ******************************************************************
 * Nombre del programa: WEB-PANEL · PaginaPanel.jsx
 * Función: Panel del administrador con indicadores y accesos rápidos.
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
 *     Componente    Objetivo
 *     ACCESOS       Accesos rápidos del panel
 *     PaginaPanel   Panel del administrador con indicadores, accesos rápidos…
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
import {
  ArrowRight,
  BookOpen,
  Library,
  ListChecks,
  PenLine,
  Search,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  UserRoundMinus,
  UserRoundSearch,
  Users,
} from 'lucide-react';
import { useControladorPanel } from '../../controladores/ControladorPanel.js';
import { Pagina } from '../plantillas/PlantillaAplicacion.jsx';
import { AlertaError, Cargando, Insignia, Tarjeta } from '../componentes/interfaz.jsx';

/*
 * Constante: ACCESOS
 * Objetivo: Accesos rápidos del panel: los tres del prototipo y los demás procesos de esta
 *           entrega (gestión de usuarios, gestión de libros y búsqueda).
 */
const ACCESOS = [
  {
    titulo: 'Alta de usuarios',
    texto: 'Carga la lista de nuevos usuarios y asigna su rol.',
    icono: UserRound,
    fondo: 'fondo-azul',
    ruta: '/usuarios/carga',
  },
  {
    titulo: 'Alta de libro',
    texto: 'Registra una ficha nueva o agrega ejemplares a una existente.',
    icono: PenLine,
    fondo: 'fondo-dorado',
    ruta: '/libros/nuevo',
  },
  {
    titulo: 'Generar listado',
    texto: 'Consulta el catálogo e imprime o guarda el listado en PDF.',
    icono: ListChecks,
    fondo: 'fondo-brillante',
    ruta: '/catalogo?listado=1',
  },
  {
    titulo: 'Baja de usuarios',
    texto: 'Revisa quién ya no aparece en CIAA ni en Empleados y da de baja su cuenta.',
    icono: UserRoundMinus,
    fondo: 'fondo-azul',
    ruta: '/usuarios/bajas',
  },
  {
    titulo: 'Consulta de usuarios',
    texto: 'Busca una cuenta por matrícula o nómina y cambia sus datos.',
    icono: UserRoundSearch,
    fondo: 'fondo-dorado',
    ruta: '/usuarios/consulta',
  },
  {
    titulo: 'Perfiles y funciones',
    texto: 'Define qué funciones tiene cada rol del sistema.',
    icono: ShieldCheck,
    fondo: 'fondo-brillante',
    ruta: '/usuarios/perfiles',
  },
  {
    titulo: 'Cambio y baja de libros',
    texto: 'Edita fichas, cambia el estado de las copias o retira ejemplares.',
    icono: BookOpen,
    fondo: 'fondo-azul',
    ruta: '/libros',
  },
  {
    titulo: 'Solicitud de compra',
    texto: 'Pide libros nuevos o más copias; Tesorería acepta o rechaza.',
    icono: ShoppingCart,
    fondo: 'fondo-dorado',
    ruta: '/libros/solicitar',
  },
  {
    titulo: 'Buscar libros',
    texto: 'Consulta el catálogo con filtros por título, autor, tema y más.',
    icono: Search,
    fondo: 'fondo-brillante',
    ruta: '/catalogo',
  },
];

/*
 * Componente: PaginaPanel
 * Objetivo: Panel del administrador con indicadores y accesos rápidos.
 * Uso: <PaginaPanel />
 */
export function PaginaPanel()
{
  const { resumen, error, cargando } = useControladorPanel();
  const navegar = useNavigate();

  const indicadores = resumen && [
    {
      valor: resumen.usuarios_validos.toLocaleString('es-MX'),
      etiqueta: 'Usuarios válidos',
      icono: Users,
      fondo: 'fondo-azul',
      insignia: ['exito', 'Al corriente'],
    },
    {
      valor: resumen.solicitudes_pendientes,
      etiqueta: 'Solicitudes de compra',
      icono: ShoppingCart,
      fondo: 'fondo-brillante',
      insignia: ['advertencia', 'Pendientes'],
    },
    {
      valor: resumen.libros_activos,
      etiqueta: 'Libros activos',
      icono: Library,
      fondo: 'fondo-dorado',
      insignia: ['exito', 'En catálogo'],
    },
  ];

  return (
    <Pagina miga="Inicio · Panel" titulo="Panel">
      <AlertaError error={error} />
      {cargando && !resumen && <Cargando />}
      {resumen && (
        <>
          <div className="rejilla-3">
            {indicadores.map((ind) => (
              <Tarjeta key={ind.etiqueta}>
                <div className="fila espacio-16">
                  <div className={`tarjeta-accion-icono ${ind.fondo}`}>
                    <ind.icono size={20} aria-hidden />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--fuente-titulos)',
                        fontSize: 30,
                        fontWeight: 700,
                        lineHeight: '34px',
                      }}
                    >
                      {ind.valor}
                    </div>
                    <div className="texto-secundario" style={{ fontSize: 14 }}>
                      {ind.etiqueta}
                    </div>
                  </div>
                </div>
                <div className="margen-arriba-16">
                  <Insignia tono={ind.insignia[0]}>{ind.insignia[1]}</Insignia>
                </div>
              </Tarjeta>
            ))}
          </div>

          <h2 className="margen-arriba-32 margen-abajo-16">Accesos rápidos</h2>
          <div className="rejilla-3">
            {ACCESOS.map((elemento) => (
              <button
                key={elemento.titulo}
                type="button"
                className="tarjeta tarjeta-accion"
                onClick={() => navegar(elemento.ruta)}
              >
                <div className={`tarjeta-accion-icono ${elemento.fondo}`}>
                  <elemento.icono size={20} aria-hidden />
                </div>
                <div>
                  <div className="tarjeta-accion-titulo">{elemento.titulo}</div>
                  <p className="texto-nota margen-arriba-8" style={{ color: 'var(--texto-secundario)' }}>
                    {elemento.texto}
                  </p>
                </div>
                <ArrowRight className="tarjeta-accion-flecha" size={18} aria-hidden />
              </button>
            ))}
          </div>

        </>
      )}
    </Pagina>
  );
}
