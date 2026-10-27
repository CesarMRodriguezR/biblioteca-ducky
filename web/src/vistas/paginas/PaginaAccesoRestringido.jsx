/*
 * ******************************************************************
 * Nombre del programa: WEB-ACCESO · PaginaAccesoRestringido.jsx
 * Función: Aviso de acceso restringido cuando el perfil no tiene la función.
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
 *     Componente                Objetivo
 *     PaginaAccesoRestringido   BD-SPxx "Validación del perfil de usuario": el perfil no…
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

import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useSesion } from '../../controladores/ControladorSesion.jsx';
import { RutaInicial } from '../../modelos/ModeloAutenticacion.js';
import { Pagina } from '../plantillas/PlantillaAplicacion.jsx';
import { Alerta, Boton, Tarjeta } from '../componentes/interfaz.jsx';

/*
 * Componente: PaginaAccesoRestringido
 * Objetivo: BD-SPxx "Validación del perfil de usuario": el perfil no tiene la función.
 * Uso: <PaginaAccesoRestringido funcion={…} />
 */
export function PaginaAccesoRestringido({ funcion })
{
  const { usuario } = useSesion();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const destino = RutaInicial(usuario);

  return (
    <Pagina miga={funcion} titulo="Acceso restringido">
      <Tarjeta style={{ maxWidth: 640, margin: '24px auto 0', padding: 32, textAlign: 'center' }}>
        <div
          style={{
            width: 44,
            height: 32,
            borderRadius: 16,
            background: 'var(--error-fondo)',
            color: 'var(--error)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px',
          }}
        >
          <ShieldAlert size={20} aria-hidden />
        </div>
        <h2 style={{ fontSize: 22 }}>Tu perfil no tiene permiso para esta función</h2>
        <p className="texto-secundario margen-arriba-16" style={{ fontSize: 14.5 }}>
          Intentaste entrar a <strong>{funcion}</strong>. Esta función no está habilitada para el
          perfil <strong>{usuario.Nombre_Rol}</strong>. Si la necesitas, pide al administrador que
          la active en Gestión de perfiles.
        </p>
        <div
          className="fila espacio-8 margen-arriba-16"
          style={{
            border: '1px solid var(--linea-divisoria)',
            borderRadius: 10,
            padding: '10px 14px',
            background: 'var(--fondo-gris)',
            fontSize: 13,
            color: 'var(--texto-secundario)',
          }}
        >
          <Lock size={14} aria-hidden /> {window.location.host}
          {ubicacion.pathname}
        </div>
        <div className="margen-arriba-16" style={{ textAlign: 'left' }}>
          <Alerta tipo="informacion" titulo="No se hizo ningún cambio en la base de datos." />
        </div>
        <Boton className="margen-arriba-24" icono={ArrowLeft} onClick={() => navegar(destino)}>
          {destino === '/catalogo' ? 'Ir al catálogo' : 'Ir al inicio'}
        </Boton>
      </Tarjeta>
    </Pagina>
  );
}
