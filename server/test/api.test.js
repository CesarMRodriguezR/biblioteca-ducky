/**
 * Pruebas de integración contra una BD recién cargada con
 * database/01_schema.sql y database/02_seed.sql.
 * Ejecutar: npm run db:reset && npm test
 */
process.env.NODE_ENV = 'test';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { pool, query } from '../src/config/db.js';

let server;
let base;
const tokens = {};
const CONTRASENA = 'Ducky2026!';

async function api(metodo, ruta, { token, body } = {}) {
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const tipo = res.headers.get('content-type') || '';
  if (tipo.includes('application/pdf')) {
    return { status: res.status, tipo, bytes: Buffer.from(await res.arrayBuffer()) };
  }
  const texto = await res.text();
  return { status: res.status, data: texto ? JSON.parse(texto) : null };
}

async function login(usuario, contrasena = CONTRASENA) {
  const { status, data } = await api('POST', '/auth/login', {
    body: { Nombre_Usuario: usuario, Contrasena_Usuario: contrasena },
  });
  assert.equal(status, 200, JSON.stringify(data));
  return data.token;
}

before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  tokens.admin = await login('felipe.rodriguez');
  tokens.biblio = await login('catherine.ramirez');
  tokens.alumna = await login('marcela.guerra');
  tokens.profesor = await login('javier.saavedra');

  // Usuarios de prueba sin préstamos para los flujos de circulación
  for (const [usuario, matricula, perfil] of [['ana.prueba', '9000001', 4], ['beto.prueba', '9000002', 3]]) {
    const r = await api('POST', '/usuarios', {
      token: tokens.admin,
      body: {
        Nombre_Usuario: usuario, Nombre_Completo: usuario, Matricula_Nomina: matricula,
        Contrasena_Usuario: CONTRASENA, id_perfil: perfil,
      },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
  }
  tokens.ana = await login('ana.prueba');
  tokens.beto = await login('beto.prueba');
});

after(async () => {
  server.close();
  await pool.end();
});

// --- GU01 Autenticación ------------------------------------------------
test('GU01: inicio de sesión fallido cuenta intentos y bloquea al quinto', async () => {
  const intento = () => api('POST', '/auth/login', {
    body: { Nombre_Usuario: 'maria.ortiz', Contrasena_Usuario: 'incorrecta' },
  });
  const r1 = await intento();
  assert.equal(r1.status, 401);
  assert.equal(r1.data.error, 'Usuario o contraseña incorrectos.');
  assert.equal(r1.data.detalles.intentosRestantes, 4);
  for (let i = 0; i < 3; i += 1) await intento();
  const r5 = await intento();
  assert.equal(r5.status, 403);
  assert.equal(r5.data.detalles.codigo, 'CUENTA_BLOQUEADA');

  const conBuena = await api('POST', '/auth/login', {
    body: { Nombre_Usuario: 'maria.ortiz', Contrasena_Usuario: CONTRASENA },
  });
  assert.equal(conBuena.status, 403);

  // El administrador la reactiva
  const [{ id_usuario: id }] = await query(`SELECT id_usuario FROM Usuarios WHERE Nombre_Usuario = 'maria.ortiz'`);
  await api('PUT', `/usuarios/${id}`, { token: tokens.admin, body: { Estatus: 'Activo' } });
  await login('maria.ortiz');
});

test('GU01: campos vacíos devuelven 400 con mensaje por campo', async () => {
  const r = await api('POST', '/auth/login', { body: { Nombre_Usuario: '', Contrasena_Usuario: '' } });
  assert.equal(r.status, 400);
  assert.deepEqual(r.data.detalles.map((d) => d.campo).sort(), ['Contrasena_Usuario', 'Nombre_Usuario']);
  assert.equal(r.data.detalles[0].mensaje, 'Este campo es obligatorio.');
});

