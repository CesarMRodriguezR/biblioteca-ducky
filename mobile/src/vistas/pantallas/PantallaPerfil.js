/*
 * ******************************************************************
 * Nombre del programa: MOVIL-PERFIL · PantallaPerfil.js
 * Función: Datos del usuario y botón para cerrar sesión.
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
 *     PantallaPerfil   Perfil del usuario con cierre de sesión
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

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IdCard, LogOut, Mail } from 'lucide-react-native';
import { useControladorPerfil } from '../../controladores/ControladorPerfil';
import { Tarjeta } from '../componentes/interfaz';
import { COLORES, ESPACIO, RADIO, TIPOGRAFIA } from '../tema';

const ICONOS = { id: IdCard, correo: Mail };

/*
 * Componente: PantallaPerfil
 * Objetivo: Perfil del usuario con cierre de sesión.
 * Uso: <PantallaPerfil />
 */
export function PantallaPerfil()
{
  const controlador = useControladorPerfil();

  return (
    <ScrollView
      style={{ backgroundColor: COLORES.fondo }}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.encabezado}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatar_texto}>{controlador.iniciales}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={TIPOGRAFIA.subtitulo}>{controlador.nombre}</Text>
          <Text style={TIPOGRAFIA.nota}>{controlador.rol}</Text>
        </View>
      </View>

      <Tarjeta estilo={{ gap: ESPACIO.l }}>
        {controlador.datos.map((dato) =>
        {
          const Icono = ICONOS[dato.icono];
          return (
            <View key={dato.etiqueta} style={estilos.dato}>
              <Icono size={20} color={COLORES.texto_secundario} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={TIPOGRAFIA.etiqueta}>{dato.etiqueta}</Text>
                <Text style={TIPOGRAFIA.cuerpo}>{dato.valor}</Text>
              </View>
            </View>
          );
        })}
      </Tarjeta>

      <View style={{ flex: 1 }} />
      <Pressable
        onPress={controlador.CerrarSesion}
        accessibilityRole="button"
        style={({ pressed }) => [
          estilos.cerrar,
          pressed && { backgroundColor: COLORES.error_fondo },
        ]}
      >
        <LogOut size={18} color={COLORES.error} />
        <Text style={{ color: COLORES.error, fontWeight: '700', fontSize: 15 }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { flexGrow: 1, padding: ESPACIO.xl, paddingTop: ESPACIO.s, gap: ESPACIO.xl },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.l },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORES.azul_principal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar_texto: { color: COLORES.blanco, fontSize: 22, fontWeight: '700' },
  dato: { flexDirection: 'row', gap: ESPACIO.m },
  cerrar: {
    flexDirection: 'row',
    gap: ESPACIO.s,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIO.control,
    borderWidth: 1,
    borderColor: '#f3b8b2',
    backgroundColor: COLORES.blanco,
    marginBottom: ESPACIO.xl,
  },
});
