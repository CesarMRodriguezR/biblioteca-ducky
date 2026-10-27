import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from './SesionController';
import { rutaInicial } from '../models/AuthModel';

/**
 * BD-SP01-GU01 Autenticación. Estados: inicial, campos incompletos,
 * credenciales incorrectas (con intentos restantes) y cuenta bloqueada.
 */
export function useLoginController() {
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [form, setForm] = useState({ usuario: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function enviar(e) {
    e.preventDefault();
    const faltantes = {};
    if (!form.usuario.trim()) faltantes.usuario = 'Este campo es obligatorio.';
    if (!form.contrasena) faltantes.contrasena = 'Este campo es obligatorio.';
    if (Object.keys(faltantes).length) {
      setErrores(faltantes);
      setAviso({ tipo: 'advertencia', titulo: 'Completa los campos marcados para continuar.' });
      return;
    }

    setEnviando(true);
    setAviso(null);
    try {
      const usuario = await iniciarSesion(form.usuario, form.contrasena);
      navegar(ubicacion.state?.desde || rutaInicial(usuario), { replace: true });
    } catch (error) {
      const restantes = error.detalles?.intentosRestantes;
      setErrores({ usuario: ' ', contrasena: ' ' });
      setAviso({
        tipo: 'error',
        titulo: error.message,
        texto: error.status === 401
          ? `Verifica tus datos e inténtalo de nuevo.${restantes !== undefined ? ` Te ${restantes === 1 ? 'queda 1 intento' : `quedan ${restantes} intentos`}.` : ''}`
          : null,
      });
    } finally {
      setEnviando(false);
    }
  }

  return { form, errores, aviso, enviando, cambiar, enviar };
}
