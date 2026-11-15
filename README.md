# Biblio · Universidad Ducky

Sistema de biblioteca construido a partir del prototipo de Figma (*Wireframes*)
y del diagrama de base de datos (.drawio):

- **API REST**: Node.js 22 + Express 5 sobre **MariaDB** (`server/`).
- **Web**: React 18 + Vite (`web/`), pantallas del flujo web del prototipo.
- **Móvil**: React Native + Expo SDK 58 (`mobile/`), pantallas del flujo "Teléfono".
- **Sistemas externos simulados** (`externos/`): CIAA (alumnos), Empleados (nómina) y
  Tesorería, cada uno con su propia API y su propia base de datos.

Los tres primeros siguen el patrón **MVC** y comparten la misma API y la misma base de datos.
Biblio no entra a las bases de datos externas: las consulta por HTTP.

```
biblioteca-ducky/
├── database/
│   ├── 01_schema.sql        24 tablas del diagrama + ajustes del prototipo, vista vw_catalogo
│   └── 02_seed.sql          Perfiles, funciones, usuarios, 19 libros, préstamos, multas, chatbot…
├── externos/                Sistemas externos simulados (puerto 4000)
│   ├── database/            ciaa_ducky, empleados_ducky y tesoreria_ducky (una BD por sistema)
│   ├── src/                 /ciaa/api, /empleados/api y /tesoreria/api (modelos, controladores, rutas)
│   ├── scripts/tesoreria.js Comando para responder solicitudes de compra y cobrar multas
│   └── pruebas/             Pruebas de las tres APIs
├── server/                  API (Modelo + Controlador)
│   ├── src/servidor.js      Punto de entrada: escucha el puerto
│   ├── src/aplicacion.js    Express: CORS, JSON, rutas y manejo de errores
│   ├── src/configuracion/   entorno.js (.env) y conexion.js (MariaDB)
│   ├── src/modelos/         SQL parametrizado, transacciones y reglas de negocio
│   ├── src/controladores/   Reciben la petición, revisan permisos y responden
│   ├── src/rutas/           URL → autenticación → permiso → validación → controlador
│   ├── src/intermediarios/  autenticacion (JWT + funciones), Validar (zod), errores
│   ├── src/validaciones/    Esquemas zod con mensajes del prototipo
│   ├── src/utilidades/      ErrorHttp, fechas, reglas de préstamo y documentos en PDF
│   └── pruebas/             33 pruebas de integración (node:test) con los externos simulados
├── web/src/
│   ├── principal.jsx        Punto de entrada (monta las rutas en #raiz)
│   ├── modelos/             Acceso a la API y reglas del dominio (estados, formatos)
│   ├── controladores/       Hooks por pantalla: estado, validación y acciones
│   ├── vistas/              plantillas, componentes y paginas (solo presentación)
│   ├── rutas/               Rutas protegidas por sesión y por función
│   └── estilos/             estilos-globales.css (tokens del sistema de diseño)
└── mobile/src/
    ├── Aplicacion.js        Componente raíz (lo registra mobile/index.js)
    ├── modelos/             Igual que web; el token se guarda en SecureStore
    ├── controladores/       Hooks por pantalla
    ├── vistas/              tema.js, componentes y pantallas
    └── rutas/               React Navigation: inicio de sesión | pestañas Buscar / Perfil
```

## MVC en este proyecto

| Capa | Servidor | Web y móvil |
|---|---|---|
| **Modelo** | `server/src/modelos`: consultas, transacciones y reglas (copias en préstamo, ISBN inmutable, código de ubicación…). | `modelos/`: llamadas a la API (`ModeloLibro.Buscar`, `ModeloAutenticacion.IniciarSesion`…) y reglas de presentación del dominio (`dominio.js`). |
| **Controlador** | `server/src/controladores` + `rutas`: permisos por función, validación y respuesta HTTP. | `controladores/`: un hook por pantalla (`useControladorEditarLibro`, `useControladorBusqueda`…) que maneja estado, validación previa y navegación. |
| **Vista** | — (JSON / PDF) | `vistas/`: componentes que solo pintan lo que el controlador les entrega. |

## Puesta en marcha

Requisitos: MariaDB 10.6+ y Node.js 20+.

