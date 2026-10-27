import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useSesion } from '../../controllers/SesionController';
import { rutaInicial } from '../../models/AuthModel';
import { Pagina } from '../layouts/AppLayout';
import { Alerta, Boton, Tarjeta } from '../components/ui';

/** BD-SPxx "Validación del perfil de usuario": el perfil no tiene la función. */
export function AccesoRestringidoPage({ funcion }) {
  const { usuario } = useSesion();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const destino = rutaInicial(usuario);

  return (
    <Pagina miga={funcion} titulo="Acceso restringido">
      <Tarjeta style={{ maxWidth: 640, margin: '24px auto 0', padding: 32, textAlign: 'center' }}>
        <div style={{
          width: 44, height: 32, borderRadius: 16, background: 'var(--error-fondo)', color: 'var(--error)',
          display: 'grid', placeItems: 'center', margin: '0 auto 12px',
        }}
        >
          <ShieldAlert size={20} aria-hidden />
        </div>
        <h2 style={{ fontSize: 22 }}>Tu perfil no tiene permiso para esta función</h2>
        <p className="texto-secundario mt-16" style={{ fontSize: 14.5 }}>
          Intentaste entrar a <strong>{funcion}</strong>. Esta función no está habilitada para el perfil{' '}
          <strong>{usuario.Nombre_Rol}</strong>. Si la necesitas, pide al administrador que la active en
          Gestión de perfiles.
        </p>
        <div
          className="fila espacio-8 mt-16"
          style={{
            border: '1px solid var(--linea-divisoria)', borderRadius: 10, padding: '10px 14px',
            background: 'var(--fondo-gris)', fontSize: 13, color: 'var(--texto-secundario)',
          }}
        >
          <Lock size={14} aria-hidden /> {window.location.host}{ubicacion.pathname}
        </div>
        <div className="mt-16" style={{ textAlign: 'left' }}>
          <Alerta tipo="informacion" titulo="No se hizo ningún cambio en la base de datos." />
        </div>
        <Boton className="mt-24" icono={ArrowLeft} onClick={() => navegar(destino)}>
          {destino === '/catalogo' ? 'Ir al catálogo' : 'Ir al inicio'}
        </Boton>
      </Tarjeta>
    </Pagina>
  );
}
