/*
 * ******************************************************************
 * Nombre del programa: API-PRUEBAS · SimuladorExternos.js
 * Función: Simular en memoria las APIs de CIAA, Empleados y Tesorería para las pruebas de
 *          integración, sin depender del servicio externos/.
 * Autor: Equipo CCJMops
 * Fecha: 27/10/2026
 * Entrada: Peticiones HTTP de la API de Biblio
 * Salida: Servidor HTTP local y el estado de Tesorería para revisarlo en las pruebas
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo              Objetivo
 *     ALUMNOS             Alumnos inscritos que entrega el CIAA simulado
 *     EMPLEADOS           Empleados activos que entrega Empleados simulado
 *     Persona             Armar un registro con el formato de los sistemas externos
 *     IniciarSimulador    Levantar el servidor simulado en un puerto libre
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Los datos son los mismos casos de externos/database: altas nuevas, una matrícula con
 *     letra, una nómina sin nombre y tres cuentas de Biblio que ya no aparecen
 *     (diego.fuentes, luis.moreno y hector.villarreal).
 * ******************************************************************
 */

import http from 'node:http';

/*
 * Función: Persona
 * Objetivo: Armar un registro con los campos que usan los sistemas externos.
 * Entrada: clave, nombre, segundo, paterno, materno, extra (opcional)
 * Salida: Objeto con nombre, apellidos y correo
 */
function Persona(clave, nombre, segundo, paterno, materno, extra = {})
{
  return {
    ...clave,
    Nombre: nombre,
    Segundo_Nombre: segundo,
    Apellido_Paterno: paterno,
    Apellido_Materno: materno,
    Correo_Institucional: nombre ? `${nombre.toLowerCase()}@ducky.edu.mx` : null,
    ...extra,
  };
}

/*
 * Constante: ALUMNOS
 * Objetivo: Alumnos inscritos que entrega el CIAA simulado.
 */
const ALUMNOS = [
  Persona({ Matricula: '3105843' }, 'Marcela', null, 'Guerra', 'Salinas'),
  Persona({ Matricula: '3112390' }, 'María', 'Fernanda', 'Ortiz', 'Vega'),
  Persona({ Matricula: '3105842' }, 'Ana', null, 'Ramírez', 'Torres'),
  Persona({ Matricula: '3150221' }, 'César', 'Manuel', 'Rodríguez', 'Leal'),
  Persona({ Matricula: '31O5877' }, 'Paola', null, 'Treviño', 'Garza'),
  Persona({ Matricula: '3108890' }, 'Diego', null, 'Flores', 'Garza'),
];

/*
 * Constante: EMPLEADOS
 * Objetivo: Empleados activos que entrega Empleados simulado.
 */
const EMPLEADOS = [
  Persona({ Numero_Nomina: '1001133' }, 'Felipe', null, 'Rodríguez', 'Garza', {
    Tipo: 'Directivo',
  }),
  Persona({ Numero_Nomina: '2004720' }, 'Catherine', null, 'Ramírez', 'Soto', {
    Tipo: 'Bibliotecario',
  }),
  Persona({ Numero_Nomina: '1987345' }, 'Javier', null, 'Saavedra', 'López', {
    Tipo: 'Docente',
  }),
  Persona({ Numero_Nomina: '2005872' }, 'César', null, 'Rodríguez', 'Mena', {
    Tipo: 'Administrativo',
  }),
  Persona({ Numero_Nomina: '1002745' }, 'Jorge', 'Emilio', 'Salas', 'Medina', {
    Tipo: 'Docente',
  }),
  Persona({ Numero_Nomina: '1004981' }, '', null, '', null, { Tipo: 'Docente' }),
];

/*
 * Función: IniciarSimulador
 * Objetivo: Levantar el servidor simulado en un puerto libre.
 * Entrada: Ninguna
 * Salida: Promesa con { servidor, url, solicitudes (Map folio → solicitud), Cerrar }
 */
function IniciarSimulador()
{
  const solicitudes = new Map([
    ['TES-2026-0001', { Folio: 'TES-2026-0001', Referencia: '3', Estatus: 'Aceptada' }],
    ['TES-2026-0002', { Folio: 'TES-2026-0002', Referencia: '2', Estatus: 'Recibida' }],
  ]);
  const servidor = http.createServer(async (req, res) =>
  {
    const Responder = (estado, datos) =>
    {
      res.writeHead(estado, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(datos));
    };
    const direccion = new URL(req.url, 'http://local');
    const ruta = direccion.pathname;
    let cuerpo = '';
    for await (const parte of req)
    {
      cuerpo += parte;
    }

    if (req.method === 'GET' && ruta === '/ciaa/api/alumnos')
    {
      return Responder(200, { total: ALUMNOS.length, datos: ALUMNOS });
    }
    if (req.method === 'GET' && ruta === '/empleados/api/empleados')
    {
      return Responder(200, { total: EMPLEADOS.length, datos: EMPLEADOS });
    }
    if (req.method === 'POST' && ruta === '/tesoreria/api/solicitudes')
    {
      const datos = JSON.parse(cuerpo);
      const existente = [...solicitudes.values()].find(
        (solicitud) => solicitud.Referencia === datos.referencia,
      );
      if (existente)
      {
        return Responder(200, existente);
      }
      const folio = `TES-2026-${String(solicitudes.size + 1).padStart(4, '0')}`;
      const solicitud = {
        ...datos,
        Folio: folio,
        Referencia: datos.referencia,
        Estatus: 'Recibida',
      };
      solicitudes.set(folio, solicitud);
      return Responder(201, solicitud);
    }
    if (req.method === 'GET' && ruta === '/tesoreria/api/solicitudes')
    {
      const referencias = (direccion.searchParams.get('referencias') ?? '').split(',');
      const datos = [...solicitudes.values()].filter((solicitud) =>
        referencias.includes(solicitud.Referencia),
      );
      return Responder(200, { total: datos.length, datos });
    }
    const folio = ruta.match(/^\/tesoreria\/api\/solicitudes\/([^/]+)$/)?.[1];
    if (req.method === 'GET' && folio)
    {
      return solicitudes.has(folio)
        ? Responder(200, solicitudes.get(folio))
        : Responder(404, { error: `No existe la solicitud ${folio}` });
    }
    return Responder(404, { error: 'Ruta no encontrada' });
  });

  return new Promise((resolver) =>
  {
    servidor.listen(0, '127.0.0.1', () =>
    {
      resolver({
        servidor,
        url: `http://127.0.0.1:${servidor.address().port}`,
        solicitudes,
        Cerrar: () => new Promise((listo) => servidor.close(listo)),
      });
    });
  });
}

export { IniciarSimulador };
