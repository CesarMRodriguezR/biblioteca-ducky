/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-BL01 · TarjetaLibro.js
 * Función: Tarjeta de un libro con portada, autores, disponibilidad y ubicación.
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
 *     Componente     Objetivo
 *     TarjetaLibro   Tarjeta de un libro en las listas. La variante…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) Los colores, espacios y tipografía se toman de tema.js; los estilos se crean con
 *     StyleSheet.create.
 * ******************************************************************
 */

import { StyleSheet, Text, View } from 'react-native';
import { CopiasTexto, DisponiblesTexto, UbicacionTexto } from '../../modelos/dominio';
import { ESPACIO, TIPOGRAFIA } from '../tema';
import { Insignia, Portada, Tarjeta, Ubicacion } from './interfaz';

/*
 * Componente: TarjetaLibro
 * Objetivo: Tarjeta de un libro en las listas. La variante "detallada" (búsqueda sin filtro)
 *           añade la ubicación y el total de copias.
 * Uso: <TarjetaLibro libro={…} detallada={…} onPress={…} />
 */
export function TarjetaLibro({ libro, detallada, onPress })
{
  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  const seccion = libro.Temas?.split(',')[0]?.trim();
  return (
    <Tarjeta
      onPress={onPress}
      etiqueta_accesible={`${libro.Titulo}. ${DisponiblesTexto(libro)}`}
      estilo={estilos.tarjeta}
    >
      <Portada libro={libro} />
      <View style={estilos.datos}>
        <Text style={TIPOGRAFIA.titulo_tarjeta} numberOfLines={2}>
          {libro.Titulo}
        </Text>
        <Text style={TIPOGRAFIA.secundario} numberOfLines={1}>
          {detallada
            ? libro.Autores_Apellidos
            : `${libro.Autores_Apellidos} · ${libro.Nombre_Editorial}`}
        </Text>
        {detallada && <Ubicacion texto={UbicacionTexto(libro, seccion)} />}
        <Insignia tono={disponibles ? 'exito' : 'advertencia'} estilo={{ marginTop: 2 }}>
          {detallada
            ? `${CopiasTexto(libro.Ejemplares_Totales ?? 0)} · ${disponibles} disponibles`
            : DisponiblesTexto(libro)}
        </Insignia>
      </View>
    </Tarjeta>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { flexDirection: 'row', gap: ESPACIO.l, paddingVertical: 20, paddingHorizontal: 22 },
  datos: { flex: 1, gap: 4 },
});
