/*
 * ******************************************************************
 * Nombre del programa: BD-SP01-GU01 · PantallaInicioSesion.js
 * Función: Pantalla de inicio de sesión de la aplicación móvil.
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
 *     Componente             Objetivo
 *     CampoOscuro            Campo de texto sobre fondo azul con etiqueta y error
 *     PantallaInicioSesion   BD-SP01-GU01 Iniciar sesión (versión móvil)
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

import { useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useControladorInicioSesion } from '../../controladores/ControladorInicioSesion';
import { Alerta } from '../componentes/interfaz';
import { COLORES, ESPACIO, RADIO } from '../tema';

/*
 * Componente: CampoOscuro
 * Objetivo: Campo de texto sobre fondo azul con etiqueta y error.
 * Uso: <CampoOscuro etiqueta={…} error={…} ref_input={…} />
 */
function CampoOscuro({ etiqueta, error, ref_input, ...propiedades })
{
  return (
    <View style={{ gap: 6 }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        ref={ref_input}
        style={[estilos.input, error && estilos.input_error]}
        placeholderTextColor="rgba(255,255,255,0.45)"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={etiqueta}
        {...propiedades}
      />
      {error?.trim() ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

/*
 * Componente: PantallaInicioSesion
 * Objetivo: BD-SP01-GU01 Iniciar sesión (versión móvil).
 * Uso: <PantallaInicioSesion />
 */
export function PantallaInicioSesion()
{
  const controlador = useControladorInicioSesion();
  const contrasena_ref = useRef(null);

  return (
    <SafeAreaView style={estilos.fondo}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.marca}>
            <Image
              source={require('../../../assets/logo-ducky.png')}
              style={estilos.logo}
              accessibilityLabel="Escudo Universidad Ducky"
            />
            <Text style={estilos.titulo}>Biblio</Text>
            <View style={estilos.separador}>
              <View style={estilos.linea} />
              <View style={estilos.rombo} />
              <View style={estilos.linea} />
            </View>
            <Text style={estilos.universidad}>UNIVERSIDAD DUCKY</Text>
          </View>

          <View style={{ gap: ESPACIO.l }}>
            {controlador.aviso && (
              <Alerta
                tipo={controlador.aviso.tipo}
                titulo={controlador.aviso.titulo}
                texto={controlador.aviso.texto}
              />
            )}
            <CampoOscuro
              etiqueta="Usuario"
              value={controlador.form.usuario}
              onChangeText={controlador.Cambiar('usuario')}
              error={controlador.errores.usuario}
              returnKeyType="next"
              onSubmitEditing={() => contrasena_ref.current?.focus()}
              textContentType="username"
            />
            <CampoOscuro
              etiqueta="Contraseña"
              ref_input={contrasena_ref}
              value={controlador.form.contrasena}
              onChangeText={controlador.Cambiar('contrasena')}
              error={controlador.errores.contrasena}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={controlador.Enviar}
              textContentType="password"
            />
            <Pressable
              onPress={controlador.Enviar}
              disabled={controlador.enviando}
              accessibilityRole="button"
              style={({ pressed }) => [
                estilos.boton,
                (pressed || controlador.enviando) && { opacity: 0.85 },
              ]}
            >
              {controlador.enviando ? (
                <ActivityIndicator color={COLORES.azul_principal} />
              ) : (
                <Text style={estilos.boton_texto}>Entrar</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Recuperar contraseña',
                  'Acude al mostrador de la biblioteca o escribe a biblioteca@ducky.edu.mx para restablecerla.',
                )
              }
              accessibilityRole="link"
            >
              <Text style={estilos.olvido}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>

          <View style={estilos.pie}>
            <Text style={estilos.pie_texto}>Desarrollado por</Text>
            <Text style={estilos.pie_marca}>CCJMops</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.azul_principal },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: ESPACIO.xxl,
    gap: 28,
  },
  marca: { alignItems: 'center', gap: 6 },
  logo: { width: 64, height: 64, resizeMode: 'contain', marginBottom: 6 },
  titulo: { color: COLORES.blanco, fontSize: 26, fontWeight: '700' },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linea: { width: 34, height: 1, backgroundColor: COLORES.dorado },
  rombo: { width: 7, height: 7, backgroundColor: COLORES.dorado, transform: [{ rotate: '45deg' }] },
  universidad: { color: COLORES.dorado_claro, letterSpacing: 2, fontSize: 13, fontWeight: '600' },
  etiqueta: { color: COLORES.blanco, fontWeight: '700', fontSize: 14 },
  input: {
    height: 46,
    borderRadius: RADIO.control,
    backgroundColor: COLORES.azul_campo,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    color: COLORES.blanco,
    paddingHorizontal: 14,
    fontSize: 15.5,
  },
  input_error: { borderColor: '#f28b82' },
  error: { color: '#ffb4ab', fontSize: 13 },
  boton: {
    height: 46,
    borderRadius: RADIO.control,
    backgroundColor: COLORES.dorado_claro,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  boton_texto: { color: COLORES.azul_principal, fontWeight: '700', fontSize: 16 },
  olvido: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: '600', marginTop: 4 },
  pie: { alignItems: 'center', gap: 2 },
  pie_texto: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  pie_marca: { color: COLORES.blanco, fontSize: 22, fontWeight: '800' },
});
