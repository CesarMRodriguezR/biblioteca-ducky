/*
 * ******************************************************************
 * Nombre del programa: WEB-PRINCIPAL · principal.jsx
 * Función: Punto de entrada de la versión web: monta las rutas dentro del proveedor de sesión.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Elemento #raiz de index.html
 * Salida: Aplicación React montada
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProveedorSesion } from './controladores/ControladorSesion.jsx';
import { RutasAplicacion } from './rutas/RutasAplicacion.jsx';
import './estilos/estilos-globales.css';

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorSesion>
        <RutasAplicacion />
      </ProveedorSesion>
    </BrowserRouter>
  </StrictMode>,
);
