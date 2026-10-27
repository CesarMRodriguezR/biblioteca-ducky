/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU01 · ControladorInicioSesion.js
 * Función: Formulario de inicio de sesión y sus estados de error.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Parámetros de la ruta y acciones del usuario en la pantalla
 * Salida: Estado y acciones que consume la vista
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Hook                         Objetivo
 *     useControladorInicioSesion   BD-SP01-GU01 Autenticación. Estados: inicial, campos…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado, valida y llama al
 *     modelo.
 * (2) No devuelve JSX y no llama a la API directamente; usa los modelos de src/modelos.
 * (3) Los hooks solo se llaman en el nivel superior del componente, nunca dentro de condiciones
 *     o ciclos.
 * (4) Todo componente que lo use debe estar dentro de ProveedorSesion.
 * ******************************************************************
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from './ControladorSesion.jsx';
import { RutaInicial } from '../modelos/ModeloAutenticacion.js';

/*
 * Hook: useControladorInicioSesion
 * Objetivo: BD-SP01-GU01 Autenticación. Estados: inicial, campos incompletos, credenciales
 *           incorrectas (con intentos restantes) y cuenta bloqueada.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorInicioSesion()
{
  const { iniciar_sesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [form, SetForm] = useState({ usuario: '', contrasena: '' });
  const [errores, SetErrores] = useState({});
  const [aviso, SetAviso] = useState(null);
  const [enviando, SetEnviando] = useState(false);

  const Cambiar = (campo) => (evento) =>
  {
    SetForm((form_previo) => ({ ...form_previo, [campo]: evento.target.value }));
    SetErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function Enviar(evento)
  {
    evento.preventDefault();
    const faltantes = {};
    if (!form.usuario.trim())
    {
      faltantes.usuario = 'Este campo es obligatorio.';
    }
    if (!form.contrasena)
    {
      faltantes.contrasena = 'Este campo es obligatorio.';
    }
    if (Object.keys(faltantes).length)
    {
      SetErrores(faltantes);
      SetAviso({ tipo: 'advertencia', titulo: 'Completa los campos marcados para continuar.' });
      return;
    }

    SetEnviando(true);
    SetAviso(null);
    try
    {
      const usuario = await iniciar_sesion(form.usuario, form.contrasena);
      navegar(ubicacion.state?.desde || RutaInicial(usuario), { replace: true });
    }
    catch (error)
    {
      const restantes = error.detalles?.intentos_restantes;
      SetErrores({ usuario: ' ', contrasena: ' ' });
      SetAviso({
        tipo: 'error',
        titulo: error.message,
        texto:
          error.status === 401
            ? `Verifica tus datos e inténtalo de nuevo.${restantes !== undefined ? ` Te ${restantes === 1 ? 'queda 1 intento' : `quedan ${restantes} intentos`}.` : ''}`
            : null,
      });
    }
    finally
    {
      SetEnviando(false);
    }
  }

  return { form, errores, aviso, enviando, cambiar: Cambiar, enviar: Enviar };
}
