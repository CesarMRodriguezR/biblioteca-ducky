/*
 * ******************************************************************
 * Nombre del programa: API-PRUEBAS · api.prueba.js
 * Función: Pruebas de integración de la API contra la base de datos semilla.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Base de datos reiniciada (npm run db:reset)
 * Salida: Resultado de node --test
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo                Objetivo
 *     tokens                Guardar el token de sesión de cada usuario de prueba
 *     Solicitar             Hacer una petición HTTP a la API de prueba con token…
 *     IniciarSesionPrueba   Iniciar sesión con un usuario de prueba
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Ejecutar con npm test después de npm run db:reset; las pruebas modifican los datos
 *     semilla.
 * ******************************************************************
 */

process.env.NODE_ENV = 'test';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { aplicacion } from '../src/aplicacion.js';
import { pool, Consultar } from '../src/configuracion/conexion.js';

let servidor;
let base;
/*
 * Módulo: tokens
 * Objetivo: Guardar el token de sesión de cada usuario de prueba.
 */
const tokens = {};
const CONTRASENA = 'Ducky2026!';

/*
 * Función: Solicitar
 * Objetivo: Hacer una petición HTTP a la API de prueba con token opcional.
 * Entrada: metodo, ruta, { token, body } (opcional)
 * Salida: Promesa con { status, data }
 */
async function Solicitar(metodo, ruta, { token, body: cuerpo } = {})
{
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const tipo = res.headers.get('content-type') || '';
  if (tipo.includes('application/pdf'))
  {
    return { status: res.status, tipo, bytes: Buffer.from(await res.arrayBuffer()) };
  }
  const texto = await res.text();
  return { status: res.status, data: texto ? JSON.parse(texto) : null };
}

/*
 * Función: IniciarSesionPrueba
 * Objetivo: Iniciar sesión con un usuario de prueba.
 * Entrada: usuario, contrasena (opcional)
 * Salida: Promesa con el token de sesión
 */
async function IniciarSesionPrueba(usuario, contrasena = CONTRASENA)
{
  const { status: estado_http, data: datos } = await Solicitar('POST', '/auth/login', {
    body: { Nombre_Usuario: usuario, Contrasena_Usuario: contrasena },
  });
  assert.equal(estado_http, 200, JSON.stringify(datos));
  return datos.token;
}

before(async () =>
{
  servidor = aplicacion.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  tokens.admin = await IniciarSesionPrueba('felipe.rodriguez');
  tokens.biblio = await IniciarSesionPrueba('catherine.ramirez');
  tokens.alumna = await IniciarSesionPrueba('marcela.guerra');
  tokens.profesor = await IniciarSesionPrueba('javier.saavedra');

  // Usuarios de prueba sin préstamos para los flujos de circulación
  for (const [usuario, matricula, perfil] of [
    ['ana.prueba', '9000001', 4],
    ['beto.prueba', '9000002', 3],
  ])
  {
    const resultado = await Solicitar('POST', '/usuarios', {
      token: tokens.admin,
      body: {
        Nombre_Usuario: usuario,
        Nombre_Completo: usuario,
        Matricula_Nomina: matricula,
        Contrasena_Usuario: CONTRASENA,
        id_perfil: perfil,
      },
    });
    assert.equal(resultado.status, 201, JSON.stringify(resultado.data));
  }
  tokens.ana = await IniciarSesionPrueba('ana.prueba');
  tokens.beto = await IniciarSesionPrueba('beto.prueba');
});

after(async () =>
{
  servidor.close();
  await pool.end();
});

/*------------------------------------------------------------------
 * Sección: GU01 Autenticación
 * Objetivo: Probar el inicio de sesión, los intentos fallidos y el bloqueo.
 *------------------------------------------------------------------*/
