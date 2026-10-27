import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useBusquedaController } from '../../controllers/CatalogoController';
import { TarjetaLibro } from '../components/TarjetaLibro';
import {
  Buscador, Cargando, Chips, ErrorCarga, Tarjeta,
} from '../components/ui';
import { colores, espacio, tipografia } from '../tema';

/** BD-SP02-BL01 Buscar libros: resultados y búsqueda sin filtro. */
export function BuscarScreen({ route, navigation }) {
  const c = useBusquedaController(route, navigation);
  const primeraCarga = c.cargando && !c.libros.length;

  return (
    <FlatList
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={estilos.contenido}
      data={c.libros}
      keyExtractor={(l) => String(l.id_libro)}
      renderItem={({ item }) => (
        <TarjetaLibro libro={item} detallada={c.sinFiltro} onPress={() => c.abrirLibro(item)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: espacio.m }} />}
      onEndReached={c.cargarMas}
      onEndReachedThreshold={0.4}
      refreshing={false}
      onRefresh={c.recargar}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={(
        <View style={{ gap: espacio.l, marginBottom: espacio.m }}>
          <Buscador valor={c.texto} onCambio={c.setTexto} onBuscar={c.buscar} />
          <Chips opciones={c.campos} valor={c.campo} onCambio={c.elegirCampo} />
          {primeraCarga ? <Cargando texto="Buscando…" /> : (
            !c.error && <Text style={tipografia.secundario}>{c.resumen}</Text>
          )}
          <ErrorCarga error={c.error} onReintentar={c.recargar} />
        </View>
      )}
      ListEmptyComponent={!c.cargando && !c.error ? (
        <Tarjeta estilo={{ alignItems: 'center', paddingVertical: espacio.xxl }}>
          <Text style={[tipografia.tituloTarjeta, { textAlign: 'center' }]}>No hay ningún libro registrado con esos datos.</Text>
          <Text style={[tipografia.secundario, { marginTop: 6, textAlign: 'center' }]}>Revisa la ortografía o busca en otro campo.</Text>
        </Tarjeta>
      ) : null}
      ListFooterComponent={c.cargando && c.libros.length ? <Cargando /> : null}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.xl, paddingTop: espacio.s },
});
