import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SesionProvider } from './controllers/SesionController';
import { AppNavigator } from './routes/AppNavigator';

/** Biblio · Universidad Ducky — app móvil (React Native + Expo, MVC). */
export default function App() {
  return (
    <SafeAreaProvider>
      <SesionProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SesionProvider>
    </SafeAreaProvider>
  );
}
