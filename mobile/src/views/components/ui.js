import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import {
  Atom, BookOpen, Code2, MapPin, Network, Search, Sigma,
} from 'lucide-react-native';
import { ESTADOS_COPIA, colorPortada, temaPrincipal } from '../../models/dominio';
import {
  colores, espacio, radio, sombra, tipografia, tonos,
} from '../tema';

export function Insignia({ tono = 'neutro', children, estilo }) {
  const t = tonos[tono] ?? tonos.neutro;
  return (
    <View style={[estilos.insignia, { backgroundColor: t.fondo }, estilo]}>
      <View style={[estilos.punto, { backgroundColor: t.texto }]} />
      <Text style={[estilos.insigniaTexto, { color: t.texto }]}>{children}</Text>
    </View>
  );
}

export function InsigniaCopia({ estatus }) {
  const e = ESTADOS_COPIA[estatus] ?? ESTADOS_COPIA.Disponible;
  return <Insignia tono={e.tono}>{e.etiqueta}</Insignia>;
}

export function Tarjeta({ children, estilo, onPress, etiquetaAccesible }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiquetaAccesible}
        style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }, estilo]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[estilos.tarjeta, estilo]}>{children}</View>;
}

export function Buscador({ valor, onCambio, onBuscar, placeholder = 'Busca por título, autor o tema…' }) {
  return (
    <View style={estilos.buscador}>
      <Search size={19} color={colores.informacion} />
      <TextInput
        value={valor}
        onChangeText={onCambio}
        onSubmitEditing={onBuscar}
        placeholder={placeholder}
        placeholderTextColor={colores.textoSuave}
        returnKeyType="search"
        autoCorrect={false}
        style={estilos.buscadorInput}
        accessibilityLabel="Buscar libros"
      />
    </View>
  );
}

export function Chips({ opciones, valor, onCambio }) {
  return (
    <View style={estilos.chips} accessibilityRole="radiogroup">
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onCambio(o.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: activo }}
            style={[estilos.chip, activo && estilos.chipActivo]}
          >
            <Text style={[estilos.chipTexto, activo && { color: colores.blanco }]}>{o.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ICONO_TEMA = { Computación: Code2, Redes: Network, Matemáticas: Sigma, Física: Atom };

/** Portada generada a partir del tema del libro. */
export function Portada({ libro, ancho = 52, alto = 74 }) {
  const tema = temaPrincipal(libro);
  const Icono = ICONO_TEMA[tema] ?? BookOpen;
  return (
    <View style={[estilos.portada, { width: ancho, height: alto, backgroundColor: colorPortada(libro) }]}>
      <View style={estilos.portadaBrillo} />
      <Icono size={Math.round(ancho * 0.42)} color={colores.blanco} strokeWidth={1.6} />
      {ancho >= 90 && (
        <View style={estilos.portadaPie}>
          <View style={estilos.portadaLinea} />
          <Text style={estilos.portadaTema} numberOfLines={1}>{tema.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

export function Ubicacion({ texto }) {
  if (!texto) return null;
  return (
    <View style={estilos.ubicacion}>
      <MapPin size={14} color={colores.textoSecundario} style={{ marginTop: 2 }} />
      <Text style={[tipografia.secundario, { flex: 1 }]}>{texto}</Text>
    </View>
  );
}

export function Alerta({ tipo = 'informacion', titulo, texto, oscuro }) {
  const t = tonos[tipo] ?? tonos.informacion;
  return (
    <View style={[estilos.alerta, { backgroundColor: t.fondo }]} accessibilityRole="alert">
      <View style={[estilos.punto, { backgroundColor: t.texto, marginTop: 7, width: 8, height: 8 }]} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.texto, fontWeight: '700', fontSize: 15 }}>{titulo}</Text>
        {texto ? <Text style={{ color: oscuro ? colores.textoSecundario : colores.textoSecundario, marginTop: 2, fontSize: 14.5 }}>{texto}</Text> : null}
      </View>
    </View>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <View style={estilos.cargando}>
      <ActivityIndicator size="small" color={colores.azulPrincipal} />
      <Text style={tipografia.caption}>{texto}</Text>
    </View>
  );
}

export function ErrorCarga({ error, onReintentar }) {
  if (!error) return null;
  return (
    <View style={{ gap: espacio.m }}>
      <Alerta tipo="error" titulo={error.message} />
      {onReintentar && (
        <Pressable onPress={onReintentar} accessibilityRole="button" style={estilos.botonSecundario}>
          <Text style={{ color: colores.azulPrincipal, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  insignia: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radio.pastilla,
  },
  punto: { width: 7, height: 7, borderRadius: 4 },
  insigniaTexto: { fontSize: 13, fontWeight: '700' },
  tarjeta: {
    backgroundColor: colores.blanco, borderRadius: radio.tarjeta, borderWidth: 1,
    borderColor: colores.linea, padding: espacio.l, ...sombra,
  },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: espacio.m, backgroundColor: colores.blanco,
    borderWidth: 1.5, borderColor: '#c4cedb', borderRadius: radio.control, paddingHorizontal: espacio.l, height: 50,
  },
  buscadorInput: { flex: 1, fontSize: 15.5, color: colores.textoPrincipal, height: '100%' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radio.pastilla,
    borderWidth: 1, borderColor: colores.linea, backgroundColor: colores.blanco,
  },
  chipActivo: { backgroundColor: colores.azulPrincipal, borderColor: colores.azulPrincipal },
  chipTexto: { fontSize: 13.5, fontWeight: '700', color: colores.textoSecundario },
  portada: {
    borderRadius: 4, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  portadaBrillo: {
    position: 'absolute', left: '-30%', right: '-30%', top: '45%', height: '80%',
    backgroundColor: 'rgba(255,255,255,0.09)', transform: [{ rotate: '-22deg' }],
  },
  portadaPie: { position: 'absolute', left: '8%', right: '8%', bottom: '7%' },
  portadaLinea: { width: 28, height: 1.5, backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  portadaTema: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  ubicacion: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  alerta: { flexDirection: 'row', gap: espacio.m, padding: espacio.l, borderRadius: radio.tarjeta },
  cargando: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, paddingVertical: espacio.s },
  botonSecundario: {
    alignSelf: 'flex-start', paddingHorizontal: espacio.l, paddingVertical: 10,
    borderRadius: radio.control, borderWidth: 1.5, borderColor: colores.azulPrincipal,
  },
});
