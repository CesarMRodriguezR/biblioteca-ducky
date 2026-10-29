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
 * (2) CIAA, Empleados y Tesorería se simulan con SimuladorExternos.js; no hace falta encender
 *     el servicio externos/.
 * ******************************************************************
 */

process.env.NODE_ENV = 'test';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { aplicacion } from '../src/aplicacion.js';
import { pool, Consultar } from '../src/configuracion/conexion.js';
import { ENTORNO } from '../src/configuracion/entorno.js';
import { IniciarSimulador } from './SimuladorExternos.js';

let servidor;
let base;
let simulador;
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
  simulador = await IniciarSimulador();
  ENTORNO.EXTERNOS.CIAA.URL = `${simulador.url}/ciaa/api`;
  ENTORNO.EXTERNOS.EMPLEADOS.URL = `${simulador.url}/empleados/api`;
  ENTORNO.EXTERNOS.TESORERIA.URL = `${simulador.url}/tesoreria/api`;
  servidor = aplicacion.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  tokens.admin = await IniciarSesionPrueba('felipe.rodriguez');
  tokens.biblio = await IniciarSesionPrueba('catherine.ramirez');
  tokens.alumna = await IniciarSesionPrueba('marcela.guerra');
  tokens.profesor = await IniciarSesionPrueba('javier.saavedra');
});

after(async () =>
{
  servidor.close();
  await simulador.Cerrar();
  await pool.end();
});

/*------------------------------------------------------------------
 * Sección: GU01 Autenticación
 * Objetivo: Probar el inicio de sesión y las cuentas inactivadas por el administrador.
 *------------------------------------------------------------------*/