test('GU01: inicio de sesión fallido cuenta intentos y bloquea al quinto', async () =>
{
  const Intento = () =>
    Solicitar('POST', '/auth/login', {
      body: { Nombre_Usuario: 'maria.ortiz', Contrasena_Usuario: 'incorrecta' },
    });
  const r1 = await Intento();
  assert.equal(r1.status, 401);
  assert.equal(r1.data.error, 'Usuario o contraseña incorrectos.');
  assert.equal(r1.data.detalles.intentos_restantes, 4);
  for (let indice = 0; indice < 3; indice += 1)
  {
    await Intento();
  }
  const r5 = await Intento();
  assert.equal(r5.status, 403);
  assert.equal(r5.data.detalles.codigo, 'CUENTA_BLOQUEADA');

  const con_buena = await Solicitar('POST', '/auth/login', {
    body: { Nombre_Usuario: 'maria.ortiz', Contrasena_Usuario: CONTRASENA },
  });
  assert.equal(con_buena.status, 403);

  // El administrador la reactiva
  const [{ id_usuario: id }] = await Consultar(
    'SELECT id_usuario FROM Usuarios WHERE Nombre_Usuario = \'maria.ortiz\'',
  );
  await Solicitar('PUT', `/usuarios/${id}`, { token: tokens.admin, body: { Estatus: 'Activo' } });
  await IniciarSesionPrueba('maria.ortiz');
});

test('GU01: campos vacíos devuelven 400 con mensaje por campo', async () =>
{
  const resultado = await Solicitar('POST', '/auth/login', {
    body: { Nombre_Usuario: '', Contrasena_Usuario: '' },
  });
  assert.equal(resultado.status, 400);
  assert.deepEqual(resultado.data.detalles.map((detalle) => detalle.campo).sort(), [
    'Contrasena_Usuario',
    'Nombre_Usuario',
  ]);
  assert.equal(resultado.data.detalles[0].mensaje, 'Este campo es obligatorio.');
});

test('la sesión trae el perfil y sus funciones', async () =>
{
  const { data: datos } = await Solicitar('GET', '/auth/me', { token: tokens.alumna });
  assert.equal(datos.Nombre_Rol, 'Alumno');
  assert.equal(datos.Nombre_Completo, 'Marcela Guerra');
  assert.ok(datos.funciones.includes('buscar_libros'));
  assert.ok(!datos.funciones.includes('gestionar_libros'));
});

test('validación de perfil: el alumno recibe 403 en funciones restringidas', async () =>
{
  assert.equal((await Solicitar('GET', '/usuarios', { token: tokens.alumna })).status, 403);
  assert.equal((await Solicitar('GET', '/libros/listado', { token: tokens.alumna })).status, 403);
  assert.equal(
    (await Solicitar('GET', '/ordenes-compra/solicitudes', { token: tokens.alumna })).status,
    403,
  );
  assert.equal((await Solicitar('GET', '/panel', { token: tokens.alumna })).status, 403);
  // La bibliotecaria gestiona libros, pero la solicitud de compra es exclusiva del administrador
  assert.equal(
    (await Solicitar('GET', '/libros/isbn/978-0-13-235088-4', { token: tokens.biblio })).status,
    200,
  );
  assert.equal(
    (await Solicitar('POST', '/ordenes-compra', { token: tokens.biblio, body: {} })).status,
    403,
  );
});

/*------------------------------------------------------------------
 * Sección: BL01 / GL05 Búsqueda y ficha
 * Objetivo: Probar la búsqueda del catálogo y la ficha según el rol.
 *------------------------------------------------------------------*/
test('BL01: búsqueda sin filtros muestra 18 libros activos en páginas de 6', async () =>
{
  const resultado = await Solicitar('GET', '/libros', { token: tokens.alumna });
  assert.equal(resultado.status, 200);
  assert.equal(resultado.data.total, 18);
  assert.equal(resultado.data.datos.length, 6);
  assert.ok(resultado.data.datos.every((dato) => dato.Estatus === 'Activo'));
});

test('BL01: búsqueda por campo (Autor «Tanenbaum», Título, ISBN sin resultados)', async () =>
{
  const autor = await Solicitar('GET', '/libros?campo=autor&q=Tanenbaum', { token: tokens.alumna });
  assert.equal(autor.data.total, 2);
  const titulo = await Solicitar('GET', '/libros?campo=titulo&q=algoritmos', {
    token: tokens.alumna,
  });
  assert.equal(titulo.data.total, 1);
  const isbn = await Solicitar('GET', '/libros?campo=isbn&q=978-1-4028-9462-6', {
    token: tokens.alumna,
  });
  assert.equal(isbn.data.total, 0);
});

