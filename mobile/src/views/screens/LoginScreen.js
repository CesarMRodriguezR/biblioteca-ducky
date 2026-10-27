import { useRef } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoginController } from '../../controllers/LoginController';
import { Alerta } from '../components/ui';
import { colores, espacio, radio } from '../tema';

function CampoOscuro({ etiqueta, error, refInput, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        ref={refInput}
        style={[estilos.input, error && estilos.inputError]}
        placeholderTextColor="rgba(255,255,255,0.45)"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={etiqueta}
        {...props}
      />
      {error?.trim() ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

/** BD-SP01-GU01 Iniciar sesión (versión móvil). */
export function LoginScreen() {
  const c = useLoginController();
  const contrasenaRef = useRef(null);

  return (
    <SafeAreaView style={estilos.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.marca}>
            <Image source={require('../../../assets/logo-ducky.png')} style={estilos.logo} accessibilityLabel="Escudo Universidad Ducky" />
            <Text style={estilos.titulo}>Biblio</Text>
            <View style={estilos.separador}>
              <View style={estilos.linea} />
              <View style={estilos.rombo} />
              <View style={estilos.linea} />
            </View>
            <Text style={estilos.universidad}>UNIVERSIDAD DUCKY</Text>
          </View>

          <View style={{ gap: espacio.l }}>
            {c.aviso && <Alerta tipo={c.aviso.tipo} titulo={c.aviso.titulo} texto={c.aviso.texto} />}
            <CampoOscuro
              etiqueta="Usuario"
              value={c.form.usuario}
              onChangeText={c.cambiar('usuario')}
              error={c.errores.usuario}
              returnKeyType="next"
              onSubmitEditing={() => contrasenaRef.current?.focus()}
              textContentType="username"
            />
            <CampoOscuro
              etiqueta="Contraseña"
              refInput={contrasenaRef}
              value={c.form.contrasena}
              onChangeText={c.cambiar('contrasena')}
              error={c.errores.contrasena}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={c.enviar}
              textContentType="password"
            />
            <Pressable
              onPress={c.enviar}
              disabled={c.enviando}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.boton, (pressed || c.enviando) && { opacity: 0.85 }]}
            >
              {c.enviando
                ? <ActivityIndicator color={colores.azulPrincipal} />
                : <Text style={estilos.botonTexto}>Entrar</Text>}
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Recuperar contraseña', 'Acude al mostrador de la biblioteca o escribe a biblioteca@ducky.edu.mx para restablecerla.')}
              accessibilityRole="link"
            >
              <Text style={estilos.olvido}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>

          <View style={estilos.pie}>
            <Text style={estilos.pieTexto}>Desarrollado por</Text>
            <Text style={estilos.pieMarca}>CCJMops</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.azulPrincipal },
  contenido: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 36, paddingVertical: espacio.xxl, gap: 28 },
  marca: { alignItems: 'center', gap: 6 },
  logo: { width: 64, height: 64, resizeMode: 'contain', marginBottom: 6 },
  titulo: { color: colores.blanco, fontSize: 26, fontWeight: '700' },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linea: { width: 34, height: 1, backgroundColor: colores.dorado },
  rombo: { width: 7, height: 7, backgroundColor: colores.dorado, transform: [{ rotate: '45deg' }] },
  universidad: { color: colores.doradoClaro, letterSpacing: 2, fontSize: 13, fontWeight: '600' },
  etiqueta: { color: colores.blanco, fontWeight: '700', fontSize: 14 },
  input: {
    height: 46, borderRadius: radio.control, backgroundColor: colores.azulCampo, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)', color: colores.blanco, paddingHorizontal: 14, fontSize: 15.5,
  },
  inputError: { borderColor: '#f28b82' },
  error: { color: '#ffb4ab', fontSize: 13 },
  boton: {
    height: 46, borderRadius: radio.control, backgroundColor: colores.doradoClaro,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  botonTexto: { color: colores.azulPrincipal, fontWeight: '700', fontSize: 16 },
  olvido: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: '600', marginTop: 4 },
  pie: { alignItems: 'center', gap: 2 },
  pieTexto: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  pieMarca: { color: colores.blanco, fontSize: 22, fontWeight: '800' },
});
