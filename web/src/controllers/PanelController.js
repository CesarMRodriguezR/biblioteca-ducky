import { PanelModel } from '../models/LibroModel';
import { useCarga } from './useAsync';

/** BD-SP01-GU01 Resultado: panel con indicadores y actividad reciente. */
export function usePanelController() {
  const { datos, error, cargando } = useCarga(() => PanelModel.resumen(), []);
  return { resumen: datos, error, cargando };
}
