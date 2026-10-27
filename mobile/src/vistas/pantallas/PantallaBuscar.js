/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-BL01 · PantallaBuscar.js
 * Función: Búsqueda de libros por título, autor o tema con filtros y resultados.
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
 *     Componente       Objetivo
 *     PantallaBuscar   BD-SP02-BL01 Buscar libros: resultados y búsqueda sin filtro
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

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useControladorBusqueda } from '../../controladores/ControladorCatalogo';
import { TarjetaLibro } from '../componentes/TarjetaLibro';
import { Buscador, Cargando, Filtros, ErrorCarga, Tarjeta } from '../componentes/interfaz';
import { COLORES, ESPACIO, TIPOGRAFIA } from '../tema';

/*
 * Componente: PantallaBuscar
 * Objetivo: BD-SP02-BL01 Buscar libros: resultados y búsqueda sin filtro.
 * Uso: <PantallaBuscar route={…} navigation={…} />
 */
export function PantallaBuscar({ route, navigation })
{
  const controlador = useControladorBusqueda(route, navigation);
  const primera_carga = controlador.cargando && !controlador.libros.length;

  return (
    <FlatList
      style={{ backgroundColor: COLORES.fondo }}
      contentContainerStyle={estilos.contenido}
      data={controlador.libros}
      keyExtractor={(libro) => String(libro.id_libro)}
      renderItem={({ item: libro }) => (
        <TarjetaLibro
          libro={libro}
          detallada={controlador.sin_filtro}
          onPress={() => controlador.AbrirLibro(libro)}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: ESPACIO.m }} />}
      onEndReached={controlador.CargarMas}
      onEndReachedThreshold={0.4}
      refreshing={false}
      onRefresh={controlador.Recargar}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: ESPACIO.l, marginBottom: ESPACIO.m }}>
          <Buscador
            valor={controlador.texto}
            al_cambio={controlador.SetTexto}
            al_buscar={controlador.Buscar}
          />
          <Filtros
            opciones={controlador.campos}
            valor={controlador.campo}
            al_cambio={controlador.ElegirCampo}
          />
          {primera_carga ? (
            <Cargando texto="Buscando…" />
          ) : (
            !controlador.error && <Text style={TIPOGRAFIA.secundario}>{controlador.resumen}</Text>
          )}
          <ErrorCarga error={controlador.error} al_reintentar={controlador.Recargar} />
        </View>
      }
      ListEmptyComponent={
        !controlador.cargando && !controlador.error ? (
          <Tarjeta estilo={{ alignItems: 'center', paddingVertical: ESPACIO.xxl }}>
            <Text style={[TIPOGRAFIA.titulo_tarjeta, { textAlign: 'center' }]}>
              No hay ningún libro registrado con esos datos.
            </Text>
            <Text style={[TIPOGRAFIA.secundario, { marginTop: 6, textAlign: 'center' }]}>
              Revisa la ortografía o busca en otro campo.
            </Text>
          </Tarjeta>
        ) : null
      }
      ListFooterComponent={controlador.cargando && controlador.libros.length ? <Cargando /> : null}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: ESPACIO.xl, paddingTop: ESPACIO.s },
});
