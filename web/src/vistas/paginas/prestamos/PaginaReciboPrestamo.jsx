/*
 * ******************************************************************
 * Nombre del programa: BD-SP03-PL02 · PaginaReciboPrestamo.jsx
 * Función: Recibo de préstamo: datos del préstamo y entrega impresa, por correo o por WhatsApp,
 *          con vista previa de impresión.
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
 *     Componente             Objetivo
 *     PaginaReciboPrestamo   BD-SP03-PL02 Recibo de préstamo generado
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) El aviso de cada medio de entrega se muestra en la pantalla (Alerta), no como ventana
 *     emergente.
 * ******************************************************************
 */

import { Mail, MessageCircle, Printer } from 'lucide-react';
import { useControladorRecibo } from '../../../controladores/ControladorPrestamos.js';
import { Pagina } from '../../plantillas/PlantillaAplicacion.jsx';
import {
  Alerta,
  AlertaError,
  Boton,
  Cargando,
  EnlaceVolver,
  Tarjeta,
} from '../../componentes/interfaz.jsx';
import { DocumentoRecibo, ModalDocumento } from '../../componentes/Circulacion.jsx';

/*
 * Componente: PaginaReciboPrestamo
 * Objetivo: BD-SP03-PL02 Recibo de préstamo generado y su entrega al lector.
 * Uso: <PaginaReciboPrestamo />
 */
export function PaginaReciboPrestamo()
{
  const controlador = useControladorRecibo();
  const { recibo, vista } = controlador;

  return (
    <Pagina miga="Préstamos · Recibo" titulo="Recibo de préstamo" ancho={1000}>
      <EnlaceVolver to="/prestamos">Volver a Préstamos</EnlaceVolver>
      {controlador.cargando && <Cargando />}
      <AlertaError error={controlador.error} />
      {recibo && (
        <>
          <Tarjeta>
            <DocumentoRecibo recibo={recibo} />
          </Tarjeta>
          <Tarjeta className="margen-arriba-16">
            <h2 className="titulo-seccion">Entrega del recibo · Medio predeterminado: Imprimir</h2>
            <div className="fila espacio-12 margen-arriba-16">
              <Boton icono={Printer} onClick={controlador.Imprimir}>
                Imprimir
              </Boton>
              <Boton variante="secundario" icono={Mail} onClick={controlador.EnviarCorreo}>
                Enviar por correo
              </Boton>
              <Boton variante="secundario" icono={MessageCircle} onClick={controlador.EnviarWhatsApp}>
                Enviar por WhatsApp
              </Boton>
            </div>
          </Tarjeta>
          {controlador.aviso && (
            <div className="margen-arriba-16">
              <Alerta tipo={controlador.aviso.tipo} titulo={controlador.aviso.titulo}>
                {controlador.aviso.texto}
              </Alerta>
            </div>
          )}
        </>
      )}
      {vista.abierta && (
        <ModalDocumento
          titulo="Vista previa del recibo"
          al_cerrar={vista.Cerrar}
          al_imprimir={vista.Imprimir}
          al_descargar={vista.Descargar}
          descargando={vista.descargando}
          cargando={vista.cargando}
          error={vista.error}
        >
          {vista.datos && <DocumentoRecibo recibo={vista.datos} />}
        </ModalDocumento>
      )}
    </Pagina>
  );
}
