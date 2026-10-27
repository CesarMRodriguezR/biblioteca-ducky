/*
 * ******************************************************************
 * Nombre del programa: MOVIL-INTERFAZ · interfaz.js
 * Función: Componentes de interfaz: insignias, tarjeta, buscador, filtros, portada, ubicación,
 *          alertas y estados de carga.
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
 *     Componente      Objetivo
 *     Insignia        Etiqueta de color para estados
 *     InsigniaCopia   Insignia del estado de una copia
 *     Tarjeta         Contenedor con borde y sombra; se puede tocar si recibe…
 *     Buscador        Campo de búsqueda que busca al presionar Buscar en el…
 *     Filtros         Botones de filtro «Buscar por» con una opción activa
 *     Portada         Portada generada a partir del tema del libro
 *     Ubicacion       Ubicación de la copia con ícono de mapa
 *     Alerta          Mensaje de éxito, advertencia, información o error
 *     Cargando        Indicador de carga con texto
 *     ErrorCarga      Mensaje de error de carga con botón para reintentar
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

import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Atom, BookOpen, Code2, MapPin, Network, Search, Sigma } from 'lucide-react-native';
import { ESTADOS_COPIA, ColorPortada, TemaPrincipal } from '../../modelos/dominio';
import { COLORES, ESPACIO, RADIO, SOMBRA, TIPOGRAFIA, TONOS } from '../tema';

/*
 * Componente: Insignia
 * Objetivo: Etiqueta de color para estados.
 * Uso: <Insignia tono={…} estilo={…}>…</Insignia>
 */
export function Insignia({ tono = 'neutro', children, estilo })
{
  const colores_tono = TONOS[tono] ?? TONOS.neutro;
  return (
    <View style={[estilos.insignia, { backgroundColor: colores_tono.fondo }, estilo]}>
      <View style={[estilos.punto, { backgroundColor: colores_tono.texto }]} />
      <Text style={[estilos.insignia_texto, { color: colores_tono.texto }]}>{children}</Text>
    </View>
  );
}

/*
 * Componente: InsigniaCopia
 * Objetivo: Insignia del estado de una copia.
 * Uso: <InsigniaCopia estatus={…} />
 */
export function InsigniaCopia({ estatus })
{
  const estado = ESTADOS_COPIA[estatus] ?? ESTADOS_COPIA.Disponible;
  return <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>;
}

/*
 * Componente: Tarjeta
 * Objetivo: Contenedor con borde y sombra; se puede tocar si recibe onPress.
 * Uso: <Tarjeta estilo={…} onPress={…} etiqueta_accesible={…}>…</Tarjeta>
 */
export function Tarjeta({ children, estilo, onPress, etiqueta_accesible })
{
  if (onPress)
  {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiqueta_accesible}
        style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }, estilo]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[estilos.tarjeta, estilo]}>{children}</View>;
}

/*
 * Componente: Buscador
 * Objetivo: Campo de búsqueda que busca al presionar Buscar en el teclado.
 * Uso: <Buscador valor={…} al_cambio={…} al_buscar={…} placeholder={…} />
 */
export function Buscador({
  valor,
  al_cambio,
  al_buscar,
  placeholder = 'Busca por título, autor o tema…',
})
{
  return (
    <View style={estilos.buscador}>
      <Search size={19} color={COLORES.informacion} />
      <TextInput
        value={valor}
        onChangeText={al_cambio}
        onSubmitEditing={al_buscar}
        placeholder={placeholder}
        placeholderTextColor={COLORES.texto_suave}
        returnKeyType="search"
        autoCorrect={false}
        style={estilos.buscador_input}
        accessibilityLabel="Buscar libros"
      />
    </View>
  );
}

/*
 * Componente: Filtros
 * Objetivo: Botones de filtro «Buscar por» con una opción activa.
 * Uso: <Filtros opciones={…} valor={…} al_cambio={…} />
 */