test('GL05: la ficha completa (con códigos de copia) solo la ve quien gestiona libros', async () =>
{
  const alumna = await Solicitar('GET', '/libros/1', { token: tokens.alumna });
  assert.equal(alumna.data.Titulo, 'Introduction to Algorithms');
  assert.equal(alumna.data.ejemplares, undefined);
  assert.deepEqual(alumna.data.resumen_copias, {
    Disponible: 2,
    'Consulta externa': 1,
    'En prestamo': 2,
  });
  assert.equal(alumna.data.Ejemplares_Disponibles, 3);

  const admin = await Solicitar('GET', '/libros/1', { token: tokens.admin });
  assert.equal(admin.data.ejemplares.length, 5);
  assert.equal(admin.data.ejemplares[0].Codigo, 'EJ-00101');
  assert.equal(admin.data.Seccion, 'Computación');

  const inactivo_alumna = await Solicitar('GET', '/libros/19', { token: tokens.alumna });
  assert.equal(inactivo_alumna.status, 404);
  const inactivo_admin = await Solicitar('GET', '/libros/19', { token: tokens.admin });
  assert.equal(inactivo_admin.data.Estatus, 'Inactivo');
});

/*------------------------------------------------------------------
 * Sección: GL06 Listado
 * Objetivo: Probar la vista previa del listado y su PDF.
 *------------------------------------------------------------------*/
test('GL06: listado con filtro y PDF', async () =>
{
  const resultado = await Solicitar('GET', '/libros/listado?campo=autor&q=Tanenbaum', {
    token: tokens.admin,
  });
  assert.equal(resultado.data.total, 2);
  assert.equal(resultado.data.filtro, 'Autor «Tanenbaum»');
  assert.equal(resultado.data.generado_por, 'Felipe Rodríguez');

  const pdf = await Solicitar('GET', '/libros/listado.pdf', { token: tokens.admin });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.tipo, 'application/pdf');
  assert.equal(pdf.bytes.subarray(0, 4).toString(), '%PDF');
});

/*------------------------------------------------------------------
 * Sección: GL02 Alta de libro
 * Objetivo: Probar el alta de ficha, el ISBN duplicado y el alta de ejemplares.
 *------------------------------------------------------------------*/
test('GL02: alta con datos inválidos devuelve un mensaje por campo', async () =>
{
  const resultado = await Solicitar('POST', '/libros', {
    token: tokens.admin,
    body: { ISBN: '97A-1', Titulo: '', Anio: '22', Precio: 0, id_editorial: 1 },
  });
  assert.equal(resultado.status, 400);
  const por_campo = Object.fromEntries(
    resultado.data.detalles.map((detalle) => [detalle.campo, detalle.mensaje]),
  );
  assert.equal(por_campo.ISBN, 'Formato inválido: solo números y guiones.');
  assert.equal(por_campo.Titulo, 'Este campo es obligatorio.');
  assert.equal(por_campo.Anio, 'Debe ser un número de 4 dígitos, p. ej. 2022.');
  assert.match(por_campo.Precio, /mayor a \$0\.00/);
});

test('GL02: ISBN duplicado devuelve la ficha existente y luego alta completa con ejemplares', async () =>
{
  const existente = await Solicitar('GET', '/libros/isbn/978-0-262-03384-8', {
    token: tokens.admin,
  });
  assert.equal(existente.status, 200);
  assert.equal(existente.data.Titulo, 'Introduction to Algorithms');

  const libro = {
    ISBN: '978-0-262-04630-5',
    Titulo: 'Introduction to Algorithms (4th ed.)',
    Autor: 'Cormen, T. H.; Leiserson, C. E.',
    id_editorial: 4,
    Anio: 2022,
    Tema: 'Computación',
    Sinopsis: 'Cuarta edición.',
    Precio: 1999,
  };
  const alta = await Solicitar('POST', '/libros', { token: tokens.admin, body: libro });
  assert.equal(alta.status, 201, JSON.stringify(alta.data));
  assert.equal(alta.data.Ejemplares_Totales, 0);
  assert.equal(alta.data.Autor, 'Cormen, T. H.; Leiserson, C. E.');

  const dup = await Solicitar('POST', '/libros', { token: tokens.admin, body: libro });
  assert.equal(dup.status, 409);
  assert.equal(dup.data.detalles.codigo, 'ISBN_DUPLICADO');

  const copias = await Solicitar('POST', `/libros/${alta.data.id_libro}/ejemplares`, {
    token: tokens.admin,
    body: { cantidad: 2, Pasillo: '4', Estante: 'B', Nivel: '2' },
  });
  assert.equal(copias.status, 201);
  assert.equal(copias.data.ejemplares.length, 2);
  assert.match(copias.data.ejemplares[0].Codigo, /^EJ-\d{5}$/);
  assert.equal(copias.data.Pasillo, '4');
});