test('GU01: datos incorrectos no cuentan intentos; una cuenta inactiva no entra', async () =>
{
  for (let indice = 0; indice < 6; indice += 1)
  {
    const fallido = await Solicitar('POST', '/auth/login', {
      body: { Nombre_Usuario: 'maria.ortiz', Contrasena_Usuario: 'incorrecta' },
    });
    assert.equal(fallido.status, 401);
    assert.equal(fallido.data.error, 'Usuario o contraseña incorrectos.');
  }
  await IniciarSesionPrueba('maria.ortiz'); // seis fallos no la bloquean

  const [{ id_usuario: id }] = await Consultar(
    'SELECT id_usuario FROM Usuarios WHERE Nombre_Usuario = \'maria.ortiz\'',
  );
  const bloqueo = await Solicitar('PUT', `/usuarios/${id}`, {
    token: tokens.admin,
    body: { Estatus: 'Bloqueado' },
  });
  assert.equal(bloqueo.status, 400); // solo existen Activo e Inactivo
  await Solicitar('PUT', `/usuarios/${id}`, { token: tokens.admin, body: { Estatus: 'Inactivo' } });
  const inactiva = await Solicitar('POST', '/auth/login', {
    body: { Nombre_Usuario: 'maria.ortiz', Contrasena_Usuario: CONTRASENA },
  });
  assert.equal(inactiva.status, 403);
  assert.equal(inactiva.data.detalles.codigo, 'CUENTA_INACTIVA');
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
  // La bibliotecaria solo busca libros: no gestiona fichas ni solicitudes de compra
  assert.equal(
    (await Solicitar('GET', '/libros/isbn/978-0-13-235088-4', { token: tokens.biblio })).status,
    403,
  );
  assert.equal(
    (await Solicitar('POST', '/ordenes-compra', { token: tokens.biblio, body: {} })).status,
    403,
  );
  const funciones = await Solicitar('GET', '/funciones', { token: tokens.admin });
  assert.deepEqual(
    funciones.data.map((funcion) => funcion.Nombre_Funcion).sort(),
    ['buscar_libros', 'gestionar_libros', 'gestionar_usuarios'],
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

test('BL01: el filtro también ordena (autor, editorial, año)', async () =>
{
  const Valores = async (campo, columna) =>
    (await Solicitar('GET', `/libros?campo=${campo}&limit=50`, { token: tokens.alumna })).data.datos
      .map((libro) => libro[columna]);
  const Ordenado = (lista) =>
    lista.every((valor, indice) => indice === 0 || String(lista[indice - 1]).localeCompare(
      String(valor), 'es', { sensitivity: 'base' }) <= 0);
  assert.ok(Ordenado(await Valores('autor', 'Autores_Apellidos')));
  assert.ok(Ordenado(await Valores('editorial', 'Nombre_Editorial')));
  const anios = await Valores('anio', 'Anio');
  assert.deepEqual(anios, [...anios].sort((a, b) => a - b));
  const aparte = await Solicitar('GET', '/libros?orden=anio_desc', { token: tokens.alumna });
  assert.equal(aparte.status, 400);
});

test('GL05: la ficha completa (con códigos de copia) solo la ve quien gestiona libros', async () =>
{
  const alumna = await Solicitar('GET', '/libros/1', { token: tokens.alumna });
  assert.equal(alumna.data.Titulo, 'Introduction to Algorithms');
  assert.equal(alumna.data.ejemplares, undefined);
  assert.deepEqual(alumna.data.resumen_copias, {
    Disponible: 2,
    'Consulta Externa': 1,
    'En préstamo': 2,
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

  // El pie de página no debe crear hojas de más: 18 libros caben en 2 hojas y 2 libros en 1
  const ContarHojas = (bytes) => (bytes.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;
  assert.equal(ContarHojas(pdf.bytes), 2);
  const filtrado = await Solicitar('GET', '/libros/listado.pdf?campo=autor&q=Tanenbaum', {
    token: tokens.admin,
  });
  assert.equal(ContarHojas(filtrado.bytes), 1);
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
  assert.equal(alta.data.id_libro, '20'); // VARCHAR(13): el siguiente después de los 19 de la semilla

  const dup = await Solicitar('POST', '/libros', { token: tokens.admin, body: libro });
  assert.equal(dup.status, 409);
  assert.equal(dup.data.detalles.codigo, 'ISBN_DUPLICADO');

  const copias = await Solicitar('POST', `/libros/${alta.data.id_libro}/ejemplares`, {
    token: tokens.admin,
    body: { cantidad: 2, Pasillo: '2', Estante: 'Q', Nivel: '3' },
  });
  assert.equal(copias.status, 201);
  assert.equal(copias.data.ejemplares.length, 2);
  const codigo = `EJ-${String(alta.data.id_libro * 100 + 1).padStart(5, '0')}`;
  assert.equal(copias.data.ejemplares[0].Codigo, codigo);
  // La ubicación se guarda como un código (la sección sale del tema) y se interpreta al leerla
  assert.equal(copias.data.ejemplares[0].Ubicacion, 'P2-EQ-N3-SComputación');
  assert.deepEqual(
    [copias.data.Pasillo, copias.data.Estante, copias.data.Nivel, copias.data.Seccion],
    ['2', 'Q', '3', 'Computación'],
  );
  const con_guion = await Solicitar('POST', `/libros/${alta.data.id_libro}/ejemplares`, {
    token: tokens.admin,
    body: { cantidad: 1, Estante: 'QA-76' },
  });
  assert.equal(con_guion.status, 400);
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
  const prestada = libro.data.ejemplares.find((ejemplar) => ejemplar.Estatus === 'En préstamo');
  const libre = libro.data.ejemplares.find((ejemplar) => ejemplar.Estatus === 'Disponible');

  const bloqueo = await Solicitar('PUT', `/libros/3/ejemplares/${prestada.num_copia}`, {
    token: tokens.admin,
    body: { Estatus: 'Disponible' },
  });
  assert.equal(bloqueo.status, 409);
  assert.equal(bloqueo.data.detalles.codigo, 'COPIA_EN_PRESTAMO');

  const cambio = await Solicitar('PUT', `/libros/3/ejemplares/${libre.num_copia}`, {
    token: tokens.admin,
    body: { Estatus: 'Consulta Externa' },
  });
  assert.equal(cambio.status, 200);
  assert.equal(cambio.data.Estatus, 'Consulta Externa');

  const sistema = await Solicitar('PUT', `/libros/3/ejemplares/${libre.num_copia}`, {
    token: tokens.admin,
    body: { Estatus: 'En préstamo' },
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
  assert.equal(retiro.data.Estatus, 'Inactivo');
  assert.match(retiro.data.mensaje, /dada de baja \(Dañado\)/);

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
  assert.ok(lista.data.total >= 9);
});

test('GU02: la lista de altas sale de CIAA y Empleados con usuario nombre.apellido', async () =>
{
  const lista = await Solicitar('GET', '/usuarios/lista', { token: tokens.admin });
  assert.equal(lista.status, 200, JSON.stringify(lista.data));
  assert.deepEqual(lista.data.fuentes, { CIAA: 6, Empleados: 6 });
  const validos = Object.fromEntries(
    lista.data.altas.validos.map((valido) => [valido.Matricula_Nomina, valido]),
  );
  assert.deepEqual(Object.keys(validos).sort(), ['1002745', '3105842', '3108890', '3150221']);
  assert.equal(validos['3105842'].Nombre_Usuario, 'ana.ramirez');
  assert.equal(validos['3105842'].Rol_Sugerido, 'Alumno');
  // cesar.rodriguez ya existe: se agrega la inicial del segundo nombre
  assert.equal(validos['3150221'].Nombre_Usuario, 'cesarm.rodriguez');
  assert.equal(validos['1002745'].Rol_Sugerido, 'Profesor');
  assert.equal(validos['1002745'].id_perfil_sugerido, '3'); // llaves VARCHAR(13)
  assert.deepEqual(
    lista.data.altas.errores.map((error) => [error.Origen, error.Matricula_Nomina, error.Error]),
    [
      ['CIAA', '31O5877', 'Formato inválido: solo se permiten números'],
      ['Empleados', '1004981', 'Dato incompleto: el nombre está vacío'],
    ],
  );
  assert.deepEqual(
    lista.data.bajas.map((baja) => baja.Nombre_Usuario),
    ['diego.fuentes', 'hector.villarreal', 'luis.moreno'],
  );
});

test('GU02: alta de cuentas con rol obligatorio y contraseña inicial 000 + matrícula', async () =>
{
  const alta = await Solicitar('POST', '/usuarios/carga', {
    token: tokens.admin,
    body: {
      cuentas: [
        { Matricula_Nomina: '3105842', id_perfil: 4 },
        { Matricula_Nomina: '1002745', id_perfil: 3 },
        { Matricula_Nomina: '3108890', id_perfil: null },
        { Matricula_Nomina: '9999999', id_perfil: 4 },
      ],
    },
  });
  assert.equal(alta.status, 201, JSON.stringify(alta.data));
  assert.deepEqual(
    alta.data.creados.map((creado) => [creado.Nombre_Usuario, creado.Contrasena_Inicial]),
    [
      ['ana.ramirez', '0003105842'],
      ['jorge.salas', '0001002745'],
    ],
  );
  assert.equal(alta.data.creados[0].funciones.includes('buscar_libros'), true);
  assert.deepEqual(
    alta.data.errores.map((error) => error.Error),
    ['Sin rol asignado', 'Ya no aparece como nueva en CIAA ni en Empleados'],
  );

  await IniciarSesionPrueba('ana.ramirez', '0003105842');

  const despues = await Solicitar('GET', '/usuarios/lista', { token: tokens.admin });
  assert.equal(
    despues.data.altas.validos.some((valido) => valido.Matricula_Nomina === '3105842'),
    false,
  );
});

test('GU02: baja de quienes ya no aparecen, salvo con préstamos o multas', async () =>
{
  const { data: lista } = await Solicitar('GET', '/usuarios/lista', { token: tokens.admin });
  const luis = lista.bajas.find((elemento) => elemento.Nombre_Usuario === 'luis.moreno');
  assert.equal(luis.Multas_Pendientes, 45);

  const [marcela] = await Consultar(
    'SELECT id_usuario FROM Usuarios WHERE Nombre_Usuario = \'marcela.guerra\'',
  );
  const baja = await Solicitar('POST', '/usuarios/bajas', {
    token: tokens.admin,
    body: { ids: [...lista.bajas.map((elemento) => elemento.id_usuario), marcela.id_usuario] },
  });
  assert.equal(baja.status, 200);
  assert.deepEqual(
    baja.data.dados_de_baja.map((elemento) => elemento.Nombre_Usuario),
    ['diego.fuentes', 'hector.villarreal'],
  );
  assert.match(
    baja.data.rechazados[0].Motivo,
    /1 libro\(s\) prestado\(s\) y multas pendientes por \$45\.00/,
  );
  assert.equal(baja.data.rechazados[1].Motivo, 'Sigue apareciendo en CIAA o en Empleados');
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
    body: { funciones: [3, 2] },
  });
  assert.equal(colaborador.status, 200);
  assert.equal(colaborador.data.funciones.length, 2);
  await Solicitar('PUT', '/perfiles/5/funciones', {
    token: tokens.admin,
    body: { funciones: [3] },
  });
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

  // Se envió a Tesorería: queda En revisión con el folio que asignó
  assert.equal(orden.data.Estatus, 'En revision');
  assert.equal(orden.data.envio_tesoreria.enviada, true);
  const folio = orden.data.Folio_Tesoreria;
  assert.equal(simulador.solicitudes.get(folio).renglones.length, 2);

  // Biblio no puede aprobar: solo Tesorería
  const aprobar = await Solicitar('PATCH', `/ordenes-compra/${orden.data.id_orden}/estatus`, {
    token: tokens.admin,
    body: { Estatus: 'Aprobada' },
  });
  assert.equal(aprobar.status, 400);

  // Aviso de Tesorería: sin clave se rechaza; con clave se aplica (y repetirlo no cambia nada)
  const AvisarTesoreria = (clave, cuerpo) =>
    fetch(`${base}/tesoreria/notificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Clave-Integracion': clave },
      body: JSON.stringify(cuerpo),
    }).then(async (res) => ({ status: res.status, data: await res.json() }));
  const aviso = { folio, referencia: orden.data.id_orden, estatus: 'Aceptada' };
  assert.equal((await AvisarTesoreria('incorrecta', aviso)).status, 401);
  const aceptada = await AvisarTesoreria(ENTORNO.EXTERNOS.CLAVE_NOTIFICACION, aviso);
  assert.deepEqual(aceptada.data, {
    id_orden: orden.data.id_orden,
    Estatus: 'Aprobada',
    cambio: true,
  });
  const repetido = await AvisarTesoreria(ENTORNO.EXTERNOS.CLAVE_NOTIFICACION, aviso);
  assert.equal(repetido.data.cambio, false);

  // Si Tesorería no responde, la orden queda Pendiente y se envía al revisar las solicitudes
  const url_tesoreria = ENTORNO.EXTERNOS.TESORERIA.URL;
  ENTORNO.EXTERNOS.TESORERIA.URL = 'http://127.0.0.1:9/tesoreria/api';
  const sin_envio = await Solicitar('POST', '/ordenes-compra', {
    token: tokens.admin,
    body: { libros_existentes: [{ id_libro: 5, Num_Ejemplares: 1 }] },
  });
  ENTORNO.EXTERNOS.TESORERIA.URL = url_tesoreria;
  assert.equal(sin_envio.status, 201);
  assert.equal(sin_envio.data.Estatus, 'Pendiente');
  assert.equal(sin_envio.data.envio_tesoreria.enviada, false);

  // La respuesta que no llegó por aviso se consulta: Tesorería rechazó la orden
  await Solicitar('GET', '/ordenes-compra/solicitudes', { token: tokens.admin });
  const [, enviada] = [...simulador.solicitudes.entries()].find(
    ([, solicitud]) => solicitud.Referencia === String(sin_envio.data.id_orden),
  );
  const folio_nuevo = enviada.Folio;
  assert.ok(folio_nuevo);
  Object.assign(simulador.solicitudes.get(folio_nuevo), {
    Estatus: 'Rechazada',
    Motivo: 'Sin presupuesto',
  });
  const abiertas = await Solicitar('GET', '/ordenes-compra/solicitudes', { token: tokens.admin });
  const rechazada = abiertas.data.find((elemento) => elemento.id_orden === sin_envio.data.id_orden);
  assert.equal(rechazada.Estatus, 'Rechazada');
  assert.equal(rechazada.Motivo_Respuesta, 'Sin presupuesto');

  // Llegaron los libros aprobados: se agregan las copias
  const antes = (await Solicitar('GET', '/libros/1', { token: tokens.admin })).data
    .Ejemplares_Totales;
  const recibida = await Solicitar('PATCH', `/ordenes-compra/${orden.data.id_orden}/estatus`, {
    token: tokens.admin,
    body: { Estatus: 'Recibida' },
  });
  assert.equal(recibida.status, 200, JSON.stringify(recibida.data));
  const despues = (await Solicitar('GET', '/libros/1', { token: tokens.admin })).data
    .Ejemplares_Totales;
  assert.equal(despues, antes + 2);
});

/*------------------------------------------------------------------
 * Sección: Panel
 * Objetivo: Probar el panel del administrador y que las rutas fuera de esta entrega no existan.
 *------------------------------------------------------------------*/
test('panel con indicadores (sin bitácora)', async () =>
{
  const resultado = await Solicitar('GET', '/panel', { token: tokens.admin });
  assert.equal(resultado.status, 200);
  assert.equal(resultado.data.libros_activos, 19); // 18 de la semilla + el alta de la 4.ª edición
  assert.ok(resultado.data.usuarios_validos > 5);
  assert.equal(resultado.data.actividad, undefined);
});

test('préstamos, multas, espera, chatbot y políticas no están en esta entrega', async () =>
{
  const rutas = ['/prestamos', '/multas', '/lista-espera', '/chatbot/frecuentes', '/politicas'];
  for (const ruta of rutas)
  {
    assert.equal((await Solicitar('GET', ruta, { token: tokens.admin })).status, 404, ruta);
  }
});
