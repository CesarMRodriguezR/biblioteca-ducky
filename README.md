# Biblio · Universidad Ducky

Sistema de biblioteca construido a partir del prototipo de Figma (*Wireframes*)
y del diagrama de base de datos (.drawio):

- **API REST**: Node.js 22 + Express 5 sobre **MariaDB** (`server/`).
- **Web**: React 18 + Vite (`web/`), pantallas del flujo web del prototipo.
- **Móvil**: React Native + Expo SDK 58 (`mobile/`), pantallas del flujo "Teléfono".

Los tres siguen el patrón **MVC** y comparten la misma API y la misma base de datos.

```
biblioteca-ducky/
├── database/
│   ├── 01_schema.sql      24 tablas del diagrama + ajustes del prototipo, vista vw_catalogo
│   ├── 02_seed.sql        Perfiles, funciones, usuarios, 19 libros, préstamos, órdenes…
│   └── ejemplos/          Lista de Servicios Escolares para probar la carga de usuarios
├── server/                API (Modelo + Controlador)
│   ├── src/models/        SQL parametrizado, transacciones y reglas de negocio
│   ├── src/controllers/   Reciben la petición, revisan permisos y responden
│   ├── src/routes/        URL → autenticación → permiso → validación → controlador
│   ├── src/middlewares/   auth (JWT + funciones), validar (zod), errorHandler
│   ├── src/validators/    Esquemas zod con mensajes del prototipo
│   └── test/              22 pruebas de integración (node:test)
├── web/src/
│   ├── models/            Acceso a la API y reglas del dominio (estados, formatos)
│   ├── controllers/       Hooks por pantalla: estado, validación y acciones
│   ├── views/             layouts, components y pages (solo presentación)
│   └── routes/            Rutas protegidas por sesión y por función
└── mobile/src/
    ├── models/            Igual que web; el token se guarda en SecureStore
    ├── controllers/       Hooks por pantalla
    ├── views/             tema, components y screens
    └── routes/            React Navigation: Login | pestañas Buscar / Perfil
```

## MVC en este proyecto

| Capa | Servidor | Web y móvil |
|---|---|---|
| **Modelo** | `server/src/models`: consultas, transacciones y reglas (copias en préstamo, ISBN inmutable, bloqueo tras 5 intentos…). | `models/`: llamadas a la API (`LibroModel.buscar`, `AuthModel.iniciarSesion`…) y reglas de presentación del dominio (`dominio.js`). |
| **Controlador** | `server/src/controllers` + `routes`: permisos por función, validación y respuesta HTTP. | `controllers/`: un hook por pantalla (`useEditarLibroController`, `useBusquedaController`…) que maneja estado, validación previa y navegación. |
| **Vista** | — (JSON / PDF) | `views/`: componentes que solo pintan lo que el controlador les entrega. |

## Puesta en marcha

Requisitos: MariaDB 10.6+ y Node.js 20+.

```bash
# 1. Base de datos
mariadb -u root < database/01_schema.sql
mariadb -u root < database/02_seed.sql
mariadb -u root -e "CREATE USER IF NOT EXISTS 'ducky'@'localhost' IDENTIFIED BY 'tu-contraseña';
                    GRANT ALL ON biblioteca_ducky.* TO 'ducky'@'localhost';"

# 2. API  →  http://localhost:3000/api
cd server
cp .env.example .env        # ajusta DB_PASSWORD y JWT_SECRET
npm install
npm run dev
npm run db:reset && npm test   # reinicia la BD con la semilla y corre las 22 pruebas

# 3. Web  →  http://localhost:5173  (el proxy de Vite manda /api al puerto 3000)
cd ../web
npm install
npm run dev                 # npm run build genera web/dist

# 4. Móvil (Expo Go en el teléfono, emulador o navegador)
cd ../mobile
cp .env.example .env        # EXPO_PUBLIC_API_URL con la IP de tu computadora
npm install
npx expo start              # escanea el QR con Expo Go; "w" abre la versión web
```

En un teléfono físico `localhost` es el propio teléfono, por eso
`EXPO_PUBLIC_API_URL` debe apuntar a la IP de la computadora en la red local
(p. ej. `http://192.168.1.50:3000/api`). Sin esa variable la app usa
`10.0.2.2` en el emulador de Android y `localhost` en iOS/web.

## Usuarios de prueba

Contraseña de todos: `Ducky2026!`