test('la sesión trae el perfil y sus funciones', async () => {
  const { data } = await api('GET', '/auth/me', { token: tokens.alumna });
  assert.equal(data.Nombre_Rol, 'Alumno');
  assert.equal(data.Nombre_Completo, 'Marcela Guerra');
  assert.ok(data.funciones.includes('buscar_libros'));
  assert.ok(!data.funciones.includes('gestionar_libros'));
});

test('validación de perfil: el alumno recibe 403 en funciones restringidas', async () => {
  assert.equal((await api('GET', '/usuarios', { token: tokens.alumna })).status, 403);
  assert.equal((await api('GET', '/libros/listado', { token: tokens.alumna })).status, 403);
  assert.equal((await api('GET', '/ordenes-compra/solicitudes', { token: tokens.alumna })).status, 403);
  assert.equal((await api('GET', '/panel', { token: tokens.alumna })).status, 403);
  // La bibliotecaria gestiona libros, pero la solicitud de compra es exclusiva del administrador
  assert.equal((await api('GET', '/libros/isbn/978-0-13-235088-4', { token: tokens.biblio })).status, 200);
  assert.equal((await api('POST', '/ordenes-compra', { token: tokens.biblio, body: {} })).status, 403);
});

// --- BL01 / GL05 Búsqueda y ficha -------------------------------------
test('BL01: búsqueda sin filtros muestra 18 libros activos en páginas de 6', async () => {
  const r = await api('GET', '/libros', { token: tokens.alumna });
  assert.equal(r.status, 200);
  assert.equal(r.data.total, 18);
  assert.equal(r.data.datos.length, 6);
  assert.ok(r.data.datos.every((l) => l.Estatus === 'Activo'));
});

test('BL01: búsqueda por campo (Autor «Tanenbaum», Título, ISBN sin resultados)', async () => {
  const autor = await api('GET', '/libros?campo=autor&q=Tanenbaum', { token: tokens.alumna });
  assert.equal(autor.data.total, 2);
  const titulo = await api('GET', '/libros?campo=titulo&q=algoritmos', { token: tokens.alumna });
  assert.equal(titulo.data.total, 1);
  const isbn = await api('GET', '/libros?campo=isbn&q=978-1-4028-9462-6', { token: tokens.alumna });
  assert.equal(isbn.data.total, 0);
});

test('GL05: la ficha completa (con códigos de copia) solo la ve quien gestiona libros', async () => {
  const alumna = await api('GET', '/libros/1', { token: tokens.alumna });
  assert.equal(alumna.data.Titulo, 'Introduction to Algorithms');
  assert.equal(alumna.data.ejemplares, undefined);
  assert.deepEqual(alumna.data.resumenCopias, { Disponible: 2, 'Consulta externa': 1, 'En prestamo': 2 });
  assert.equal(alumna.data.Ejemplares_Disponibles, 3);

  const admin = await api('GET', '/libros/1', { token: tokens.admin });
  assert.equal(admin.data.ejemplares.length, 5);
  assert.equal(admin.data.ejemplares[0].Codigo, 'EJ-00101');
  assert.equal(admin.data.Seccion, 'Computación');

  const inactivoAlumna = await api('GET', '/libros/19', { token: tokens.alumna });
  assert.equal(inactivoAlumna.status, 404);
  const inactivoAdmin = await api('GET', '/libros/19', { token: tokens.admin });
  assert.equal(inactivoAdmin.data.Estatus, 'Inactivo');
});

// --- GL06 Listado ------------------------------------------------------
test('GL06: listado con filtro y PDF', async () => {
  const r = await api('GET', '/libros/listado?campo=autor&q=Tanenbaum', { token: tokens.admin });
  assert.equal(r.data.total, 2);
  assert.equal(r.data.filtro, 'Autor «Tanenbaum»');
  assert.equal(r.data.generadoPor, 'Felipe Rodríguez');

  const pdf = await api('GET', '/libros/listado.pdf', { token: tokens.admin });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.tipo, 'application/pdf');
  assert.equal(pdf.bytes.subarray(0, 4).toString(), '%PDF');
});

