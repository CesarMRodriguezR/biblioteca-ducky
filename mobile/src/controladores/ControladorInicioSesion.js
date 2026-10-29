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
 *     useControladorInicioSesion   Inicio de sesión móvil. Estados del prototipo: falta…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Controlador del patrón MVC: un hook por pantalla que guarda el estado y llama al modelo.
 * (2) No devuelve JSX y no llama a la API directamente; usa los modelos de src/modelos.
 * (3) Los hooks solo se llaman en el nivel superior del componente, nunca dentro de condiciones
 *     o ciclos.
 * (4) Toda pantalla que lo use debe estar dentro de ProveedorSesion.
 * ******************************************************************
 */

import { useState } from 'react';
import { useSesion } from './ControladorSesion';

/*
 * Hook: useControladorInicioSesion
 * Objetivo: Inicio de sesión móvil. Estados del prototipo: falta usuario, falta contraseña,
 *           campos vacíos, datos incorrectos y cuenta inactiva.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorInicioSesion()
{
  const { IniciarSesion } = useSesion();
  const [form, SetForm] = useState({ usuario: '', contrasena: '' });
  const [errores, SetErrores] = useState({});
  const [aviso, SetAviso] = useState(null);
  const [enviando, SetEnviando] = useState(false);

  const Cambiar = (campo) => (valor) =>
  {
    SetForm((form_previo) => ({ ...form_previo, [campo]: valor }));
    SetErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function Enviar()
  {
    const falta_usuario = !form.usuario.trim();
    const falta_contrasena = !form.contrasena;
    if (falta_usuario || falta_contrasena)
    {
      SetErrores({
        usuario: falta_usuario ? 'Ingresa tu usuario.' : undefined,
        contrasena: falta_contrasena ? 'Ingresa tu contraseña.' : undefined,
      });
      SetAviso({
        tipo: 'advertencia',
        titulo:
          falta_usuario && falta_contrasena
            ? 'Completa los campos para continuar.'
            : `Falta ${falta_usuario ? 'el usuario' : 'la contraseña'}.`,
      });
      return;
    }

    SetEnviando(true);
    SetAviso(null);
    try
    {
      await IniciarSesion(form.usuario, form.contrasena);
    }
    catch (error)
    {
      SetErrores({ usuario: ' ', contrasena: ' ' });
      SetAviso({
        tipo: 'error',
        titulo: error.status === 401 ? 'Usuario o contraseña incorrectos.' : error.message,
        texto:
          error.status === 401
            ? 'Revisa tus datos e inténtalo de nuevo.'
            : null,
      });
    }
    finally
    {
      SetEnviando(false);
    }
  }

  return { form, errores, aviso, enviando, Cambiar, Enviar };
}
