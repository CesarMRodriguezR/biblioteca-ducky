# Biblio · Universidad Ducky

Sistema de biblioteca: API (Node 22 + Express 5 + MariaDB) en `server/`, web (React 18 + Vite)
en `web/` y móvil (React Native + Expo SDK 58) en `mobile/`. Los tres siguen MVC y comparten
la misma API. El README.md explica la puesta en marcha, la API y los usuarios de prueba.

## Referencias de diseño

- Prototipo de Figma (fuente de verdad de pantallas, estados, textos y estilos):
  https://www.figma.com/design/WumonvpJBScdVhU5meQO9M/Wireframes
  - Página "Web. Flujo general" (node-id 711-3732): versión web.
  - Página "Telefono" (node-id 3-15396): versión móvil.
  - Para revisar una pantalla, usa el servidor MCP de Figma con el enlace del nodo.
- Diagrama de base de datos: `database/01_schema.sql` implementa el diagrama (.drawio).
  Los cambios hechos para el prototipo están marcados con `[PROTOTIPO]`.
- Estándar de codificación del equipo (Google Doc):
  https://docs.google.com/document/d/1-pTQxAPe-powuGviQ-U3GL0wFhvfJEsxvDQd63SigV0/edit

## Comandos

```bash
# server/
npm run dev                      # API en http://localhost:3000/api
npm run db:reset && npm test     # reinicia la BD con la semilla y corre las pruebas
npm run lint

# web/
npm run dev                      # http://localhost:5173 (Vite redirige /api al 3000)
npm run build
npm run lint

# mobile/
npx expo start                   # "w" abre la versión web
npm run lint
```

Ejecuta `npm run db:reset` antes de `npm test`: las pruebas dependen de la semilla.

## Estructura (MVC)

- `server/src/`: `modelos/` (SQL y reglas), `controladores/`, `rutas/`, `intermediarios/`
  (autenticación, validación, errores), `validaciones/` (zod), `configuracion/`, `utilidades/`.
  Pruebas en `server/pruebas/`.
- `web/src/` y `mobile/src/`: `modelos/` (API y dominio), `controladores/` (un hook
  `useControladorX` por pantalla), `vistas/` (solo presentación), `rutas/`.
  Web: `vistas/paginas/PaginaX.jsx`; móvil: `vistas/pantallas/PantallaX.js`.
- Las vistas nunca llaman a la API; los controladores no devuelven JSX.

## Estándar de codificación (obligatorio en todo cambio)

- Variables, parámetros y props en `snake_case`; props de callback como `al_cambio`.
- Funciones y métodos en `CamelCase` (`IniciarSesion`), incluidas las acciones que devuelve un
  controlador (`controlador.GuardarFicha`); setters de useState `SetX`.
- Hooks: `use` + `CamelCase`. Constantes en `SNAKE_CASE`. Clases, componentes y módulos en
  `CamelCase`.
- Se conservan los nombres de columnas de la BD (`Nombre_Completo`, `id_libro`) y de las APIs
  de librerías (`onClick`, `className`, `onPress`).
- Carpetas, archivos, identificadores y mensajes en español; cada archivo se llama como lo que
  exporta.
- Llaves de apertura y cierre en líneas separadas y alineadas (Allman), en JS y CSS; sangría de
  2 espacios, comillas simples, punto y coma, máximo 100 caracteres por línea.
- Módulos ES (`import`/`export`) en los tres paquetes.
- Cada archivo empieza con los bloques del estándar: encabezado (Nombre del programa, Función,
  Autor: Equipo CCJMops, Fecha DD/MM/AAAA, Entrada, Salida, Nomenclatura), "Contenido de
  listado" e "Instrucciones de reutilización". Copia el formato de un archivo existente.
- Cada función, hook, componente, clase o constante exportada lleva su bloque de comentario
  (Función/Hook: Objetivo, Entrada, Salida; Componente: Objetivo, Uso; Clase: Objetivo).
  Las secciones principales llevan un bloque `Sección:` / `Objetivo:`.
- CSS: clases y propiedades personalizadas en `kebab-case` en español (`boton-primario`,
  `--azul-principal`), colores hexadecimales en minúsculas, una declaración por línea.
- Al terminar un cambio, corre `npm run lint` en el paquete modificado. No formatees con
  Prettier: deshace las llaves en estilo Allman.