// --- GL02 Alta de libro ------------------------------------------------
test('GL02: alta con datos inválidos devuelve un mensaje por campo', async () => {
  const r = await api('POST', '/libros', {
    token: tokens.admin,
    body: { ISBN: '97A-1', Titulo: '', Anio: '22', Precio: 0, id_editorial: 1 },
  });
  assert.equal(r.status, 400);
  const porCampo = Object.fromEntries(r.data.detalles.map((d) => [d.campo, d.mensaje]));
  assert.equal(porCampo.ISBN, 'Formato inválido: solo números y guiones.');
  assert.equal(porCampo.Titulo, 'Este campo es obligatorio.');
  assert.equal(porCampo.Anio, 'Debe ser un número de 4 dígitos, p. ej. 2022.');
  assert.match(porCampo.Precio, /mayor a \$0\.00/);
});

test('GL02: ISBN duplicado devuelve la ficha existente y luego alta completa con ejemplares', async () => {
  const existente = await api('GET', '/libros/isbn/978-0-262-03384-8', { token: tokens.admin });
  assert.equal(existente.status, 200);
  assert.equal(existente.data.Titulo, 'Introduction to Algorithms');

  const libro = {
    ISBN: '978-0-262-04630-5', Titulo: 'Introduction to Algorithms (4th ed.)', Autor: 'Cormen, T. H.; Leiserson, C. E.',
    id_editorial: 4, Anio: 2022, Tema: 'Computación', Sinopsis: 'Cuarta edición.', Precio: 1999,
  };
  const alta = await api('POST', '/libros', { token: tokens.admin, body: libro });
  assert.equal(alta.status, 201, JSON.stringify(alta.data));
  assert.equal(alta.data.Ejemplares_Totales, 0);
  assert.equal(alta.data.Autor, 'Cormen, T. H.; Leiserson, C. E.');

  const dup = await api('POST', '/libros', { token: tokens.admin, body: libro });
  assert.equal(dup.status, 409);
  assert.equal(dup.data.detalles.codigo, 'ISBN_DUPLICADO');

  const copias = await api('POST', `/libros/${alta.data.id_libro}/ejemplares`, {
    token: tokens.admin, body: { cantidad: 2, Pasillo: '4', Estante: 'B', Nivel: '2' },
  });
  assert.equal(copias.status, 201);
  assert.equal(copias.data.ejemplares.length, 2);
  assert.match(copias.data.ejemplares[0].Codigo, /^EJ-\d{5}$/);
  assert.equal(copias.data.Pasillo, '4');
});

