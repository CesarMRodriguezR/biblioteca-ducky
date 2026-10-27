import { StyleSheet, Text, View } from 'react-native';
import { copiasTexto, disponiblesTexto, ubicacionTexto } from '../../models/dominio';
import { espacio, tipografia } from '../tema';
import {
  Insignia, Portada, Tarjeta, Ubicacion,
} from './ui';

/**
 * Tarjeta de un libro en las listas. La variante "detallada" (búsqueda
 * sin filtro) añade la ubicación y el total de copias.
 */
export function TarjetaLibro({ libro, detallada, onPress }) {
  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  const seccion = libro.Temas?.split(',')[0]?.trim();
  return (
    <Tarjeta onPress={onPress} etiquetaAccesible={`${libro.Titulo}. ${disponiblesTexto(libro)}`} estilo={estilos.tarjeta}>
      <Portada libro={libro} />
      <View style={estilos.datos}>
        <Text style={tipografia.tituloTarjeta} numberOfLines={2}>{libro.Titulo}</Text>
        <Text style={tipografia.secundario} numberOfLines={1}>
          {detallada ? libro.Autores_Apellidos : `${libro.Autores_Apellidos} · ${libro.Nombre_Editorial}`}
        </Text>
        {detallada && <Ubicacion texto={ubicacionTexto(libro, seccion)} />}
        <Insignia tono={disponibles ? 'exito' : 'advertencia'} estilo={{ marginTop: 2 }}>
          {detallada
            ? `${copiasTexto(libro.Ejemplares_Totales ?? 0)} · ${disponibles} disponibles`
            : disponiblesTexto(libro)}
        </Insignia>
      </View>
    </Tarjeta>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { flexDirection: 'row', gap: espacio.l, paddingVertical: 20, paddingHorizontal: 22 },
  datos: { flex: 1, gap: 4 },
});
