/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-DL03 · PaginaLibroPerdido.jsx
 * Función: Reportar un libro perdido: multa por reposición y aviso a Servicios Escolares y a
 *          Tesorería.
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
 *     Componente           Objetivo
 *     PaginaLibroPerdido   BD-SP03-DL03 Reporte de libro perdido
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * ******************************************************************
 */

import { CircleAlert, FileText } from 'lucide-react';
import { useControladorLibroPerdido } from '../../../controladores/ControladorDevoluciones.js';
import { FechaCorta, FormatoMoneda, HoyIso } from '../../../modelos/dominio.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  Boton,
  DatoEtiquetado,
  EnlaceVolver,
  Insignia,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import {
  BuscadorMatricula,
  DocumentoMulta,
  ModalDocumento,
  TablaPendientes,
} from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaLibroPerdido
 * Objetivo: BD-SP03-DL03 Reporte de libro perdido (búsqueda, préstamo elegido, reporte exitoso
 *           y lector sin préstamos pendientes).
 * Uso: <PaginaLibroPerdido />
 */
export function PaginaLibroPerdido()
{
  const controlador = useControladorLibroPerdido();
  const { lector, seleccionado, resultado, vista } = controlador;
  const situacion = lector.situacion;

  return (
    <Pagina miga="Devoluciones · Libro perdido" titulo="Reporte de libro perdido">
      <EnlaceVolver to="/devoluciones">Volver a Devoluciones</EnlaceVolver>
      <BuscadorMatricula
        titulo="Préstamo reportado como perdido"
        subtitulo={
          seleccionado
            ? `${seleccionado.Titulo} · Copia ${seleccionado.num_copia} · ` +
              `${seleccionado.Nombre_Completo} (${seleccionado.Nombre_Rol} · ` +
              `${seleccionado.Matricula_Nomina})`
            : situacion && controlador.pendientes.length
              ? `${situacion.lector.Nombre_Completo} · ${situacion.lector.Nombre_Rol} · ` +
                `${controlador.pendientes.length} ${controlador.pendientes.length === 1 ? 'préstamo pendiente' : 'préstamos pendientes'}`
              : null
        }
        valor={lector.matricula}
        al_cambio={lector.SetMatricula}
        al_buscar={controlador.Buscar}
        buscando={lector.buscando}
      />
      {lector.error && (
        <div className="margen-arriba-16">
          <Alerta tipo="error" titulo={lector.error.message}>
            Revisa la matrícula e intenta de nuevo.
          </Alerta>
        </div>
      )}
      {situacion && !controlador.pendientes.length && !resultado && (
        <div className="margen-arriba-16">
          <Alerta
            tipo="informacion"
            titulo={`${situacion.lector.Nombre_Completo} no tiene préstamos pendientes`}
          >
            No hay libros que se puedan reportar como perdidos.
          </Alerta>
        </div>
      )}
      {!seleccionado && controlador.pendientes.length > 0 && (
        <>
          <h2 className="margen-arriba-24">Préstamos pendientes</h2>
          <TablaPendientes
            prestamos={controlador.pendientes}
            etiqueta_accion="Reportar"
            icono_accion={CircleAlert}
            al_elegir={controlador.Elegir}
          />
        </>
      )}

      {seleccionado && (
        <Tarjeta className="margen-arriba-16">
          <h2 className="titulo-seccion">Valor de reposición</h2>
          <p className="texto-nota margen-arriba-4">
            La multa por reposición es igual al precio de la última compra del libro (en MXN)
          </p>
          <div className="rejilla-3 margen-arriba-16">
            <DatoEtiquetado etiqueta="Fecha del reporte" valor={FechaCorta(HoyIso())} />
            <DatoEtiquetado
              etiqueta="Precio de última compra"
              valor={`${FormatoMoneda(seleccionado.Precio)} MXN`}
            />
            <DatoEtiquetado etiqueta="Multa por reposición" valor={FormatoMoneda(seleccionado.Precio)} />
          </div>
          <div className="margen-arriba-16">
            <Insignia tono="error">
              La copia {seleccionado.num_copia} se marcará como perdida
            </Insignia>
          </div>
        </Tarjeta>
      )}

      {controlador.aviso && (
        <div className="margen-arriba-16">
          <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
            {controlador.aviso.texto}
          </Alerta>
        </div>
      )}

      <div className="fila espacio-12 margen-arriba-24">
        {seleccionado && !resultado && (
          <>
            <Boton
              variante="peligro"
              icono={CircleAlert}
              onClick={controlador.Reportar}
              disabled={controlador.enviando}
            >
              {controlador.enviando ? 'Reportando…' : 'Reportar como perdido'}
            </Boton>
            <Boton variante="texto" onClick={controlador.Cancelar}>
              Cancelar
            </Boton>
          </>
        )}
        {resultado && (
          <Boton icono={FileText} onClick={controlador.ImprimirMulta}>
            Imprimir multa
          </Boton>
        )}
      </div>

      {vista.abierta && (
        <ModalDocumento
          titulo="Vista previa del recibo de multa"
          al_cerrar={vista.Cerrar}
          al_imprimir={vista.Imprimir}
          al_descargar={vista.Descargar}
          descargando={vista.descargando}
          cargando={vista.cargando}
          error={vista.error}
        >
          {vista.datos && <DocumentoMulta multa={vista.datos} />}
        </ModalDocumento>
      )}
    </Pagina>
  );
}
