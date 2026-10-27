/*
 * ******************************************************************
 * Nombre del programa: MOVIL-RUTAS · NavegadorAplicacion.js
 * Función: Navegación de la aplicación: inicio de sesión o pestañas Inicio, Buscar y Perfil con
 *          el detalle del libro.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Sesión del usuario
 * Salida: Pantalla correspondiente
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente            Objetivo
 *     NavegacionBuscar      Pestaña Buscar: Inicio → Resultados → Detalle
 *     NavegacionPerfil      Pestaña Perfil con los datos del usuario
 *     PestanasPrincipales   Barra inferior con las pestañas Buscar y Perfil
 *     NavegadorAplicacion   Rutas de la app móvil. Sin sesión solo existe Login; con…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Sin sesión solo se muestra el inicio de sesión; con sesión, las pestañas Inicio, Buscar y
 *     Perfil.
 * ******************************************************************
 */

import { ActivityIndicator, Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Search, User } from 'lucide-react-native';
import { useSesion } from '../controladores/ControladorSesion';
import { PantallaInicioSesion } from '../vistas/pantallas/PantallaInicioSesion';
import { PantallaInicio } from '../vistas/pantallas/PantallaInicio';
import { PantallaBuscar } from '../vistas/pantallas/PantallaBuscar';
import { PantallaDetalle } from '../vistas/pantallas/PantallaDetalle';
import { PantallaPerfil } from '../vistas/pantallas/PantallaPerfil';
import { COLORES } from '../vistas/tema';

const Raiz = createNativeStackNavigator();
const PilaBuscar = createNativeStackNavigator();
const PilaPerfil = createNativeStackNavigator();
const Pestanas = createBottomTabNavigator();

const tema_navegacion = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORES.fondo,
    primary: COLORES.azul_principal,
    text: COLORES.texto_principal,
  },
};

const encabezado = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: COLORES.fondo },
  headerTitleStyle: { fontSize: 24, fontWeight: '700', color: COLORES.texto_principal },
  headerTintColor: COLORES.azul_principal,
  headerBackButtonDisplayMode: 'minimal',
  headerTitleAlign: 'left',
};

/*
 * Componente: NavegacionBuscar
 * Objetivo: Pestaña Buscar: Inicio → Resultados → Detalle.
 * Uso: <NavegacionBuscar />
 */
function NavegacionBuscar()
{
  return (
    <PilaBuscar.Navigator screenOptions={encabezado}>
      <PilaBuscar.Screen name="Inicio" component={PantallaInicio} options={{ title: 'Biblio' }} />
      <PilaBuscar.Screen
        name="Resultados"
        component={PantallaBuscar}
        options={{ title: 'Buscar' }}
      />
      <PilaBuscar.Screen
        name="Detalle"
        component={PantallaDetalle}
        options={{ title: 'Detalle' }}
      />
    </PilaBuscar.Navigator>
  );
}

/*
 * Componente: NavegacionPerfil
 * Objetivo: Pestaña Perfil con los datos del usuario.
 * Uso: <NavegacionPerfil />
 */
function NavegacionPerfil()
{
  return (
    <PilaPerfil.Navigator screenOptions={encabezado}>
      <PilaPerfil.Screen
        name="PerfilInicio"
        component={PantallaPerfil}
        options={{ title: 'Perfil' }}
      />
    </PilaPerfil.Navigator>
  );
}

/*
 * Componente: PestanasPrincipales
 * Objetivo: Barra inferior con las pestañas Buscar y Perfil.
 * Uso: <PestanasPrincipales />
 */
function PestanasPrincipales()
{
  return (
    <Pestanas.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORES.azul_principal,
        tabBarInactiveTintColor: COLORES.texto_secundario,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          borderTopColor: COLORES.linea,
          backgroundColor: COLORES.blanco,
          // En web no hay área segura inferior; la altura fija evita que se recorte la etiqueta.
          ...(Platform.OS === 'web' && { height: 64, paddingBottom: 8 }),
        },
      }}
    >
      <Pestanas.Screen
        name="Buscar"
        component={NavegacionBuscar}
        options={{ tabBarIcon: ({ color }) => <Search size={22} color={color} /> }}
      />
      <Pestanas.Screen
        name="Perfil"
        component={NavegacionPerfil}
        options={{ tabBarIcon: ({ color }) => <User size={22} color={color} /> }}
      />
    </Pestanas.Navigator>
  );
}

/*
 * Componente: NavegadorAplicacion
 * Objetivo: Rutas de la app móvil. Sin sesión solo existe Login; con sesión, las pestañas
 *           Buscar y Perfil (todos los roles consultan el catálogo).
 * Uso: <NavegadorAplicacion />
 */
export function NavegadorAplicacion()
{
  const { usuario, cargando } = useSesion();

  if (cargando)
  {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORES.azul_principal,
        }}
      >
        <ActivityIndicator color={COLORES.blanco} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={tema_navegacion}>
      <Raiz.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <Raiz.Screen name="Principal" component={PestanasPrincipales} />
        ) : (
          <Raiz.Screen name="Login" component={PantallaInicioSesion} />
        )}
      </Raiz.Navigator>
    </NavigationContainer>
  );
}
