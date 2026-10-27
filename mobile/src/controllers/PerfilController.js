import { Alert, Platform } from 'react-native';
import { etiquetaIdentificador, iniciales } from '../models/dominio';
import { useSesion } from './SesionController';

/** Perfil: datos del usuario y cierre de sesión. */
export function usePerfilController() {
  const { usuario, cerrarSesion } = useSesion();

  function confirmarCierre() {
    if (Platform.OS === 'web') {
      cerrarSesion();
      return;
    }
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: cerrarSesion },
    ]);
  }

  return {
    nombre: usuario?.Nombre_Completo ?? '',
    rol: usuario?.Nombre_Rol ?? '',
    iniciales: iniciales(usuario?.Nombre_Completo),
    datos: [
      { icono: 'id', etiqueta: etiquetaIdentificador(usuario), valor: usuario?.Matricula_Nomina },
      { icono: 'correo', etiqueta: 'Correo institucional', valor: usuario?.Correo || 'Sin correo registrado' },
    ],
    cerrarSesion: confirmarCierre,
  };
}
