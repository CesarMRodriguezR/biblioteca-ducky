/*
 * ******************************************************************
 * Nombre del programa: EXTERNOS-PRUEBAS · externos.prueba.js
 * Función: Pruebas de integración de las APIs de CIAA, Empleados y Tesorería contra sus bases
 *          de datos semilla.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Bases de datos reiniciadas (npm run db:reset)
 * Salida: Resultado de node --test
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo      Objetivo
 *     Solicitar   Hacer una petición a un sistema con su clave
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Ejecutar con npm test después de npm run db:reset; las pruebas modifican los datos.
 * (2) Biblio no necesita estar encendido: si no responde, la solicitud queda sin notificar.
 * ******************************************************************
 */

process.env.NODE_ENV = 'test';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { aplicacion } from '../src/aplicacion.js';
import { ENTORNO } from '../src/configuracion/entorno.js';
import { CerrarBases } from '../src/configuracion/conexion.js';

let servidor;
let base;

/*
 * Función: Solicitar
 * Objetivo: Hacer una petición a un sistema externo con su clave.
 * Entrada: metodo, ruta, clave, cuerpo (opcional)
 * Salida: Promesa con { status, data }
 */
async function Solicitar(metodo, ruta, clave, cuerpo)
{
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', 'X-Clave-Api': clave },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

before(() =>
{
  ENTORNO.BIBLIO.URL = 'http://127.0.0.1:9/api'; // Biblio apagado: el aviso no se entrega
  servidor = aplicacion.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () =>
{
  servidor.close();
  await CerrarBases();
});

test('CIAA: solo con su clave; filtra inscritos y permite corregir una matrícula', async () =>
{
  const sin_clave = await Solicitar('GET', '/ciaa/api/alumnos', 'otra');
  assert.equal(sin_clave.status, 401);
  const { data } = await Solicitar('GET', '/ciaa/api/alumnos?estatus=Inscrito', ENTORNO.CLAVES.CIAA);
  assert.equal(data.total, 6);
  assert.equal(data.datos.some((alumno) => alumno.Matricula === '3098117'), false);

  const corregido = await Solicitar('PUT', '/ciaa/api/alumnos/31O5877', ENTORNO.CLAVES.CIAA, {
    Matricula: '3105877',
  });
  assert.equal(corregido.data.Matricula, '3105877');
});

test('Empleados: activos con su tipo; la clave del CIAA no sirve', async () =>
{
  const ajena = await Solicitar('GET', '/empleados/api/empleados', ENTORNO.CLAVES.CIAA);
  assert.equal(ajena.status, 401);
  const { data } = await Solicitar(
    'GET',
    '/empleados/api/empleados?estatus=Activo',
    ENTORNO.CLAVES.EMPLEADOS,
  );
  assert.equal(data.total, 8);
  assert.equal(data.datos.find((empleado) => empleado.Numero_Nomina === '1002745').Tipo, 'Docente');
});

test('Tesorería: recibe una vez, se acepta o rechaza una sola vez y pide motivo', async () =>
{
  const clave = ENTORNO.CLAVES.TESORERIA;
  const solicitud = {
    referencia: '99',
    solicitante: 'Felipe Rodríguez',
    fecha: '2026-10-27',
    total: 1798,
    renglones: [
      { Titulo: 'Clean Code', ISBN: '978-0-13-235088-4', Cantidad: 2, Precio_Unitario: 899 },
    ],
  };
  const recibida = await Solicitar('POST', '/tesoreria/api/solicitudes', clave, solicitud);
  assert.equal(recibida.status, 201);
  assert.match(recibida.data.Folio, /^TES-2026-\d{4}$/);
  assert.equal(recibida.data.Estatus, 'Recibida');

  const reenvio = await Solicitar('POST', '/tesoreria/api/solicitudes', clave, solicitud);
  assert.equal(reenvio.status, 200);
  assert.equal(reenvio.data.Folio, recibida.data.Folio);

  const ruta = `/tesoreria/api/solicitudes/${recibida.data.Folio}`;
  assert.equal((await Solicitar('POST', `${ruta}/rechazar`, clave, {})).status, 400);
  const aceptada = await Solicitar('POST', `${ruta}/aceptar`, clave, {});
  assert.equal(aceptada.data.Estatus, 'Aceptada');
  assert.equal(aceptada.data.Notificada, false); // Biblio no está encendido en la prueba
  assert.equal((await Solicitar('POST', `${ruta}/aceptar`, clave, {})).status, 409);
});