| Usuario | Matrícula / nómina | Perfil | Qué ve |
|---|---|---|---|
| `felipe.rodriguez` | 1001133 | Administrador | Panel, Usuarios, Libros, Catálogo (todo) |
| `catherine.ramirez` | 2004720 | Bibliotecario | Libros (alta, edición, bajas) y Catálogo |
| `javier.saavedra` | 1987345 | Profesor | Catálogo |
| `marcela.guerra` | 3105843 | Alumno | Catálogo |
| `cesar.rodriguez` | 2005872 | Colaborador | Catálogo |
| `luis.moreno` | 3120558 | Alumno | Tiene 1 préstamo y $45 de multa (para probar bajas rechazadas) |

Cinco intentos fallidos bloquean la cuenta; `npm run db:reset` la restablece.

## Perfiles y funciones

Los permisos salen de **Perfiles → PerfilFuncion → Funciones**. La API revisa el
código de función en cada ruta, y la web y la app muestran u ocultan menús y
botones con las mismas funciones, así que basta con cambiar la asignación
(pantalla *Perfiles y funciones*) para cambiar lo que ve cada rol.

| Función | Admin | Bibliotecario | Profesor | Alumno | Colaborador |
|---|:-:|:-:|:-:|:-:|:-:|
| gestionar_usuarios | ✔ | | | | |
| gestionar_libros | ✔ | ✔ | | | |
| buscar_libros | ✔ | ✔ | ✔ | ✔ | ✔ |
| generar_listado | ✔ | | | | |
| solicitar_compra | ✔ | | | | |
| gestionar_compras | ✔ | | | | |
| solicitar_prestamo | ✔ | ✔ | ✔ | ✔ | ✔ |
| gestionar_prestamos | ✔ | ✔ | | | |
| registrar_devolucion | ✔ | ✔ | | | |
| renovar_prestamo | ✔ | ✔ | ✔ | ✔ | ✔ |
| gestionar_multas | ✔ | ✔ | | | |
| lista_espera | ✔ | ✔ | ✔ | ✔ | ✔ |
| gestionar_politicas | ✔ | | | | |
| usar_chatbot | ✔ | ✔ | ✔ | ✔ | ✔ |
| gestionar_chatbot | ✔ | | | | |

El perfil Administrador está protegido: sus funciones no se pueden modificar.

## Pantallas del prototipo implementadas

**Web**

| Clave | Pantalla | Ruta |
|---|---|---|
| GU01 | Inicio de sesión (vacío, incompleto, datos incorrectos, bloqueo) | `/login` |
| — | Panel del administrador (usuarios válidos, solicitudes, libros activos, actividad) | `/panel` |
| GU02 | Usuarios válidos, consulta por matrícula, cambio de datos, carga de lista, bajas por lista, perfiles y funciones | `/usuarios/…` |
| GL02 | Alta de libro con ISBN validado primero y ejemplares con ubicación | `/libros/nuevo` |
| GL04 | Editar ficha (ISBN bloqueado, libro inactivo) y estado de cada copia | `/libros/:id/editar` |
| GL03 | Baja: retirar una copia con motivo, o activar/inactivar el libro | `/libros/:id/baja` |
| GL01 | Solicitar libros nuevos o más copias, solicitudes pendientes y editoriales | `/libros/solicitar`, `/libros/:id/solicitar` |
| BL01 | Catálogo: búsqueda por campo, orden y paginación de 6 | `/catalogo` |
| GL06 | Vista previa del listado, impresión y PDF | `/catalogo?listado=1` |
| GL05 | Ficha bibliográfica (completa para quien gestiona libros, resumida para los demás) | `/catalogo/:id` |

**Móvil**: Inicio de sesión (con sus cuatro estados), Inicio (saludo, buscador,
filtros y recomendados), Buscar (resultados y búsqueda sin filtro con carga de 6
en 6), Detalle (códigos de copia para administrador/bibliotecario, conteo por
estado para los demás) y Perfil.

Préstamos, devoluciones, multas, lista de espera, políticas y chatbot existen en
la base de datos y en la API (con pruebas), pero el prototipo no tiene pantallas
para ellos, así que no se agregaron vistas.

## Estados y reglas

- **Usuario**: `Activo` (se muestra como *Válido*) · `Inactivo` · `Bloqueado` (5 intentos fallidos).
- **Libro**: `Activo` · `Inactivo`. Un libro inactivo no aparece en el catálogo ni se puede editar; solo se inactiva si ninguna copia está en préstamo.
- **Copia**: `Disponible` (consulta en sala) · `Consulta externa` (se presta a domicilio) · `En prestamo` y `Apartado` (los asigna el sistema) · `Baja` con motivo `Perdido`, `Robado`, `Danado` u `Obsoleto`. Una copia prestada no cambia de estado ni se retira hasta devolverse.
- **Solicitud de compra**: `Pendiente → En revision → Aprobada → Recibida`, o `Rechazada`. Al recibirse se agregan las copias.
- **Préstamo**: 7 días, máximo 3 activos, 2 renovaciones, $10 por día de retraso; solo se prestan copias de *Consulta externa*.
- **Ficha**: el ISBN no cambia después del alta; el número de copias solo aumenta (para reducir se da de baja una copia).

