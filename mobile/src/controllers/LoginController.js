import { useState } from 'react';
import { useSesion } from './SesionController';

/**
 * Inicio de sesión móvil. Estados del prototipo: falta usuario, falta
 * contraseña, campos vacíos, datos incorrectos y cuenta bloqueada.
 */
export function useLoginController() {
  const { iniciarSesion } = useSesion();
  const [form, setForm] = useState({ usuario: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function enviar() {
    const faltaUsuario = !form.usuario.trim();
    const faltaContrasena = !form.contrasena;
    if (faltaUsuario || faltaContrasena) {
      setErrores({
        usuario: faltaUsuario ? 'Ingresa tu usuario.' : undefined,
        contrasena: faltaContrasena ? 'Ingresa tu contraseña.' : undefined,
      });
      setAviso({
        tipo: 'advertencia',
        titulo: faltaUsuario && faltaContrasena
          ? 'Completa los campos para continuar.'
          : `Falta ${faltaUsuario ? 'el usuario' : 'la contraseña'}.`,
      });
      return;
    }

    setEnviando(true);
    setAviso(null);
    try {
      await iniciarSesion(form.usuario, form.contrasena);
    } catch (error) {
      const restantes = error.detalles?.intentosRestantes;
      setErrores({ usuario: ' ', contrasena: ' ' });
      setAviso({
        tipo: 'error',
        titulo: error.status === 401 ? 'Usuario o contraseña incorrectos.' : error.message,
        texto: error.status === 401
          ? `Revisa tus datos e inténtalo de nuevo.${restantes !== undefined ? ` Te ${restantes === 1 ? 'queda 1 intento' : `quedan ${restantes} intentos`}.` : ''}`
          : null,
      });
    } finally {
      setEnviando(false);
    }
  }

  return { form, errores, aviso, enviando, cambiar, enviar };
}
