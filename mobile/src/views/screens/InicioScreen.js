import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useInicioController } from '../../controllers/CatalogoController';
import { TarjetaLibro } from '../components/TarjetaLibro';
import {
  Buscador, Cargando, Chips, ErrorCarga,
} from '../components/ui';
import { colores, espacio, tipografia } from '../tema';

/** Inicio: saludo, buscador con filtros y recomendados. */
export function InicioScreen({ navigation }) {
  const c = useInicioController(navigation);

  return (
    <FlatList
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={estilos.contenido}
      data={c.recomendados}
      keyExtractor={(l) => String(l.id_libro)}
      renderItem={({ item }) => <TarjetaLibro libro={item} onPress={() => c.abrirLibro(item)} />}
      ItemSeparatorComponent={() => <View style={{ height: espacio.m }} />}
      refreshing={false}
      onRefresh={c.recargar}
      ListHeaderComponent={(
        <View style={{ gap: espacio.l, marginBottom: espacio.m }}>
          <Text style={estilos.saludo}>{c.saludo}</Text>
          <Buscador valor={c.texto} onCambio={c.setTexto} onBuscar={c.buscar} />
          <Chips opciones={c.campos} valor="todos" onCambio={c.elegirCampo} />
          <Text style={[tipografia.subtitulo, { marginTop: espacio.s }]}>Recomendados</Text>
          {c.cargando && <Cargando />}
          <ErrorCarga error={c.error} onReintentar={c.recargar} />
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.xl, paddingTop: espacio.s },
  saludo: { fontSize: 21, fontWeight: '600', color: colores.textoPrincipal, lineHeight: 29 },
});