export function Filtros({ opciones, valor, al_cambio })
{
  return (
    <View style={estilos.filtros} accessibilityRole="radiogroup">
      {opciones.map((opcion) =>
      {
        const activo = opcion.valor === valor;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => al_cambio(opcion.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: activo }}
            style={[estilos.filtro, activo && estilos.filtro_activo]}
          >
            <Text style={[estilos.filtro_texto, activo && { color: COLORES.blanco }]}>
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ICONO_TEMA = { Computación: Code2, Redes: Network, Matemáticas: Sigma, Física: Atom };

/*
 * Componente: Portada
 * Objetivo: Portada generada a partir del tema del libro.
 * Uso: <Portada libro={…} ancho={…} alto={…} />
 */
export function Portada({ libro, ancho = 52, alto = 74 })
{
  const tema = TemaPrincipal(libro);
  const Icono = ICONO_TEMA[tema] ?? BookOpen;
  return (
    <View
      style={[
        estilos.portada,
        { width: ancho, height: alto, backgroundColor: ColorPortada(libro) },
      ]}
    >
      <View style={estilos.portada_brillo} />
      <Icono size={Math.round(ancho * 0.42)} color={COLORES.blanco} strokeWidth={1.6} />
      {ancho >= 90 && (
        <View style={estilos.portada_pie}>
          <View style={estilos.portada_linea} />
          <Text style={estilos.portada_tema} numberOfLines={1}>
            {tema.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

/*
 * Componente: Ubicacion
 * Objetivo: Ubicación de la copia con ícono de mapa.
 * Uso: <Ubicacion texto={…} />
 */
export function Ubicacion({ texto })
{
  if (!texto)
  {
    return null;
  }
  return (
    <View style={estilos.ubicacion}>
      <MapPin size={14} color={COLORES.texto_secundario} style={{ marginTop: 2 }} />
      <Text style={[TIPOGRAFIA.secundario, { flex: 1 }]}>{texto}</Text>
    </View>
  );
}

/*
 * Componente: Alerta
 * Objetivo: Mensaje de éxito, advertencia, información o error.
 * Uso: <Alerta tipo={…} titulo={…} texto={…} oscuro={…} />
 */
export function Alerta({ tipo = 'informacion', titulo, texto, oscuro })
{
  const texto_actual = TONOS[tipo] ?? TONOS.informacion;
  return (
    <View
      style={[estilos.alerta, { backgroundColor: texto_actual.fondo }]}
      accessibilityRole="alert"
    >
      <View
        style={[
          estilos.punto,
          { backgroundColor: texto_actual.texto, marginTop: 7, width: 8, height: 8 },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: texto_actual.texto, fontWeight: '700', fontSize: 15 }}>{titulo}</Text>
        {texto ? (
          <Text
            style={{
              color: oscuro ? COLORES.texto_secundario : COLORES.texto_secundario,
              marginTop: 2,
              fontSize: 14.5,
            }}
          >
            {texto}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/*
 * Componente: Cargando
 * Objetivo: Indicador de carga con texto.
 * Uso: <Cargando texto={…} />
 */
export function Cargando({ texto = 'Cargando…' })
{
  return (
    <View style={estilos.cargando}>
      <ActivityIndicator size="small" color={COLORES.azul_principal} />
      <Text style={TIPOGRAFIA.nota}>{texto}</Text>
    </View>
  );
}

/*
 * Componente: ErrorCarga
 * Objetivo: Mensaje de error de carga con botón para reintentar.
 * Uso: <ErrorCarga error={…} al_reintentar={…} />
 */
export function ErrorCarga({ error, al_reintentar })
{
  if (!error)
  {
    return null;
  }
  return (
    <View style={{ gap: ESPACIO.m }}>
      <Alerta tipo="error" titulo={error.message} />
      {al_reintentar && (
        <Pressable
          onPress={al_reintentar}
          accessibilityRole="button"
          style={estilos.boton_secundario}
        >
          <Text style={{ color: COLORES.azul_principal, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIO.pastilla,
  },
  punto: { width: 7, height: 7, borderRadius: 4 },
  insignia_texto: { fontSize: 13, fontWeight: '700' },
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: RADIO.tarjeta,
    borderWidth: 1,
    borderColor: COLORES.linea,
    padding: ESPACIO.l,
    ...SOMBRA,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.m,
    backgroundColor: COLORES.blanco,
    borderWidth: 1.5,
    borderColor: '#c4cedb',
    borderRadius: RADIO.control,
    paddingHorizontal: ESPACIO.l,
    height: 50,
  },
  buscador_input: { flex: 1, fontSize: 15.5, color: COLORES.texto_principal, height: '100%' },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.s },
  filtro: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIO.pastilla,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.blanco,
  },
  filtro_activo: { backgroundColor: COLORES.azul_principal, borderColor: COLORES.azul_principal },
  filtro_texto: { fontSize: 13.5, fontWeight: '700', color: COLORES.texto_secundario },
  portada: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  portada_brillo: {
    position: 'absolute',
    left: '-30%',
    right: '-30%',
    top: '45%',
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.09)',
    transform: [{ rotate: '-22deg' }],
  },
  portada_pie: { position: 'absolute', left: '8%', right: '8%', bottom: '7%' },
  portada_linea: {
    width: 28,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  portada_tema: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  ubicacion: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  alerta: { flexDirection: 'row', gap: ESPACIO.m, padding: ESPACIO.l, borderRadius: RADIO.tarjeta },
  cargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.s,
    paddingVertical: ESPACIO.s,
  },
  boton_secundario: {
    alignSelf: 'flex-start',
    paddingHorizontal: ESPACIO.l,
    paddingVertical: 10,
    borderRadius: RADIO.control,
    borderWidth: 1.5,
    borderColor: COLORES.azul_principal,
  },
});