```bash
# 1. Base de datos
mariadb -u root < database/01_schema.sql
mariadb -u root < database/02_seed.sql
mariadb -u root -e "CREATE USER IF NOT EXISTS 'ducky'@'localhost' IDENTIFIED BY 'tu-contraseña';
                    GRANT ALL ON biblioteca_ducky.* TO 'ducky'@'localhost';"

# 2. Sistemas externos  →  http://localhost:4000 (CIAA, Empleados y Tesorería)
cd externos
cp .env.example .env        # mismo DB_PASSWORD; las claves deben coincidir con server/.env
npm install
npm run db:reset            # crea ciaa_ducky, empleados_ducky y tesoreria_ducky
npm run dev
npm test                    # (después de db:reset) pruebas de las tres APIs

# 3. API  →  http://localhost:3000/api
cd ../server
cp .env.example .env        # ajusta DB_PASSWORD y JWT_SECRET; EXT_* apuntan a externos/
npm install
npm run dev
npm run db:reset && npm test   # reinicia la BD con la semilla y corre las 33 pruebas
npm run lint                   # revisa el estándar de codificación (también en web/, mobile/ y externos/)

# 4. Web  →  http://localhost:5173  (el proxy de Vite manda /api al puerto 3000)
cd ../web
npm install
npm run dev                 # npm run build genera web/dist

# 5. Móvil (Expo Go en el teléfono, emulador o navegador)
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
| `felipe.rodriguez` | 1001133 | Administrador | Todo: Panel, Usuarios, Libros, Catálogo, Préstamos, Devoluciones, Multas y adeudos, Asistente |
| `catherine.ramirez` | 2004720 | Bibliotecario | Catálogo, Préstamos, Devoluciones, Multas y adeudos, Asistente |
| `javier.saavedra` | 1987345 | Profesor | Catálogo y Asistente. Tiene un préstamo con las 3 renovaciones usadas y está en la lista de espera |
| `marcela.guerra` | 3105843 | Alumno | Catálogo y Asistente. Tiene «Introduction to Algorithms», que no tiene copias libres |
| `cesar.rodriguez` | 2005872 | Colaborador | Catálogo y Asistente. Está en la lista de espera |
| `ana.lopez` | 3109921 | Alumno | Préstamo vencido y $110 en multas: no puede pedir libros |
| `luis.perez` | 3111456 | Alumno | Préstamo vencido hace 10 días (vencidos, deudores, libro perdido) |
| `daniela.cruz` | 3104410 | Alumno | Multa aún no enviada a Tesorería y sin teléfono (WhatsApp falla) |
| `luis.moreno` | 3120558 | Alumno | Tiene 1 préstamo y $45 de multa (para probar bajas rechazadas) |

Las fechas de los préstamos y multas de la semilla se calculan a partir del día en que se
carga, así que siempre hay préstamos al corriente, vencidos y renovados.

Los intentos fallidos no se cuentan; una cuenta solo deja de entrar si el administrador la marca
como *Inactivo* en el cambio de datos.

## Sistemas externos

Biblio no captura alumnos ni empleados: los toma de dos sistemas de la universidad, y las
compras las autoriza Tesorería. Los tres se simulan en `externos/` (un proceso, tres APIs con
su propia clave en `X-Clave-Api` y su propia base de datos).

| Sistema | API | Qué toma o envía Biblio |
|---|---|---|
| CIAA (alumnos) | `GET /ciaa/api/alumnos?estatus=Inscrito` · `POST /ciaa/api/avisos` | Matrícula, nombre, apellidos, correo y teléfono (el CIAA también entrega carrera, semestre, etc., que Biblio ignora). Biblio le envía a Servicios Escolares la lista de alumnos deudores y los libros perdidos |
| Empleados (nómina) | `GET /empleados/api/empleados?estatus=Activo` | Nómina, nombre, apellidos, correo, teléfono y tipo (Docente, Bibliotecario, Administrativo, Directivo) |
| Tesorería | `POST /tesoreria/api/solicitudes` · `POST /tesoreria/api/multas` · `GET /tesoreria/api/pagos` | Envía cada solicitud de compra (Tesorería la acepta o rechaza y avisa a `POST /api/tesoreria/notificaciones`) y cada multa (Tesorería la cobra en caja y avisa a `POST /api/tesoreria/pagos`) |

**Alta y baja de cuentas** (*Usuarios → Actualizar lista de usuarios*). La API consulta CIAA y
Empleados y arma dos listas:

- **Altas**: personas activas cuya matrícula o nómina no tiene cuenta. El usuario es
  `nombre.apellido` (si ya existe se agrega la inicial del segundo nombre, p. ej.
  `cesarm.rodriguez`), el correo y el teléfono se copian del sistema de origen (el teléfono
  sirve para enviar el recibo del préstamo por WhatsApp) y la contraseña inicial es la
  matrícula o nómina precedida de `000`
  (`3105842` → `0003105842`). El rol se sugiere por tipo (alumno → Alumno, docente → Profesor,
  bibliotecario → Bibliotecario, administrativo → Colaborador) y el administrador lo puede
  cambiar. Los registros mal capturados (matrícula con letras, nombre vacío) se muestran como
  error; se corrigen en el sistema de origen y se genera la lista de nuevo.
- **Bajas**: cuentas activas que ya no aparecen en ninguno de los dos sistemas. No se dan de
  baja si tienen libros prestados o multas pendientes; los administradores nunca se dan de baja
  por lista.

Para simular una corrección en el sistema de origen:

```bash
curl -X PUT localhost:4000/ciaa/api/alumnos/31O5877 -H 'X-Clave-Api: clave-ciaa-dev' \
     -H 'Content-Type: application/json' -d '{"Matricula":"3105877"}'
