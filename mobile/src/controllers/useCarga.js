import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga datos de un modelo y expone { datos, error, cargando, recargar }.
 * Ignora respuestas que llegan después de desmontar o de una carga nueva.
 */
export function useCarga(cargar, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const ultima = useRef(0);

  const recargar = useCallback(async () => {
    const id = ++ultima.current;
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    try {
      const datos = await cargar();
      if (id === ultima.current) setEstado({ datos, error: null, cargando: false });
    } catch (error) {
      if (id === ultima.current) setEstado((e) => ({ ...e, error, cargando: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => {
    recargar();
    return () => { ultima.current += 1; };
  }, [recargar]);

  return { ...estado, recargar };
}
