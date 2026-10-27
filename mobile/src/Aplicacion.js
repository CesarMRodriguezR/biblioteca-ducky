/*
 * ******************************************************************
 * Nombre del programa: MOVIL-APLICACION · Aplicacion.js
 * Función: Componente raíz: área segura, proveedor de sesión, barra de estado y navegación.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Ninguna
 * Salida: Aplicación montada
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente   Objetivo
 *     Aplicacion   Biblio · Universidad Ducky — app móvil (React Native +…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se registra en index.js; no debe importarse desde otras pantallas.
 * ******************************************************************
 */

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProveedorSesion } from './controladores/ControladorSesion';
import { NavegadorAplicacion } from './rutas/NavegadorAplicacion';

/*
 * Componente: Aplicacion
 * Objetivo: Biblio · Universidad Ducky — app móvil (React Native + Expo, MVC).
 * Uso: <Aplicacion />
 */
export default function Aplicacion()
{
  return (
    <SafeAreaProvider>
      <ProveedorSesion>
        <StatusBar style="dark" />
        <NavegadorAplicacion />
      </ProveedorSesion>
    </SafeAreaProvider>
  );
}
