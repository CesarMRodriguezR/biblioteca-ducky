/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU02 · SelectorArchivo.jsx
 * Función: Zona para soltar o elegir la lista de Servicios Escolares.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Props y estado del controlador de la pantalla
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente        Objetivo
 *     SelectorArchivo   Zona para soltar o elegir la lista de Servicios Escolares…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) Los estilos están en las clases de estilos-globales.css; style en línea solo para valores
 *     calculados.
 * ******************************************************************
 */

import { useRef, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Boton, Tarjeta } from './interfaz.jsx';

/*
 * Componente: SelectorArchivo
 * Objetivo: Zona para soltar o elegir la lista de Servicios Escolares (.xlsx, .xls, .csv).
 * Uso: <SelectorArchivo titulo={…} descripcion={…} al_archivo={…} procesando={…} />
 */
export function SelectorArchivo({ titulo, descripcion, al_archivo, procesando })
{
  const entrada = useRef(null);
  const [encima, SetEncima] = useState(false);

  return (
    <Tarjeta
      style={{
        borderStyle: 'dashed',
        borderWidth: 2,
        textAlign: 'center',
        padding: 40,
        borderColor: encima ? 'var(--azul-brillante)' : 'var(--linea-divisoria)',
      }}
      onDragOver={(evento) =>
      {
        evento.preventDefault();
        SetEncima(true);
      }}
      onDragLeave={() => SetEncima(false)}
      onDrop={(evento) =>
      {
        evento.preventDefault();
        SetEncima(false);
        al_archivo(evento.dataTransfer.files[0]);
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'var(--informacion-fondo)',
          color: 'var(--azul-principal)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 12px',
        }}
      >
        <FileSpreadsheet size={24} aria-hidden />
      </div>
      <h3>{titulo}</h3>
      <p className="texto-nota margen-arriba-8">{descripcion}</p>
      <input
        ref={entrada}
        type="file"
        accept=".xlsx,.xls,.csv"
        hidden
        onChange={(evento) =>
        {
          al_archivo(evento.target.files[0]);
          evento.target.value = '';
        }}
      />
      <Boton className="margen-arriba-16" onClick={() => entrada.current.click()} disabled={procesando}>
        {procesando ? 'Revisando lista…' : 'Elegir archivo'}
      </Boton>
    </Tarjeta>
  );
}