curl -X PUT localhost:4000/empleados/api/empleados/1004981 -H 'X-Clave-Api: clave-empleados-dev' \
     -H 'Content-Type: application/json' -d '{"Nombre":"Héctor","Apellido_Paterno":"Garza"}'
```

**Solicitudes de compra.** Al enviar una solicitud, Biblio la manda a Tesorería y queda
*En revisión* (si Tesorería no responde queda *Pendiente* y se reenvía al abrir *Solicitar
libros*). Biblio no guarda el folio ni el motivo: identifica la orden ante Tesorería por su
referencia (`id_orden`) y los consulta a Tesorería al mostrar las solicitudes. Tesorería no tiene interfaz: la señal de aceptación o
rechazo se manda desde su entorno.

```bash
cd externos
npm run tesoreria -- listar Recibida
npm run tesoreria -- ver TES-2026-0003         # renglones y presupuesto del mes
npm run tesoreria -- aceptar TES-2026-0003
npm run tesoreria -- rechazar TES-2026-0004 "Sin presupuesto este mes"
```

Tesorería avisa a Biblio al momento; si Biblio estaba apagado, toma la respuesta la próxima vez
que se abren las solicitudes. En Biblio solo se registra después la recepción de los libros
(*Recibida*), que agrega las copias al inventario.

**Multas.** Toda multa que genera Biblio (devolución tardía, renovación de un préstamo vencido,
daño o pérdida) se envía a Tesorería. Si Tesorería no responde, la multa queda *Pendiente de
sincronizar* y se reenvía al abrir *Multas y adeudos → Pagos de Tesorería*. El pago se registra
en Tesorería, que avisa a Biblio para marcar la multa como pagada:

```bash
cd externos
npm run tesoreria -- multas Pendiente           # multas por cobrar
npm run tesoreria -- pagar M-0004               # el lector pagó en caja
```

## Perfiles y funciones

Los permisos salen de **Perfiles → PerfilFuncion → Funciones**. La API revisa el
código de función en cada ruta, y la web y la app muestran u ocultan menús y
botones con las mismas funciones, así que basta con cambiar la asignación
(pantalla *Perfiles y funciones*) para cambiar lo que ve cada rol.

Las seis funciones del diagrama de funciones:

| Función | Admin | Bibliotecario | Profesor | Alumno | Colaborador |
|---|:-:|:-:|:-:|:-:|:-:|
| gestionar_usuarios (Gestión de usuarios) | ✔ | | | | |
| gestionar_libros (Gestión de libros) | ✔ | | | | |
| buscar_libros (Búsqueda de libros) | ✔ | ✔ | ✔ | ✔ | ✔ |
| prestar_libros (Préstamo de libros) | ✔ | ✔ | | | |
| devolver_libros (Devolución de libros, multas y adeudos) | ✔ | ✔ | | | |
| usar_asistente (Asistente Biblio) | ✔ | ✔ | ✔ | ✔ | ✔ |

Alcance:

- *Gestión de usuarios*: alta, baja, cambio y consulta de usuarios (con su detalle de préstamos
  y multas, y su teléfono para WhatsApp), y gestión de perfiles.
- *Gestión de libros*: alta, baja, cambio y consulta de libros, solicitud de compra y listado.
- *Búsqueda de libros*: búsqueda con filtros en web y móvil. El filtro elegido también ordena
  los resultados (filtro *Autor* → ordenados por autor; *Todos* → por título).
- *Préstamo de libros*: condición del lector y del libro, registro, recibo (impreso, por correo
  o por WhatsApp), reimpresión, renovación, préstamos de un usuario y lista de espera.
- *Devolución de libros*: registro de devoluciones con multa por retraso, libros perdidos,
  préstamos vencidos, multas por daño o pérdida, adeudos de un usuario, lista de alumnos
  deudores para Servicios Escolares y pagos recibidos de Tesorería.
- *Asistente Biblio*: preguntas frecuentes según las funciones del perfil; cada respuesta cita
  el artefacto del proyecto del que se tomó (Propuesta de Negocio o la historia de usuario).

El perfil Administrador está protegido: sus funciones no se pueden modificar.

## Pantallas del prototipo implementadas

**Web**

| Clave | Pantalla | Ruta |
|---|---|---|
| — | Portal público de la biblioteca (búsqueda y acceso al sistema) | `/` |
| GU01 | Inicio de sesión (vacío, incompleto, datos incorrectos, cuenta inactiva) | `/login` |
| — | Panel del administrador (usuarios válidos, solicitudes, libros activos y accesos rápidos) | `/panel` |
| GU02 | Usuarios válidos, consulta por matrícula, cambio de datos, alta y baja de cuentas según CIAA y Empleados, perfiles y funciones | `/usuarios/…` |
| GL02 | Alta de libro con ISBN validado primero y ejemplares con ubicación | `/libros/nuevo` |
| GL04 | Editar ficha (ISBN bloqueado, libro inactivo) y estado de cada copia | `/libros/:id/editar` |
| GL03 | Baja: retirar una copia con motivo, o activar/inactivar el libro | `/libros/:id/baja` |
| GL01 | Solicitar libros nuevos o más copias, solicitudes pendientes y editoriales | `/libros/solicitar`, `/libros/:id/solicitar` |
| BL01 | Catálogo: búsqueda con filtros (el filtro también ordena) y paginación de 6 | `/catalogo` |
| GL06 | Vista previa del listado, impresión y PDF | `/catalogo?listado=1` |
| GL05 | Ficha del libro (completa con ejemplares para quien gestiona libros, resumida por estado para los demás) | `/catalogo/:id` |
| GU02 | Detalle de usuario con préstamos activos, vencidos, multas y si puede pedir libros | `/usuarios/:id` |
| PL01 | Registrar préstamo (lector, libro y ejemplar, fechas; rechazos por adeudos o sin copias) | `/prestamos/registro` |
| PL02 | Recibo de préstamo (vista previa, impresión, PDF, correo y WhatsApp) y reimpresión | `/prestamos/:id/recibo`, `/prestamos/recibos` |
| PL03 | Renovar préstamo (con multa si estaba vencido; máximo por perfil) | `/prestamos/renovacion` |
| PL04 | Préstamos de un usuario (activos e historial) | `/prestamos/usuario` |
| PL05 | Lista de espera (agregar, quitar y prioridad al primero) | `/prestamos/lista-espera` |
| DL01 | Registrar devolución (a tiempo, con multa, libro dañado, aviso de lista de espera) | `/devoluciones/registro` |
| DL03 | Reporte de libro perdido (multa por reposición, aviso a Servicios Escolares y Tesorería) | `/devoluciones/perdido` |
| DL05 | Préstamos vencidos por perfil o de un usuario | `/devoluciones/vencidos` |
| DL02 | Generar multa por entrega extemporánea, daño o pérdida | `/multas/generar` |
| DL04 | Multas y adeudos de un usuario | `/multas/adeudos` |
| DL06 | Lista de alumnos deudores (vista previa, PDF y envío a Servicios Escolares) | `/multas/deudores` |
| DL07 | Pagos de Tesorería (conectado y sin conexión) | `/multas/pagos` |
| CB01 | Asistente Biblio con preguntas por perfil | `/asistente` |

Los menús *Préstamos*, *Devoluciones* y *Multas y adeudos* muestran indicadores, accesos y los
últimos movimientos. Los avisos de resultado (recibo enviado, lista enviada, PDF descargado…)
se muestran dentro de la pantalla, como en el resto del sistema.

**Móvil**: Inicio de sesión (con sus cuatro estados), Inicio (saludo, buscador,
filtros y recomendados), Buscar (resultados y búsqueda sin filtro con carga de 6
en 6), Detalle (códigos de copia para quien gestiona libros, conteo por
estado para los demás) y Perfil.

La app móvil conserva las pantallas del flujo "Teléfono" del prototipo (búsqueda y perfil);
préstamos, devoluciones y el Asistente están en la web, que es donde los diseña el prototipo.

## Estados y reglas

- **Usuario**: `Activo` (se muestra como *Válido*) · `Inactivo` (no puede iniciar sesión).
- **Libro**: `Activo` · `Inactivo`. Un libro inactivo no aparece en el catálogo ni se puede editar; solo se inactiva si ninguna copia está en préstamo.
- **Copia** (valores del diagrama): `Disponible` (consulta en sala) · `Consulta Externa` (se presta a domicilio) · `En préstamo` (lo asigna el sistema) · `Inactivo` (dada de baja; en *Baja de libro* sigue en la lista de copias con ese estado). La baja de una copia guarda su motivo (`Perdido`, `Robado`, `Dañado`, `Obsoleto`) en `Motivo_Baja`. Al inactivar un libro (no se permite si alguna copia está en préstamo) sus copias activas quedan `Inactivo` sin motivo; al reactivarlo solo esas vuelven a `Disponible`, y las que tienen motivo siguen inactivas. Una copia prestada no cambia de estado ni se retira hasta devolverse.
- **Ubicación de la copia**: se guarda en una sola columna (`Ejemplares.Ubicacion`) como el código `P{pasillo}-E{estante}-N{nivel}-S{sección}`. Por ejemplo, pasillo 2, estante Q, nivel 3 y sección Computación → `P2-EQ-N3-SComputación`. El sistema lo genera al agregar o mover copias y lo interpreta para mostrar «Pasillo 2 · Estante Q · Nivel 3 · Sección Computación» (`server/src/utilidades/CodigoUbicacion.js`). Ningún componente puede llevar «-».
- **Código de copia** (`EJ-00101`): no se guarda; se calcula con `id_libro × 100 + num_copia`, por eso cada libro admite hasta 99 copias.
- **Solicitud de compra**: `Pendiente` (aún no llega a Tesorería) `→ En revision` (Tesorería la recibió) `→ Aprobada` o `Rechazada` (lo decide Tesorería, con motivo) `→ Recibida` (llegaron los libros; se agregan las copias).
- **Ficha**: el ISBN no cambia después del alta; el número de copias solo aumenta (para reducir se da de baja una copia).
- **Préstamo** (reglamento en `server/src/utilidades/ReglasCirculacion.js` y en la tabla `Politicas`): solo se prestan copias `Consulta Externa`; dura 5 días hábiles (10 para profesores), sin contar sábados ni domingos. El lector debe estar activo, sin multas pendientes, sin préstamos vencidos y con menos de 2 préstamos. Si el libro tiene lista de espera, solo se presta al primero de la lista. `Prestamos.Estado` guarda `Activo`, `Devuelto` o `Perdido`; *Vencido* y *Renovado* se calculan al mostrar.
- **Renovación**: hasta 2 veces (3 para profesores). Si el préstamo ya estaba vencido, la nueva fecha se cuenta desde hoy y se genera la multa por los días de retraso.
- **Multa**: $10.00 por día de retraso, $250.00 por daño y el precio de la última compra si el libro se pierde (la copia queda `Inactivo` con motivo `Perdido`). Una multa se paga completa en Tesorería.
- **Lista de espera** (estatus del diccionario): `Pendiente` (en espera) · `Atendida` (se le prestó) · `Cancelada` (se quitó). No se envían notificaciones.
- **Folios**: préstamo `PR-000231` y multa `M-0058` se calculan con el id; no se guardan.

## API

Todas las rutas van bajo `/api` y, salvo `POST /auth/login` y `GET /salud`, requieren
`Authorization: Bearer <token>`.

| Módulo | Rutas | Función requerida |
|---|---|---|
| Sesión | `POST /auth/login` · `GET /auth/me` · `PUT /auth/contrasena` | — |
| Panel | `GET /panel` | gestionar_usuarios |
| Usuarios | `GET /usuarios` · `GET /usuarios/:id` · `GET /usuarios/matricula/:m` · `POST /usuarios` · `PUT /usuarios/:id` | gestionar_usuarios |
| Alta y baja según CIAA y Empleados | `GET /usuarios/lista` · `POST /usuarios/carga` (`[{ Matricula_Nomina, id_perfil }]`) · `POST /usuarios/bajas` | gestionar_usuarios |
| Perfiles | `GET/POST /perfiles` · `GET/PUT/DELETE /perfiles/:id` · `PUT /perfiles/:id/funciones` | gestionar_usuarios |
| Catálogo | `GET /libros?q=&campo=&limit=&offset=` (ordena por `campo`) · `GET /libros/:id` | buscar_libros o gestionar_libros |
| Listado | `GET /libros/listado` · `GET /libros/listado.pdf` | gestionar_libros |
| Libros | `GET /libros/isbn/:isbn` · `GET /libros/solicitados/:isbn` · `POST /libros` · `PUT /libros/:id` · `PATCH /libros/:id/estatus` | gestionar_libros |
| Copias | `GET/POST /libros/:id/ejemplares` · `PUT /libros/:id/ejemplares/:n` · `POST /libros/:id/ejemplares/:n/baja` | gestionar_libros |
| Editoriales, autores, temas | CRUD `/editoriales`, `/autores`, `/temas` | lectura: catálogo · escritura: gestionar_libros |
| Compras | `GET /ordenes-compra` · `GET /ordenes-compra/solicitudes` · `POST /ordenes-compra` · `PATCH /ordenes-compra/:id/estatus` (solo `Recibida`) | gestionar_libros |
| Aviso de Tesorería | `POST /tesoreria/notificaciones` (`{ folio, referencia, estatus, motivo }`) · `POST /tesoreria/pagos` (`{ folio, referencia, monto, fecha }`) | clave `X-Clave-Integracion` (no usa sesión) |
| Situación del lector | `GET /circulacion/lectores/:matricula` (préstamos, multas y condiciones) · `GET /prestamos/vencidos?perfil=&matricula=` | prestar_libros o devolver_libros |
| Préstamos | `GET /prestamos/resumen` · `GET /prestamos/libros/:isbn` · `POST /prestamos` · `GET /prestamos/:id` · `GET /prestamos/:id/recibo.pdf` · `POST /prestamos/:id/renovacion` | prestar_libros |
| Lista de espera | `GET /lista-espera?q=` · `POST /lista-espera` · `DELETE /lista-espera/:id` | prestar_libros |
| Devoluciones | `GET /devoluciones/resumen` · `POST /devoluciones` · `POST /prestamos/:id/perdido` | devolver_libros |
| Multas | `GET /multas/resumen` · `POST /multas` · `GET /multas/:id` · `GET /multas/:id/comprobante.pdf` · `GET /multas/deudores?periodo=` · `GET /multas/deudores.pdf` · `POST /multas/deudores/envio` · `GET /multas/pagos` | devolver_libros |
| Asistente Biblio | `GET /asistente/preguntas` · `GET /asistente/preguntas/:id` | usar_asistente |

Errores: `{ "error": "mensaje", "detalles": … }`. 400 trae un mensaje por campo
(`[{ campo, mensaje }]`); 409 trae `detalles.codigo` (`ISBN_DUPLICADO`,
`COPIAS_EN_PRESTAMO`, `LIBRO_INACTIVO`…); 403 al iniciar sesión trae `CUENTA_INACTIVA`.

## Cambios al diagrama de base de datos

Todos están marcados con `[PROTOTIPO]` en `01_schema.sql`:

- **Usuarios**: `Nombre_Completo`, `Correo` y `Telefono` (`Nombre_Usuario` es el login del
  prototipo; el teléfono sirve para enviar el recibo por WhatsApp sin consultar las APIs).
- **LibrosNuevos**: `Anio`, `Tema` y `Sinopsis`, porque la solicitud de compra los pide.
- **OrdenesCompra**: estado `En revision` (la recibió Tesorería).
- **Ejemplares**: `Motivo_Baja`, que distingue las copias retiradas por un motivo de las que se
  inactivaron junto con su libro (estas vuelven a `Disponible` al reactivarlo).
- **Multas**: `Motivo` (entrega extemporánea, daño o pérdida), `Fecha_Multa` y
  `Enviada_Tesoreria` (las que faltan enviar se reenvían al abrir Pagos de Tesorería).
- **PreguntasChatbot**: `id_funcion`, la función que da acceso a cada pregunta (un perfil solo ve
  las de sus funciones). **ContenidosChatbot.Respuesta** crece a 500 caracteres.

Fuera de eso, `Ejemplares` sigue el diagrama (id_libro, num_copia, Estatus, Ubicacion); no hay
tabla de bitácora ni contador de intentos fallidos.

Las llaves primarias y foráneas son `VARCHAR(13)`, como en el diccionario de datos. No usan
AUTO_INCREMENT: la API asigna texto numérico (`'1'`, `'2'`…), el mayor + 1, con
`SiguienteId` (`server/src/configuracion/conexion.js`). Por eso las rutas siguen siendo
`/libros/1` y la API acepta los ids como número o texto, pero siempre los devuelve como texto.
- `Año` → `Anio` y «Descripción del Perfil» → `Descripcion_Perfil` (identificadores sin acentos ni espacios); `Contrasena_Usuario` guarda un hash bcrypt (no cifrado César); las relaciones 0..1 se aplican con índices `UNIQUE`.
- Longitudes, NOT NULL, nombres de tablas y columnas (`ListaDeEspera`, `LibrosNuevos`, `PreguntasChatbot.id_pregunta`…) y estados (`Perdido` en préstamos; `Pendiente/Notificado/Atendida/Cancelada` en la lista de espera) siguen el diccionario. Los `DECIMAL` llevan precisión `(10,2)` para guardar centavos.
- Las solicitudes de compra no tienen campo de justificación en el prototipo; como el diagrama la pide NOT NULL, se guarda «Lista de peticiones del periodo» cuando no se indica.
- La vista `vw_catalogo` reúne autores, temas, disponibilidad y ubicación para las búsquedas.
- Las portadas se generan a partir del tema, porque la BD no guarda imágenes.

## Estándar de codificación

Todo el código sigue el estándar de codificación del equipo (JavaScript, React +
React Native, HTML y CSS):

- **Nombres**: variables, parámetros y props en `snake_case`; funciones y métodos en
  `CamelCase` (`IniciarSesion`, `SetTexto`); hooks `use` + `CamelCase`
  (`useControladorCatalogo`); constantes en `SNAKE_CASE`; clases, componentes y módulos
  en `CamelCase`. Las columnas de la BD y las APIs de las bibliotecas conservan su nombre.
- **Carpetas y archivos** en español; cada archivo lleva el nombre de lo que exporta.
- **Llaves** de apertura y cierre en líneas separadas y alineadas (estilo Allman), en JS y CSS.
- **Documentación**: cada archivo empieza con su encabezado (Nombre del programa, Función,
  Autor, Fecha, Entrada, Salida, Nomenclatura), el contenido del listado y las instrucciones
  de reutilización; cada función, componente o clase lleva su bloque de comentarios y las
  secciones principales un bloque `Sección / Objetivo`.
- **CSS**: clases y propiedades personalizadas en `kebab-case` en español
  (`boton-primario`, `--azul-principal`), una declaración por línea.
- **Módulos ES** (`import`/`export`) en servidor, web y móvil.

`npm run lint` (en `server/`, `web/` y `mobile/`) revisa con ESLint las reglas que se
pueden comprobar automáticamente: llaves, sangría de 2 espacios, comillas simples,
punto y coma, líneas de máximo 100 caracteres y una instrucción por línea.