## API

Todas las rutas van bajo `/api` y, salvo `POST /auth/login`, `GET /salud` y la
lectura de políticas, requieren `Authorization: Bearer <token>`.

| Módulo | Rutas | Función requerida |
|---|---|---|
| Sesión | `POST /auth/login` · `GET /auth/me` · `PUT /auth/contrasena` | — |
| Panel | `GET /panel` | gestionar_usuarios |
| Usuarios | `GET /usuarios` · `GET /usuarios/:id` · `GET /usuarios/matricula/:m` · `POST /usuarios` · `PUT /usuarios/:id` | gestionar_usuarios |
| Carga y bajas por lista | `POST /usuarios/carga/validar` · `POST /usuarios/carga` · `POST /usuarios/bajas/revisar` · `POST /usuarios/bajas` | gestionar_usuarios |
| Perfiles | `GET/POST /perfiles` · `GET/PUT/DELETE /perfiles/:id` · `PUT /perfiles/:id/funciones` | gestionar_usuarios |
| Catálogo | `GET /libros?q=&campo=&orden=&limit=&offset=` · `GET /libros/:id` | buscar_libros o gestionar_libros |
| Listado | `GET /libros/listado` · `GET /libros/listado.pdf` | generar_listado |
| Libros | `GET /libros/isbn/:isbn` · `POST /libros` · `PUT /libros/:id` · `PATCH /libros/:id/estatus` | gestionar_libros |
| Copias | `GET/POST /libros/:id/ejemplares` · `PUT /libros/:id/ejemplares/:n` · `POST /libros/:id/ejemplares/:n/baja` | gestionar_libros |
| Editoriales, autores, temas | CRUD `/editoriales`, `/autores`, `/temas` | lectura: catálogo · escritura: gestionar_libros (editoriales también solicitar_compra) |
| Compras | `GET /ordenes-compra` · `GET /ordenes-compra/solicitudes` · `POST /ordenes-compra` · `PATCH /ordenes-compra/:id/estatus` | solicitar_compra · gestionar_compras |
| Préstamos | `GET/POST /prestamos` · `POST /prestamos/:id/renovacion` · `POST /prestamos/:id/devolucion` | solicitar_prestamo · renovar_prestamo · registrar_devolucion |
| Multas | `GET /multas` · `POST /multas` · `POST /multas/:id/pago` | consulta propia · gestionar_multas |
| Lista de espera | `GET/POST /lista-espera` · `DELETE /lista-espera/:id` | lista_espera |
| Políticas | `GET /politicas` (pública) · `POST/PUT/DELETE /politicas/:id` | gestionar_politicas |
| Chatbot | `POST /chatbot/preguntar` · `GET /chatbot/frecuentes` · CRUD `/chatbot/preguntas` | usar_chatbot · gestionar_chatbot |

Errores: `{ "error": "mensaje", "detalles": … }`. 400 trae un mensaje por campo
(`[{ campo, mensaje }]`); 409 trae `detalles.codigo` (`ISBN_DUPLICADO`,
`COPIAS_EN_PRESTAMO`, `LIBRO_INACTIVO`, `CUENTA_BLOQUEADA`…).

## Cambios al diagrama de base de datos

Todos están marcados con `[PROTOTIPO]` en `01_schema.sql`:

- **Usuarios**: `Nombre_Usuario` (el login del prototipo es por usuario), `Nombre_Completo`, `Correo`, `Intentos_Fallidos` y estatus `Bloqueado`.
- **Ejemplares**: `Codigo` (EJ-00101), `Pasillo`, `Estante`, `Nivel`, `Motivo_Baja`, `Fecha_Alta` y los estados del prototipo.
- **NuevosLibros**: `Anio`, `Tema` y `Sinopsis`, porque la solicitud de compra los pide.
- **OrdenesCompra**: estado `En revision`.
- **Bitacora**: nueva, alimenta la "Actividad reciente" del panel.
- `Año` → `Anio` y `Lista de Espera` → `ListaEspera` (identificadores sin acentos ni espacios); `Contrasena_Usuario` guarda un hash bcrypt; las relaciones 0..1 se aplican con índices `UNIQUE`.
- La vista `vw_catalogo` reúne autores, temas, disponibilidad y ubicación para las búsquedas.
- Las portadas se generan a partir del tema, porque la BD no guarda imágenes.

## Estándar de codificación

El código está escrito en español (dominio, variables y mensajes), con ESM en
web/móvil y CommonJS en el servidor. Cuando llegue el documento del estándar de
codificación del equipo, todo el código se ajustará a él.
