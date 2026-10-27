/*
 * ******************************************************************
 * Nombre del programa: MOVIL-INICIO · PantallaInicio.js
 * Función: Saludo, buscador y libros recientes del catálogo.
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
 *     PantallaInicio   Inicio: saludo, buscador con filtros y recomendados
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
import { useControladorInicio } from '../../controladores/ControladorCatalogo';
import { TarjetaLibro } from '../componentes/TarjetaLibro';
import { Buscador, Cargando, Filtros, ErrorCarga } from '../componentes/interfaz';
import { COLORES, ESPACIO, TIPOGRAFIA } from '../tema';

/*
 * Componente: PantallaInicio
 * Objetivo: Inicio: saludo, buscador con filtros y recomendados.
 * Uso: <PantallaInicio navigation={…} />
 */
export function PantallaInicio({ navigation })
{
  const controlador = useControladorInicio(navigation);

  return (
    <FlatList
      style={{ backgroundColor: COLORES.fondo }}
      contentContainerStyle={estilos.contenido}
      data={controlador.recomendados}
      keyExtractor={(libro) => String(libro.id_libro)}
      renderItem={({ item: libro }) => (
        <TarjetaLibro libro={libro} onPress={() => controlador.AbrirLibro(libro)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: ESPACIO.m }} />}
      refreshing={false}
      onRefresh={controlador.Recargar}
      ListHeaderComponent={
        <View style={{ gap: ESPACIO.l, marginBottom: ESPACIO.m }}>
          <Text style={estilos.saludo}>{controlador.saludo}</Text>
          <Buscador
            valor={controlador.texto}
            al_cambio={controlador.SetTexto}
            al_buscar={controlador.Buscar}
          />
          <Filtros opciones={controlador.campos} valor="todos" al_cambio={controlador.ElegirCampo} />
          <Text style={[TIPOGRAFIA.subtitulo, { marginTop: ESPACIO.s }]}>Recomendados</Text>
          {controlador.cargando && <Cargando />}
          <ErrorCarga error={controlador.error} al_reintentar={controlador.Recargar} />
        </View>
      }
    />
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: ESPACIO.xl, paddingTop: ESPACIO.s },
  saludo: { fontSize: 21, fontWeight: '600', color: COLORES.texto_principal, lineHeight: 29 },
});
