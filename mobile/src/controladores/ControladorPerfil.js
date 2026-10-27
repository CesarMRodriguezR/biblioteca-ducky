/*
 * ******************************************************************
 * Nombre del programa: MOVIL-PERFIL · ControladorPerfil.js
 * Función: Datos del usuario para la pantalla de perfil y cierre de sesión.
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
 *     Hook                   Objetivo
 *     useControladorPerfil   Perfil: datos del usuario y cierre de sesión
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

import { Alert, Platform } from 'react-native';
import { EtiquetaIdentificador, Iniciales } from '../modelos/dominio';
import { useSesion } from './ControladorSesion';

/*
 * Hook: useControladorPerfil
 * Objetivo: Perfil: datos del usuario y cierre de sesión.
 * Entrada: Ninguna
 * Salida: Objeto con el estado y las acciones de la pantalla
 */
export function useControladorPerfil()
{
  const { usuario, CerrarSesion } = useSesion();

  function ConfirmarCierre()
  {
    if (Platform.OS === 'web')
    {
      CerrarSesion();
      return;
    }
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: CerrarSesion },
    ]);
  }

  return {
    nombre: usuario?.Nombre_Completo ?? '',
    rol: usuario?.Nombre_Rol ?? '',
    iniciales: Iniciales(usuario?.Nombre_Completo),
    datos: [
      { icono: 'id', etiqueta: EtiquetaIdentificador(usuario), valor: usuario?.Matricula_Nomina },
      {
        icono: 'correo',
        etiqueta: 'Correo institucional',
        valor: usuario?.Correo || 'Sin correo registrado',
      },
    ],
    CerrarSesion: ConfirmarCierre,
  };
}
