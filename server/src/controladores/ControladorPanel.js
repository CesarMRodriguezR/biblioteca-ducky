import { ModeloUsuario } from '../modelos/ModeloUsuario.js';
import { ModeloLibro } from '../modelos/ModeloLibro.js';
import { ModeloOrdenCompra } from '../modelos/ModeloOrdenCompra.js';
import { ModeloBitacora } from '../modelos/ModeloBitacora.js';

const ControladorPanel = {
  /** GET /panel — indicadores y actividad reciente (pantalla "Panel"). */
  async Resumen(_req, res) 
  {
    const [usuarios_validos, solicitudes_pendientes, libros_activos, actividad] = await Promise.all(
      [
        ModeloUsuario.ContarActivos(),
        ModeloOrdenCompra.ContarPendientes(),
        ModeloLibro.ContarActivos(),
        ModeloBitacora.Recientes(8),
      ],
    );
    res.json({
      usuarios_validos,
      solicitudes_pendientes,
      libros_activos,
      actividad,
    });
  },
};

export { ControladorPanel };