// --- GL04 Edición ------------------------------------------------------
test('GL04: el ISBN no se cambia y las copias solo aumentan', async () => {
  const isbn = await api('PUT', '/libros/3', { token: tokens.admin, body: { ISBN: '978-0-00-000000-0' } });
  assert.equal(isbn.status, 400);
  assert.equal(isbn.data.error, 'No se puede cambiar el ISBN de un libro.');

  const menos = await api('PUT', '/libros/3', { token: tokens.admin, body: { Numero_Copias: 1 } });
  assert.equal(menos.status, 400);

  const ok = await api('PUT', '/libros/3', {
    token: tokens.admin,
    body: { Autor: 'Kernighan, B. W.; Ritchie, D. M.', id_editorial: 1, Anio: 1991, Numero_Copias: 4 },
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.equal(ok.data.Nombre_Editorial, 'Pearson');
  assert.equal(ok.data.Ejemplares_Totales, 4);
});

test('GL04: cambio de estado de copia bloqueado si está en préstamo', async () => {
  const libro = await api('GET', '/libros/3', { token: tokens.admin });
  const prestada = libro.data.ejemplares.find((e) => e.Estatus === 'En prestamo');
  const libre = libro.data.ejemplares.find((e) => e.Estatus === 'Disponible');

  const bloqueo = await api('PUT', `/libros/3/ejemplares/${prestada.num_copia}`, {
    token: tokens.admin, body: { Estatus: 'Disponible' },
  });
  assert.equal(bloqueo.status, 409);
  assert.equal(bloqueo.data.detalles.codigo, 'COPIA_EN_PRESTAMO');

  const cambio = await api('PUT', `/libros/3/ejemplares/${libre.num_copia}`, {
    token: tokens.admin, body: { Estatus: 'Consulta externa' },
  });
  assert.equal(cambio.status, 200);
  assert.equal(cambio.data.Estatus, 'Consulta externa');

  const sistema = await api('PUT', `/libros/3/ejemplares/${libre.num_copia}`, {
    token: tokens.admin, body: { Estatus: 'En prestamo' },
  });
  assert.equal(sistema.status, 400);
});

// --- GL03 Baja ---------------------------------------------------------
test('GL03: retiro de copia e inactivación de libro', async () => {
  // Clean Code: EJ-00202 está en préstamo
  const enPrestamo = await api('POST', '/libros/2/ejemplares/2/baja', { token: tokens.admin, body: { Motivo_Baja: 'Danado' } });
  assert.equal(enPrestamo.status, 409);

  const retiro = await api('POST', '/libros/2/ejemplares/3/baja', { token: tokens.admin, body: { Motivo_Baja: 'Danado' } });
  assert.equal(retiro.status, 200);
  assert.equal(retiro.data.Estatus, 'Baja');
  assert.equal(retiro.data.Motivo_Baja, 'Danado');

  const inactivar = await api('PATCH', '/libros/2/estatus', { token: tokens.admin, body: { Estatus: 'Inactivo' } });
  assert.equal(inactivar.status, 409);
  assert.equal(inactivar.data.detalles.codigo, 'COPIAS_EN_PRESTAMO');
  assert.deepEqual(inactivar.data.detalles.copias, ['EJ-00202']);

  // Compiladores no tiene préstamos
  const ok = await api('PATCH', '/libros/15/estatus', { token: tokens.admin, body: { Estatus: 'Inactivo' } });
  assert.equal(ok.status, 200);
  const editar = await api('PUT', '/libros/15', { token: tokens.admin, body: { Titulo: 'X' } });
  assert.equal(editar.status, 409);
  assert.equal(editar.data.detalles.codigo, 'LIBRO_INACTIVO');
  const catalogo = await api('GET', '/libros?q=Compiladores', { token: tokens.alumna });
  assert.equal(catalogo.data.total, 0);
  const reactivar = await api('PATCH', '/libros/15/estatus', { token: tokens.admin, body: { Estatus: 'Activo' } });
  assert.equal(reactivar.data.Estatus, 'Activo');
});

// --- GU02 Usuarios -----------------------------------------------------
test('GU02: consulta por matrícula y cambio de datos con contraseña segura', async () => {
  const u = await api('GET', '/usuarios/matricula/3120558', { token: tokens.admin });
  assert.equal(u.data.Nombre_Usuario, 'luis.moreno');
  assert.equal(u.data.Libros_Prestados, 1);
  assert.equal(u.data.Multas_Pendientes, 45);
  assert.equal(u.data.Contrasena_Usuario, undefined);

  const noExiste = await api('GET', '/usuarios/matricula/0000000', { token: tokens.admin });
  assert.equal(noExiste.status, 404);

  const debil = await api('PUT', `/usuarios/${u.data.id_usuario}`, {
    token: tokens.admin, body: { Contrasena_Usuario: 'corta' },
  });
  assert.equal(debil.status, 400);
  assert.equal(debil.data.detalles[0].mensaje, 'Mínimo 8 caracteres, una mayúscula y un número.');

  const matricula = await api('PUT', `/usuarios/${u.data.id_usuario}`, {
    token: tokens.admin, body: { Matricula_Nomina: '1' },
  });
  assert.equal(matricula.data.detalles[0].mensaje, 'Este dato no se puede modificar.');

  const lista = await api('GET', '/usuarios?limit=7', { token: tokens.admin });
  assert.equal(lista.data.datos.length, 7);
  assert.ok(lista.data.total >= 11);
});

test('GU02: alta de cuentas por lista con errores, rol obligatorio y contraseña inicial', async () => {
  const filas = [
    { Fila: 2, Nombre_Usuario: 'ana.ramirez', Matricula_Nomina: 3105842, Nombre_Completo: 'Ana Ramírez Torres', Correo: 'ana.ramirez@ducky.edu.mx' },
    { Fila: 3, Nombre_Usuario: 'paola.trevino', Matricula_Nomina: '31O5877', Nombre_Completo: 'Paola Treviño Garza' },
    { Fila: 4, Nombre_Usuario: 'jorge.salas', Matricula_Nomina: '1002745', Nombre_Completo: 'Jorge Salas Medina' },
    { Fila: 5, Nombre_Usuario: 'hector.garza', Matricula_Nomina: '1004981', Nombre_Completo: '' },
    { Fila: 6, Nombre_Usuario: 'diego.flores', Matricula_Nomina: '3108890', Nombre_Completo: 'Diego Flores Garza' },
  ];
  const revision = await api('POST', '/usuarios/carga/validar', { token: tokens.admin, body: { filas } });
  assert.equal(revision.status, 200);
  assert.equal(revision.data.validos.length, 3);
  assert.deepEqual(revision.data.errores.map((e) => [e.Fila, e.Error]), [
    [3, 'Formato inválido: solo se permiten números'],
    [5, 'Dato incompleto: el nombre está vacío'],
  ]);

  const cuentas = revision.data.validos.map((v) => ({ ...v, id_perfil: v.Nombre_Usuario === 'diego.flores' ? null : 4 }));
  cuentas.find((c) => c.Nombre_Usuario === 'jorge.salas').id_perfil = 3;
  const alta = await api('POST', '/usuarios/carga', { token: tokens.admin, body: { cuentas } });
  assert.equal(alta.status, 201);
  assert.equal(alta.data.creados.length, 2);
  assert.equal(alta.data.creados[0].Contrasena_Inicial, '0003105842');
  assert.deepEqual(alta.data.creados[0].funciones.includes('buscar_libros'), true);
  assert.equal(alta.data.errores[0].Error, 'Sin rol asignado');

  await login('ana.ramirez', '0003105842');

  const repetida = await api('POST', '/usuarios/carga/validar', { token: tokens.admin, body: { filas: [filas[0]] } });
  assert.equal(repetida.data.errores[0].Error, 'Ya existe una cuenta con esta matrícula');
});

test('GU02: baja por lista rechaza cuentas con préstamos o multas', async () => {
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM Usuarios WHERE Estatus <> 'Inactivo'`);
  const todas = await query(`SELECT Matricula_Nomina FROM Usuarios WHERE Estatus <> 'Inactivo'`);
  const lista = todas.map((u) => u.Matricula_Nomina).filter((m) => !['3098117', '3120558'].includes(m));
  assert.equal(lista.length, total - 2);

  const revision = await api('POST', '/usuarios/bajas/revisar', { token: tokens.admin, body: { matriculas: lista } });
  assert.deepEqual(revision.data.map((u) => u.Nombre_Usuario), ['diego.fuentes', 'luis.moreno']);
  const luis = revision.data.find((u) => u.Nombre_Usuario === 'luis.moreno');
  assert.equal(luis.Multas_Pendientes, 45);

  const baja = await api('POST', '/usuarios/bajas', {
    token: tokens.admin, body: { ids: revision.data.map((u) => u.id_usuario) },
  });
  assert.equal(baja.status, 200);
  assert.deepEqual(baja.data.dadosDeBaja.map((u) => u.Nombre_Usuario), ['diego.fuentes']);
  assert.match(baja.data.rechazados[0].Motivo, /1 libro\(s\) prestado\(s\) y multas pendientes por \$45\.00/);
});

test('GU02: gestión de perfiles (Administrador protegido)', async () => {
  const perfiles = await api('GET', '/perfiles', { token: tokens.admin });
  assert.equal(perfiles.data.length, 5);
  assert.equal(perfiles.data[0].Protegido, true);

  const admin = await api('PUT', '/perfiles/1/funciones', { token: tokens.admin, body: { funciones: [3] } });
  assert.equal(admin.status, 409);

  const colaborador = await api('PUT', '/perfiles/5/funciones', { token: tokens.admin, body: { funciones: [3, 7, 10, 12, 14, 4] } });
  assert.equal(colaborador.status, 200);
  assert.equal(colaborador.data.funciones.length, 6);
  await api('PUT', '/perfiles/5/funciones', { token: tokens.admin, body: { funciones: [3, 7, 10, 12, 14] } });
});

// --- Circulación (API, sin pantallas en el prototipo) ------------------
test('préstamo solo de copias de Consulta externa; lista de espera y apartado', async () => {
  // The Algorithm Design Manual (17): todas las copias en préstamo
  const sinCopias = await api('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 17 } });
  assert.equal(sinCopias.status, 409);
  assert.equal(sinCopias.data.detalles.codigo, 'SIN_EJEMPLARES');

  // Probabilidad (14): 1 Disponible (sala) + 1 Consulta externa
  const p1 = await api('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 14 } });
  assert.equal(p1.status, 201, JSON.stringify(p1.data));
  const libro = await api('GET', '/libros/14', { token: tokens.admin });
  assert.equal(libro.data.ejemplares.find((e) => e.num_copia === p1.data.num_copia).Estatus, 'En prestamo');

  // Solo queda la copia de sala: no se presta y se puede apartar
  const sala = await api('POST', '/prestamos', { token: tokens.beto, body: { id_libro: 14 } });
  assert.equal(sala.status, 409);
  const espera = await api('POST', '/lista-espera', { token: tokens.beto, body: { id_libro: 14 } });
  assert.equal(espera.status, 201);

  const dev = await api('POST', `/prestamos/${p1.data.id_prestamo}/devolucion`, { token: tokens.biblio, body: {} });
  assert.equal(dev.status, 201);
  assert.equal(dev.data.apartadoPara, (await api('GET', '/auth/me', { token: tokens.beto })).data.id_usuario);

  const otro = await api('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 14 } });
  assert.equal(otro.status, 409);
  const p2 = await api('POST', '/prestamos', { token: tokens.beto, body: { id_libro: 14 } });
  assert.equal(p2.status, 201);
  const dev2 = await api('POST', `/prestamos/${p2.data.id_prestamo}/devolucion`, { token: tokens.biblio, body: {} });
  assert.equal(dev2.data.apartadoPara, null);
  const despues = await api('GET', '/libros/14', { token: tokens.admin });
  assert.equal(despues.data.ejemplares.find((e) => e.num_copia === p2.data.num_copia).Estatus, 'Consulta externa');
});

test('renovación hasta 2 veces y devolución tardía con multa que bloquea préstamos', async () => {
  const p = await api('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 12 } });
  assert.equal(p.status, 201, JSON.stringify(p.data));
  assert.equal((await api('POST', `/prestamos/${p.data.id_prestamo}/renovacion`, { token: tokens.ana })).status, 201);
  assert.equal((await api('POST', `/prestamos/${p.data.id_prestamo}/renovacion`, { token: tokens.ana })).status, 201);
  assert.equal((await api('POST', `/prestamos/${p.data.id_prestamo}/renovacion`, { token: tokens.ana })).status, 409);

  await query(
    `UPDATE Prestamos SET Fecha_Prestamo = CURDATE() - INTERVAL 10 DAY,
            Fecha_Entrega_Programada = CURDATE() - INTERVAL 3 DAY WHERE id_prestamo = ?`,
    [p.data.id_prestamo],
  );
  const dev = await api('POST', `/prestamos/${p.data.id_prestamo}/devolucion`, { token: tokens.biblio, body: {} });
  assert.equal(dev.data.multa.Cantidad_a_Pagar, 30);

  const bloqueado = await api('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 8 } });
  assert.equal(bloqueado.data.detalles.codigo, 'MULTAS_PENDIENTES');
  await api('POST', `/multas/${dev.data.multa.id_multa}/pago`, { token: tokens.biblio, body: {} });
  assert.equal((await api('POST', '/prestamos', { token: tokens.ana, body: { id_libro: 8 } })).status, 201);
});

// --- GL01 Solicitud de compra -----------------------------------------
test('GL01: solicitud de libro nuevo y de más copias; flujo de estados', async () => {
  const enCatalogo = await api('POST', '/ordenes-compra', {
    token: tokens.admin,
    body: {
      librosNuevos: [{
        nuevo: {
          ISBN: '978-0-13-235088-4', Titulo: 'Clean Code', Autor: 'Martin', id_editorial: 1,
          Anio: 2008, Tema: 'Computación', Sinopsis: 'x',
        },
        Num_Ejemplares: 1,
      }],
    },
  });
  assert.equal(enCatalogo.status, 409);
  assert.equal(enCatalogo.data.detalles.codigo, 'ISBN_EN_CATALOGO');

  const cero = await api('POST', '/ordenes-compra', {
    token: tokens.admin, body: { librosExistentes: [{ id_libro: 1, Num_Ejemplares: 0 }] },
  });
  assert.equal(cero.status, 400);

  const orden = await api('POST', '/ordenes-compra', {
    token: tokens.admin,
    body: {
      librosNuevos: [{
        nuevo: {
          ISBN: '978-0-321-48681-3', Titulo: 'Compilers', Autor: 'Aho, A. V.', id_editorial: 3,
          Anio: 1983, Tema: 'Ciencias de la computación', Sinopsis: 'Libro del dragón.', Precio: 1200,
        },
        Num_Ejemplares: 2,
      }],
      librosExistentes: [{ id_libro: 1, Num_Ejemplares: 2 }],
    },
  });
  assert.equal(orden.status, 201, JSON.stringify(orden.data));
  assert.equal(orden.data.librosNuevos[0].Editorial, 'Addison-Wesley');
  assert.equal(orden.data.CantidadTotal, 1200 * 2 + 1890 * 2);

  const abiertas = await api('GET', '/ordenes-compra/solicitudes', { token: tokens.admin });
  assert.ok(abiertas.data.some((s) => s.Titulo === 'Compilers' && s.Estatus === 'Pendiente'));

  const antes = (await api('GET', '/libros/1', { token: tokens.admin })).data.Ejemplares_Totales;
  for (const Estatus of ['En revision', 'Aprobada', 'Recibida']) {
    const r = await api('PATCH', `/ordenes-compra/${orden.data.id_orden}/estatus`, { token: tokens.admin, body: { Estatus } });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  }
  const despues = (await api('GET', '/libros/1', { token: tokens.admin })).data.Ejemplares_Totales;
  assert.equal(despues, antes + 2);
});

// --- Panel, chatbot y políticas ---------------------------------------
test('panel con indicadores y actividad reciente', async () => {
  const r = await api('GET', '/panel', { token: tokens.admin });
  assert.equal(r.status, 200);
  assert.equal(r.data.librosActivos, 19); // 18 de la semilla + el alta de la 4.ª edición
  assert.ok(r.data.usuariosValidos > 5);
  assert.ok(r.data.actividad.length > 0);
  assert.equal(r.data.actividad[0].Accion, 'ESTATUS_COMPRA');
});

test('chatbot y políticas', async () => {
  const r = await api('POST', '/chatbot/preguntar', {
    token: tokens.alumna, body: { texto: '¿qué diferencia hay entre disponible y consulta externa?' },
  });
  assert.equal(r.data.encontrada, true);
  assert.match(r.data.respuesta.Respuesta, /llevar a casa/);
  const politicas = await api('GET', '/politicas');
  assert.equal(politicas.data.length, 6);
});
