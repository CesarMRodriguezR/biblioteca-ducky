import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ChevronRight, Clock, Library, ListChecks, PenLine, ShoppingCart, UserRound, Users,
} from 'lucide-react';
import { usePanelController } from '../../controllers/PanelController';
import { tiempoRelativo } from '../../models/dominio';
import { Pagina } from '../layouts/AppLayout';
import { AlertaError, Cargando, Insignia, Tarjeta } from '../components/ui';

const ACCESOS = [
  {
    titulo: 'Alta de usuarios', texto: 'Carga la lista de nuevos usuarios y asigna su rol.',
    icono: UserRound, fondo: 'fondo-azul', ruta: '/usuarios/carga',
  },
  {
    titulo: 'Alta de libro', texto: 'Registra una ficha nueva o agrega ejemplares a una existente.',
    icono: PenLine, fondo: 'fondo-dorado', ruta: '/libros/nuevo',
  },
  {
    titulo: 'Generar listado', texto: 'Consulta el catálogo e imprime o guarda el listado en PDF.',
    icono: ListChecks, fondo: 'fondo-brillante', ruta: '/catalogo?listado=1',
  },
];

export function PanelPage() {
  const { resumen, error, cargando } = usePanelController();
  const navegar = useNavigate();

  const indicadores = resumen && [
    { valor: resumen.usuariosValidos.toLocaleString('es-MX'), etiqueta: 'Usuarios válidos', icono: Users, fondo: 'fondo-azul', insignia: ['exito', 'Al corriente'] },
    { valor: resumen.solicitudesPendientes, etiqueta: 'Solicitudes de compra', icono: ShoppingCart, fondo: 'fondo-brillante', insignia: ['advertencia', 'Pendientes'] },
    { valor: resumen.librosActivos, etiqueta: 'Libros activos', icono: Library, fondo: 'fondo-dorado', insignia: ['exito', 'En catálogo'] },
  ];

  return (
    <Pagina miga="Inicio · Panel" titulo="Panel">
      <AlertaError error={error} />
      {cargando && !resumen && <Cargando />}
      {resumen && (
        <>
          <div className="grid-3">
            {indicadores.map((ind) => (
              <Tarjeta key={ind.etiqueta}>
                <div className="fila espacio-16">
                  <div className={`tarjeta-accion__icono ${ind.fondo}`}><ind.icono size={20} aria-hidden /></div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-titulos)', fontSize: 30, fontWeight: 700, lineHeight: '34px' }}>{ind.valor}</div>
                    <div className="texto-secundario" style={{ fontSize: 14 }}>{ind.etiqueta}</div>
                  </div>
                </div>
                <div className="mt-16"><Insignia tono={ind.insignia[0]}>{ind.insignia[1]}</Insignia></div>
              </Tarjeta>
            ))}
          </div>

          <h2 className="mt-32 mb-16">Accesos rápidos</h2>
          <div className="grid-3">
            {ACCESOS.map((a) => (
              <button key={a.titulo} type="button" className="card tarjeta-accion" onClick={() => navegar(a.ruta)}>
                <div className={`tarjeta-accion__icono ${a.fondo}`}><a.icono size={20} aria-hidden /></div>
                <div>
                  <div className="tarjeta-accion__titulo">{a.titulo}</div>
                  <p className="caption mt-8" style={{ color: 'var(--texto-secundario)' }}>{a.texto}</p>
                </div>
                <ArrowRight className="tarjeta-accion__flecha" size={18} aria-hidden />
              </button>
            ))}
          </div>

          <h2 className="mt-32 mb-16">Actividad reciente</h2>
          <Tarjeta relleno={false}>
            {resumen.actividad.length === 0 && <p className="tabla__vacia">Aún no hay actividad registrada.</p>}
            {resumen.actividad.map((a, i) => (
              <div
                key={a.id_bitacora}
                className="fila espacio-16"
                style={{ padding: '16px 20px', borderTop: i ? '1px solid var(--linea-divisoria)' : 0 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'var(--informacion-fondo)',
                  color: 'var(--azul-principal)', display: 'grid', placeItems: 'center', flexShrink: 0,
                }}
                >
                  <Clock size={18} aria-hidden />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{a.Descripcion}</div>
                  <div className="caption">{a.Nombre_Completo ?? 'Sistema'}</div>
                </div>
                <span className="caption">{tiempoRelativo(a.Fecha)}</span>
                <ChevronRight size={18} aria-hidden />
              </div>
            ))}
          </Tarjeta>
        </>
      )}
    </Pagina>
  );
}
