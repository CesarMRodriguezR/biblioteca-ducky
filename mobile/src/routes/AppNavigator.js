import { ActivityIndicator, Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Search, User } from 'lucide-react-native';
import { useSesion } from '../controllers/SesionController';
import { LoginScreen } from '../views/screens/LoginScreen';
import { InicioScreen } from '../views/screens/InicioScreen';
import { BuscarScreen } from '../views/screens/BuscarScreen';
import { DetalleScreen } from '../views/screens/DetalleScreen';
import { PerfilScreen } from '../views/screens/PerfilScreen';
import { colores } from '../views/tema';

const Raiz = createNativeStackNavigator();
const PilaBuscar = createNativeStackNavigator();
const PilaPerfil = createNativeStackNavigator();
const Pestanas = createBottomTabNavigator();

const temaNavegacion = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colores.fondo, primary: colores.azulPrincipal, text: colores.textoPrincipal },
};

const encabezado = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colores.fondo },
  headerTitleStyle: { fontSize: 24, fontWeight: '700', color: colores.textoPrincipal },
  headerTintColor: colores.azulPrincipal,
  headerBackButtonDisplayMode: 'minimal',
  headerTitleAlign: 'left',
};

/** Pestaña Buscar: Inicio → Resultados → Detalle. */
function BuscarStack() {
  return (
    <PilaBuscar.Navigator screenOptions={encabezado}>
      <PilaBuscar.Screen name="Inicio" component={InicioScreen} options={{ title: 'Biblio' }} />
      <PilaBuscar.Screen name="Resultados" component={BuscarScreen} options={{ title: 'Buscar' }} />
      <PilaBuscar.Screen name="Detalle" component={DetalleScreen} options={{ title: 'Detalle' }} />
    </PilaBuscar.Navigator>
  );
}

function PerfilStack() {
  return (
    <PilaPerfil.Navigator screenOptions={encabezado}>
      <PilaPerfil.Screen name="PerfilInicio" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </PilaPerfil.Navigator>
  );
}

function PestanasPrincipales() {
  return (
    <Pestanas.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.azulPrincipal,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          borderTopColor: colores.linea,
          backgroundColor: colores.blanco,
          // En web no hay área segura inferior; se da altura fija para que no se recorte la etiqueta.
          ...(Platform.OS === 'web' && { height: 64, paddingBottom: 8 }),
        },
      }}
    >
      <Pestanas.Screen
        name="Buscar"
        component={BuscarStack}
        options={{ tabBarIcon: ({ color }) => <Search size={22} color={color} /> }}
      />
      <Pestanas.Screen
        name="Perfil"
        component={PerfilStack}
        options={{ tabBarIcon: ({ color }) => <User size={22} color={color} /> }}
      />
    </Pestanas.Navigator>
  );
}

/**
 * Rutas de la app móvil. Sin sesión solo existe Login; con sesión, las
 * pestañas Buscar y Perfil (todos los roles consultan el catálogo).
 */
export function AppNavigator() {
  const { usuario, cargando } = useSesion();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.azulPrincipal }}>
        <ActivityIndicator color={colores.blanco} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={temaNavegacion}>
      <Raiz.Navigator screenOptions={{ headerShown: false }}>
        {usuario
          ? <Raiz.Screen name="Principal" component={PestanasPrincipales} />
          : <Raiz.Screen name="Login" component={LoginScreen} />}
      </Raiz.Navigator>
    </NavigationContainer>
  );
}