/*------------------------------------------------------------------
 * Sección: GL04 Edición
 * Objetivo: Probar la edición de la ficha y el cambio de estado de las copias.
 *------------------------------------------------------------------*/
test('GL04: el ISBN no se cambia y las copias solo aumentan', async () =>
{
  const isbn = await Solicitar('PUT', '/libros/3', {
    token: tokens.admin,
    body: { ISBN: '978-0-00-000000-0' },
  });
  assert.equal(isbn.status, 400);
  assert.equal(isbn.data.error, 'No se puede cambiar el ISBN de un libro.');

  const menos = await Solicitar('PUT', '/libros/3', {
    token: tokens.admin,
    body: { Numero_Copias: 1 },
  });
  assert.equal(menos.status, 400);

  const ok = await Solicitar('PUT', '/libros/3', {
    token: tokens.admin,
    body: {
      Autor: 'Kernighan, B. W.; Ritchie, D. M.',
      id_editorial: 1,
      Anio: 1991,
      Numero_Copias: 4,
    },
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.equal(ok.data.Nombre_Editorial, 'Pearson');
  assert.equal(ok.data.Ejemplares_Totales, 4);
});

test('GL04: cambio de estado de copia bloqueado si está en préstamo', async () =>
{
  const libro = await Solicitar('GET', '/libros/3', { token: tokens.admin });
  const prestada = libro.data.ejemplares.find((ejemplar) => ejemplar.Estatus === 'En prestamo');
  const libre = libro.data.ejemplares.find((ejemplar) => ejemplar.Estatus === 'Disponible');

  const bloqueo = await Solicitar('PUT', `/libros/3/ejemplares/${prestada.num_copia}`, {
    token: tokens.admin,
    body: { Estatus: 'Disponible' },
  });
  assert.equal(bloqueo.status, 409);
  assert.equal(bloqueo.data.detalles.codigo, 'COPIA_EN_PRESTAMO');

  const cambio = await Solicitar('PUT', `/libros/3/ejemplares/${libre.num_copia}`, {
    token: tokens.admin,
    body: { Estatus: 'Consulta externa' },
  });
  assert.equal(cambio.status, 200);
  assert.equal(cambio.data.Estatus, 'Consulta externa');

  const sistema = await Solicitar('PUT', `/libros/3/ejemplares/${libre.num_copia}`, {
    token: tokens.admin,
    body: { Estatus: 'En prestamo' },
  });
  assert.equal(sistema.status, 400);
});

/*------------------------------------------------------------------
 * Sección: GL03 Baja
 * Objetivo: Probar el retiro de copias y la inactivación del libro.
 *------------------------------------------------------------------*/
test('GL03: retiro de copia e inactivación de libro', async () =>
{
  // Clean Code: EJ-00202 está en préstamo
  const en_prestamo = await Solicitar('POST', '/libros/2/ejemplares/2/baja', {
    token: tokens.admin,
    body: { Motivo_Baja: 'Danado' },
  });
  assert.equal(en_prestamo.status, 409);

  const retiro = await Solicitar('POST', '/libros/2/ejemplares/3/baja', {
    token: tokens.admin,
    body: { Motivo_Baja: 'Danado' },
  });
  assert.equal(retiro.status, 200);
  assert.equal(retiro.data.Estatus, 'Baja');
  assert.equal(retiro.data.Motivo_Baja, 'Danado');

  const inactivar = await Solicitar('PATCH', '/libros/2/estatus', {
    token: tokens.admin,
    body: { Estatus: 'Inactivo' },
  });
  assert.equal(inactivar.status, 409);
  assert.equal(inactivar.data.detalles.codigo, 'COPIAS_EN_PRESTAMO');
  assert.deepEqual(inactivar.data.detalles.copias, ['EJ-00202']);

  // Compiladores no tiene préstamos
  const ok = await Solicitar('PATCH', '/libros/15/estatus', {
    token: tokens.admin,
    body: { Estatus: 'Inactivo' },
  });
  assert.equal(ok.status, 200);
  const editar = await Solicitar('PUT', '/libros/15', {
    token: tokens.admin,
    body: { Titulo: 'X' },
  });
  assert.equal(editar.status, 409);
  assert.equal(editar.data.detalles.codigo, 'LIBRO_INACTIVO');
  const catalogo = await Solicitar('GET', '/libros?q=Compiladores', { token: tokens.alumna });
  assert.equal(catalogo.data.total, 0);
  const reactivar = await Solicitar('PATCH', '/libros/15/estatus', {
    token: tokens.admin,
    body: { Estatus: 'Activo' },
  });
  assert.equal(reactivar.data.Estatus, 'Activo');
});

/*------------------------------------------------------------------
 * Sección: GU02 Usuarios
 * Objetivo: Probar la consulta, el cambio, la carga y baja por lista de usuarios, y los perfiles.
 *------------------------------------------------------------------*/
test('GU02: consulta por matrícula y cambio de datos con contraseña segura', async () =>
{
  const usuario = await Solicitar('GET', '/usuarios/matricula/3120558', { token: tokens.admin });
  assert.equal(usuario.data.Nombre_Usuario, 'luis.moreno');
  assert.equal(usuario.data.Libros_Prestados, 1);
  assert.equal(usuario.data.Multas_Pendientes, 45);
  assert.equal(usuario.data.Contrasena_Usuario, undefined);

  const no_existe = await Solicitar('GET', '/usuarios/matricula/0000000', { token: tokens.admin });
  assert.equal(no_existe.status, 404);

  const debil = await Solicitar('PUT', `/usuarios/${usuario.data.id_usuario}`, {
    token: tokens.admin,
    body: { Contrasena_Usuario: 'corta' },
  });
  assert.equal(debil.status, 400);
  assert.equal(debil.data.detalles[0].mensaje, 'Mínimo 8 caracteres, una mayúscula y un número.');

  const matricula = await Solicitar('PUT', `/usuarios/${usuario.data.id_usuario}`, {
    token: tokens.admin,
    body: { Matricula_Nomina: '1' },
  });
  assert.equal(matricula.data.detalles[0].mensaje, 'Este dato no se puede modificar.');

  const lista = await Solicitar('GET', '/usuarios?limit=7', { token: tokens.admin });
  assert.equal(lista.data.datos.length, 7);
  assert.ok(lista.data.total >= 11);
});

test('GU02: alta de cuentas por lista con errores, rol obligatorio y contraseña inicial', async () =>
{
  const filas = [
    {
      Fila: 2,
      Nombre_Usuario: 'ana.ramirez',
      Matricula_Nomina: 3105842,
      Nombre_Completo: 'Ana Ramírez Torres',
      Correo: 'ana.ramirez@ducky.edu.mx',
    },
    {
      Fila: 3,
      Nombre_Usuario: 'paola.trevino',
      Matricula_Nomina: '31O5877',
      Nombre_Completo: 'Paola Treviño Garza',
    },
    {
      Fila: 4,
      Nombre_Usuario: 'jorge.salas',
      Matricula_Nomina: '1002745',
      Nombre_Completo: 'Jorge Salas Medina',
    },
    { Fila: 5, Nombre_Usuario: 'hector.garza', Matricula_Nomina: '1004981', Nombre_Completo: '' },
    {
      Fila: 6,
      Nombre_Usuario: 'diego.flores',
      Matricula_Nomina: '3108890',
      Nombre_Completo: 'Diego Flores Garza',
    },
  ];
  const revision = await Solicitar('POST', '/usuarios/carga/validar', {
    token: tokens.admin,
    body: { filas },
  });
  assert.equal(revision.status, 200);
  assert.equal(revision.data.validos.length, 3);
  assert.deepEqual(
    revision.data.errores.map((error) => [error.Fila, error.Error]),
    [
      [3, 'Formato inválido: solo se permiten números'],
      [5, 'Dato incompleto: el nombre está vacío'],
    ],
  );

  const cuentas = revision.data.validos.map((valido) => ({
    ...valido,
    id_perfil: valido.Nombre_Usuario === 'diego.flores' ? null : 4,
  }));
  cuentas.find((cuenta) => cuenta.Nombre_Usuario === 'jorge.salas').id_perfil = 3;
  const alta = await Solicitar('POST', '/usuarios/carga', {
    token: tokens.admin,
    body: { cuentas },
  });
  assert.equal(alta.status, 201);
  assert.equal(alta.data.creados.length, 2);
  assert.equal(alta.data.creados[0].Contrasena_Inicial, '0003105842');
  assert.deepEqual(alta.data.creados[0].funciones.includes('buscar_libros'), true);
  assert.equal(alta.data.errores[0].Error, 'Sin rol asignado');

  await IniciarSesionPrueba('ana.ramirez', '0003105842');

  const repetida = await Solicitar('POST', '/usuarios/carga/validar', {
    token: tokens.admin,
    body: { filas: [filas[0]] },
  });
  assert.equal(repetida.data.errores[0].Error, 'Ya existe una cuenta con esta matrícula');
});

test('GU02: baja por lista rechaza cuentas con préstamos o multas', async () =>
{
  const [{ total }] = await Consultar(
    'SELECT COUNT(*) AS total FROM Usuarios WHERE Estatus <> \'Inactivo\'',
  );
  const todas = await Consultar(
    'SELECT Matricula_Nomina FROM Usuarios WHERE Estatus <> \'Inactivo\'',
  );
  const lista = todas
    .map((toda) => toda.Matricula_Nomina)
    .filter((toda) => !['3098117', '3120558'].includes(toda));
  assert.equal(lista.length, total - 2);

  const revision = await Solicitar('POST', '/usuarios/bajas/revisar', {
    token: tokens.admin,
    body: { matriculas: lista },
  });
  assert.deepEqual(
    revision.data.map((elemento) => elemento.Nombre_Usuario),
    ['diego.fuentes', 'luis.moreno'],
  );
  const luis = revision.data.find((elemento) => elemento.Nombre_Usuario === 'luis.moreno');
  assert.equal(luis.Multas_Pendientes, 45);

  const baja = await Solicitar('POST', '/usuarios/bajas', {
    token: tokens.admin,
    body: { ids: revision.data.map((elemento) => elemento.id_usuario) },
  });
  assert.equal(baja.status, 200);
  assert.deepEqual(
    baja.data.dados_de_baja.map((elemento) => elemento.Nombre_Usuario),
    ['diego.fuentes'],
  );
  assert.match(
    baja.data.rechazados[0].Motivo,
    /1 libro\(s\) prestado\(s\) y multas pendientes por \$45\.00/,
  );
});

test('GU02: gestión de perfiles (Administrador protegido)', async () =>
{
  const perfiles = await Solicitar('GET', '/perfiles', { token: tokens.admin });
  assert.equal(perfiles.data.length, 5);
  assert.equal(perfiles.data[0].Protegido, true);

  const admin = await Solicitar('PUT', '/perfiles/1/funciones', {
    token: tokens.admin,
    body: { funciones: [3] },
  });
  assert.equal(admin.status, 409);

  const colaborador = await Solicitar('PUT', '/perfiles/5/funciones', {
    token: tokens.admin,
    body: { funciones: [3, 7, 10, 12, 14, 4] },
  });
  assert.equal(colaborador.status, 200);
  assert.equal(colaborador.data.funciones.length, 6);
  await Solicitar('PUT', '/perfiles/5/funciones', {
    token: tokens.admin,
    body: { funciones: [3, 7, 10, 12, 14] },
  });
});

/*------------------------------------------------------------------
 * Sección: Circulación (API, sin pantallas en el prototipo)
 * Objetivo: Probar préstamos, renovaciones, devoluciones, multas y lista de espera.
 *------------------------------------------------------------------*/
test('préstamo solo de copias de Consulta externa; lista de espera y apartado', async () =>
{
  // The Algorithm Design Manual (17): todas las copias en préstamo
  const sin_copias = await Solicitar('POST', '/prestamos', {
    token: tokens.ana,
    body: { id_libro: 17 },
  });
  assert.equal(sin_copias.status, 409);
  assert.equal(sin_copias.data.detalles.codigo, 'SIN_EJEMPLARES');

  // Probabilidad (14): 1 Disponible (sala) + 1 Consulta externa
  const p1 = await Solicitar('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 14 } });
  assert.equal(p1.status, 201, JSON.stringify(p1.data));
  const libro = await Solicitar('GET', '/libros/14', { token: tokens.admin });
  assert.equal(
    libro.data.ejemplares.find((ejemplar) => ejemplar.num_copia === p1.data.num_copia).Estatus,
    'En prestamo',
  );

  // Solo queda la copia de sala: no se presta y se puede apartar
  const sala = await Solicitar('POST', '/prestamos', {
    token: tokens.beto,
    body: { id_libro: 14 },
  });
  assert.equal(sala.status, 409);
  const espera = await Solicitar('POST', '/lista-espera', {
    token: tokens.beto,
    body: { id_libro: 14 },
  });
  assert.equal(espera.status, 201);

  const dev = await Solicitar('POST', `/prestamos/${p1.data.id_prestamo}/devolucion`, {
    token: tokens.biblio,
    body: {},
  });
  assert.equal(dev.status, 201);
  assert.equal(
    dev.data.apartado_para,
    (await Solicitar('GET', '/auth/me', { token: tokens.beto })).data.id_usuario,
  );

  const otro = await Solicitar('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 14 } });
  assert.equal(otro.status, 409);
  const p2 = await Solicitar('POST', '/prestamos', { token: tokens.beto, body: { id_libro: 14 } });
  assert.equal(p2.status, 201);
  const dev2 = await Solicitar('POST', `/prestamos/${p2.data.id_prestamo}/devolucion`, {
    token: tokens.biblio,
    body: {},
  });
  assert.equal(dev2.data.apartado_para, null);
  const despues = await Solicitar('GET', '/libros/14', { token: tokens.admin });
  assert.equal(
    despues.data.ejemplares.find((ejemplar) => ejemplar.num_copia === p2.data.num_copia).Estatus,
    'Consulta externa',
  );
});

test('renovación hasta 2 veces y devolución tardía con multa que bloquea préstamos', async () =>
{
  const parametro = await Solicitar('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 12 } });
  assert.equal(parametro.status, 201, JSON.stringify(parametro.data));
  assert.equal(
    (await Solicitar('POST', `/prestamos/${parametro.data.id_prestamo}/renovacion`, { token: tokens.ana }))
      .status,
    201,
  );
  assert.equal(
    (await Solicitar('POST', `/prestamos/${parametro.data.id_prestamo}/renovacion`, { token: tokens.ana }))
      .status,
    201,
  );
  assert.equal(
    (await Solicitar('POST', `/prestamos/${parametro.data.id_prestamo}/renovacion`, { token: tokens.ana }))
      .status,
    409,
  );

  await Consultar(
    `UPDATE Prestamos SET Fecha_Prestamo = CURDATE() - INTERVAL 10 DAY,
            Fecha_Entrega_Programada = CURDATE() - INTERVAL 3 DAY WHERE id_prestamo = ?`,
    [parametro.data.id_prestamo],
  );
  const dev = await Solicitar('POST', `/prestamos/${parametro.data.id_prestamo}/devolucion`, {
    token: tokens.biblio,
    body: {},
  });
  assert.equal(dev.data.multa.Cantidad_a_Pagar, 30);

  const bloqueado = await Solicitar('POST', '/prestamos', {
    token: tokens.ana,
    body: { id_libro: 8 },
  });
  assert.equal(bloqueado.data.detalles.codigo, 'MULTAS_PENDIENTES');
  await Solicitar('POST', `/multas/${dev.data.multa.id_multa}/pago`, {
    token: tokens.biblio,
    body: {},
  });
  assert.equal(
    (await Solicitar('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 8 } })).status,
    201,
  );
});

/*------------------------------------------------------------------
 * Sección: GL01 Solicitud de compra
 * Objetivo: Probar las solicitudes de compra y el flujo de estatus de las órdenes.
 *------------------------------------------------------------------*/
test('GL01: solicitud de libro nuevo y de más copias; flujo de estados', async () =>
{
  const en_catalogo = await Solicitar('POST', '/ordenes-compra', {
    token: tokens.admin,
    body: {
      libros_nuevos: [
        {
          nuevo: {
            ISBN: '978-0-13-235088-4',
            Titulo: 'Clean Code',
            Autor: 'Martin',
            id_editorial: 1,
            Anio: 2008,
            Tema: 'Computación',
            Sinopsis: 'x',
          },
          Num_Ejemplares: 1,
        },
      ],
    },
  });
  assert.equal(en_catalogo.status, 409);
  assert.equal(en_catalogo.data.detalles.codigo, 'ISBN_EN_CATALOGO');

  const cero = await Solicitar('POST', '/ordenes-compra', {
    token: tokens.admin,
    body: { libros_existentes: [{ id_libro: 1, Num_Ejemplares: 0 }] },
  });
  assert.equal(cero.status, 400);

  const orden = await Solicitar('POST', '/ordenes-compra', {
    token: tokens.admin,
    body: {
      libros_nuevos: [
        {
          nuevo: {
            ISBN: '978-0-321-48681-3',
            Titulo: 'Compilers',
            Autor: 'Aho, A. V.',
            id_editorial: 3,
            Anio: 1983,
            Tema: 'Ciencias de la computación',
            Sinopsis: 'Libro del dragón.',
            Precio: 1200,
          },
          Num_Ejemplares: 2,
        },
      ],
      libros_existentes: [{ id_libro: 1, Num_Ejemplares: 2 }],
    },
  });
  assert.equal(orden.status, 201, JSON.stringify(orden.data));
  assert.equal(orden.data.libros_nuevos[0].Editorial, 'Addison-Wesley');
  assert.equal(orden.data.CantidadTotal, 1200 * 2 + 1890 * 2);

  const abiertas = await Solicitar('GET', '/ordenes-compra/solicitudes', { token: tokens.admin });
  assert.ok(abiertas.data.some((elemento) => elemento.Titulo === 'Compilers' && elemento.Estatus === 'Pendiente'));

  const antes = (await Solicitar('GET', '/libros/1', { token: tokens.admin })).data
    .Ejemplares_Totales;
  for (const Estatus of ['En revision', 'Aprobada', 'Recibida'])
  {
    const resultado = await Solicitar('PATCH', `/ordenes-compra/${orden.data.id_orden}/estatus`, {
      token: tokens.admin,
      body: { Estatus },
    });
    assert.equal(resultado.status, 200, JSON.stringify(resultado.data));
  }
  const despues = (await Solicitar('GET', '/libros/1', { token: tokens.admin })).data
    .Ejemplares_Totales;
  assert.equal(despues, antes + 2);
});

/*------------------------------------------------------------------
 * Sección: Panel, chatbot y políticas
 * Objetivo: Probar el panel, el chatbot y la lectura de políticas.
 *------------------------------------------------------------------*/
test('panel con indicadores y actividad reciente', async () =>
{
  const resultado = await Solicitar('GET', '/panel', { token: tokens.admin });
  assert.equal(resultado.status, 200);
  assert.equal(resultado.data.libros_activos, 19); // 18 de la semilla + el alta de la 4.ª edición
  assert.ok(resultado.data.usuarios_validos > 5);
  assert.ok(resultado.data.actividad.length > 0);
  assert.equal(resultado.data.actividad[0].Accion, 'ESTATUS_COMPRA');
});

test('chatbot y políticas', async () =>
{
  const resultado = await Solicitar('POST', '/chatbot/preguntar', {
    token: tokens.alumna,
    body: { texto: '¿qué diferencia hay entre disponible y consulta externa?' },
  });
  assert.equal(resultado.data.encontrada, true);
  assert.match(resultado.data.respuesta.Respuesta, /llevar a casa/);
  const politicas = await Solicitar('GET', '/politicas');
  assert.equal(politicas.data.length, 6);
});
