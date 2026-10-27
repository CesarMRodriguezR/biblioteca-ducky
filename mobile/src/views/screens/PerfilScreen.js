import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IdCard, LogOut, Mail } from 'lucide-react-native';
import { usePerfilController } from '../../controllers/PerfilController';
import { Tarjeta } from '../components/ui';
import {
  colores, espacio, radio, tipografia,
} from '../tema';

const ICONOS = { id: IdCard, correo: Mail };

/** Perfil del usuario con cierre de sesión. */
export function PerfilScreen() {
  const c = usePerfilController();

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={estilos.contenido}>
      <View style={estilos.encabezado}>
        <View style={estilos.avatar}><Text style={estilos.avatarTexto}>{c.iniciales}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={tipografia.subtitulo}>{c.nombre}</Text>
          <Text style={tipografia.caption}>{c.rol}</Text>
        </View>
      </View>

      <Tarjeta estilo={{ gap: espacio.l }}>
        {c.datos.map((d) => {
          const Icono = ICONOS[d.icono];
          return (
            <View key={d.etiqueta} style={estilos.dato}>
              <Icono size={20} color={colores.textoSecundario} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={tipografia.etiqueta}>{d.etiqueta}</Text>
                <Text style={tipografia.cuerpo}>{d.valor}</Text>
              </View>
            </View>
          );
        })}
      </Tarjeta>

      <View style={{ flex: 1 }} />
      <Pressable
        onPress={c.cerrarSesion}
        accessibilityRole="button"
        style={({ pressed }) => [estilos.cerrar, pressed && { backgroundColor: colores.errorFondo }]}
      >
        <LogOut size={18} color={colores.error} />
        <Text style={{ color: colores.error, fontWeight: '700', fontSize: 15 }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { flexGrow: 1, padding: espacio.xl, paddingTop: espacio.s, gap: espacio.xl },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.l },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colores.azulPrincipal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTexto: { color: colores.blanco, fontSize: 22, fontWeight: '700' },
  dato: { flexDirection: 'row', gap: espacio.m },
  cerrar: {
    flexDirection: 'row', gap: espacio.s, alignItems: 'center', justifyContent: 'center', height: 48,
    borderRadius: radio.control, borderWidth: 1, borderColor: '#f3b8b2', backgroundColor: colores.blanco,
    marginBottom: espacio.xl,
  },
});
