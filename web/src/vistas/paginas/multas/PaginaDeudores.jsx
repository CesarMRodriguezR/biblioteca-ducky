/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL06 · PaginaDeudores.jsx
 * Función: Lista de alumnos deudores del periodo de exámenes: generar, imprimir (con vista
 *          previa) y enviar a Servicios Escolares.
 * Autor: Equipo CCJMops
 * Fecha: 15/11/2026
 * Entrada: Estado del controlador de la pantalla
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente       Objetivo
 *     PaginaDeudores   BD-SP03-DL06 Lista de alumnos deudores
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { Printer, Send } from 'lucide-react';
import { useControladorDeudores } from '../../../controladores/ControladorDevoluciones.js';
import { FormatoMoneda, PERIODOS_EXAMEN } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  EnlaceVolver,
  Selector,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import { DocumentoDeudores, ModalDocumento } from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaDeudores
 * Objetivo: BD-SP03-DL06 Lista de alumnos deudores (sin generar, generada, sin deudores,
 *           vista previa en PDF y envío a Servicios Escolares).
 * Uso: <PaginaDeudores />
 */
export function PaginaDeudores()
{
  const controlador = useControladorDeudores();
  const { lista, vista } = controlador;

  return (
    <Pagina miga="Multas y adeudos · Alumnos deudores" titulo="Lista de alumnos deudores" ancho={1000}>
      <EnlaceVolver to="/multas">Volver a Multas y adeudos</EnlaceVolver>
      <Tarjeta>
        <h2 className="titulo-seccion">Periodo de exámenes</h2>
        <p className="texto-nota margen-arriba-4">
          Incluye alumnos con libros vencidos o multas pendientes
        </p>
        <div className="fila espacio-12 fila-buscador margen-arriba-16">
          <Selector
            className="campo-buscador"
            etiqueta="Periodo"
            value={controlador.periodo}
            onChange={(evento) => controlador.SetPeriodo(evento.target.value)}
            opciones={PERIODOS_EXAMEN}
          />
          <Boton onClick={controlador.Generar} disabled={controlador.generando}>
            {controlador.generando ? 'Generando…' : 'Generar lista'}
          </Boton>
        </div>
      </Tarjeta>
      <AlertaError error={controlador.error} />

      {lista && !lista.datos.length && (
        <div className="margen-arriba-16">
          <Alerta tipo="exito" titulo="No hay alumnos deudores para este periodo">
            Ningún alumno tiene libros sin devolver ni multas pendientes.
          </Alerta>
        </div>
      )}

      {lista && lista.datos.length > 0 && (
        <>
          <Tarjeta relleno={false} className="tabla-envoltura margen-arriba-16">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Alumno</th>
                  <th>Libros sin devolver</th>
                  <th>Multas pendientes</th>
                  <th>Total adeudo</th>
                </tr>
              </thead>
              <tbody>
                {lista.datos.map((alumno) => (
                  <tr key={alumno.Matricula_Nomina}>
                    <td style={{ fontWeight: 700 }}>{alumno.Matricula_Nomina}</td>
                    <td>{alumno.Nombre_Completo}</td>
                    <td>{alumno.Libros_Sin_Devolver}</td>
                    <td>{alumno.Multas_Pendientes}</td>
                    <td>{FormatoMoneda(alumno.Total_Adeudo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>
          <p className="texto-nota margen-arriba-8">
            El total suma las multas pendientes y la multa que llevan acumulada los libros vencidos
            ($10.00 por día).
          </p>
          <div className="margen-arriba-16">
            <Alerta
              tipo="informacion"
              titulo={`Lista generada: ${lista.datos.length} ${lista.datos.length === 1 ? 'alumno deudor' : 'alumnos deudores'}`}
            >
              Puedes imprimirla o enviarla a Servicios Escolares.
            </Alerta>
          </div>
          {controlador.aviso && (
            <div className="margen-arriba-16">
              <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
                {controlador.aviso.texto}
              </Alerta>
            </div>
          )}
          <div className="fila espacio-12 margen-arriba-24">
            <Boton icono={Send} onClick={controlador.Enviar} disabled={controlador.enviando}>
              {controlador.enviando ? 'Enviando…' : 'Enviar a Servicios Escolares'}
            </Boton>
            <Boton variante="secundario" icono={Printer} onClick={controlador.Imprimir}>
              Imprimir
            </Boton>
          </div>
        </>
      )}

      {vista.abierta && (
        <ModalDocumento
          titulo="Vista previa · Lista de alumnos deudores"
          al_cerrar={vista.Cerrar}
          al_imprimir={vista.Imprimir}
          al_descargar={vista.Descargar}
          descargando={vista.descargando}
          cargando={vista.cargando}
          error={vista.error}
        >
          {vista.datos && <DocumentoDeudores lista={vista.datos} />}
        </ModalDocumento>
      )}
    </Pagina>
  );
}
