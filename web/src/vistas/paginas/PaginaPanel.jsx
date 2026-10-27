/*
 * ******************************************************************
 * Nombre del programa: WEB-PANEL · PaginaPanel.jsx
 * Función: Panel del administrador con indicadores, accesos rápidos y actividad reciente.
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
  ChevronRight,
  Clock,
  Library,
  ListChecks,
  PenLine,
  ShoppingCart,
  UserRound,
  Users,
} from 'lucide-react';
import { useControladorPanel } from '../../controladores/ControladorPanel.js';
import { TiempoRelativo } from '../../modelos/dominio.js';
import { Pagina } from '../plantillas/PlantillaAplicacion.jsx';
import { AlertaError, Cargando, Insignia, Tarjeta } from '../componentes/interfaz.jsx';

/*
 * Constante: ACCESOS
 * Objetivo: Accesos rápidos del panel.
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
];

/*
 * Componente: PaginaPanel
 * Objetivo: Panel del administrador con indicadores, accesos rápidos y actividad reciente.
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

          <h2 className="margen-arriba-32 margen-abajo-16">Actividad reciente</h2>
          <Tarjeta relleno={false}>
            {resumen.actividad.length === 0 && (
              <p className="tabla-vacia">Aún no hay actividad registrada.</p>
            )}
            {resumen.actividad.map((elemento, indice) => (
              <div
                key={elemento.id_bitacora}
                className="fila espacio-16"
                style={{
                  padding: '16px 20px',
                  borderTop: indice ? '1px solid var(--linea-divisoria)' : 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--informacion-fondo)',
                    color: 'var(--azul-principal)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={18} aria-hidden />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{elemento.Descripcion}</div>
                  <div className="texto-nota">{elemento.Nombre_Completo ?? 'Sistema'}</div>
                </div>
                <span className="texto-nota">{TiempoRelativo(elemento.Fecha)}</span>
                <ChevronRight size={18} aria-hidden />
              </div>
            ))}
          </Tarjeta>
        </>
      )}
    </Pagina>
  );
}
