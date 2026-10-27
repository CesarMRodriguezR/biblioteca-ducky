/*
 * ******************************************************************
 * Nombre del programa: MOVIL-TEMA · tema.js
 * Función: Colores, tonos, espacios, radios, tipografía y sombras del sistema de diseño.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Ninguna
 * Salida: Constantes de estilo
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
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

/** Tokens del "design system telefono" del prototipo. */
export const COLORES = {
  azul_principal: '#10306b',
  azul_campo: '#223c72',
  azul_brillante: '#1a8fd6',
  dorado: '#c99a2e',
  dorado_claro: '#e6c46a',
  texto_principal: '#1c2533',
  texto_secundario: '#4a5668',
  texto_suave: '#6b7686',
  linea: '#dce3ec',
  fondo: '#f6f8fb',
  blanco: '#ffffff',
  exito: '#1f7a4d',
  exito_fondo: '#e6f4ec',
  advertencia: '#9a5b00',
  advertencia_fondo: '#fdf1de',
  informacion: '#0a6bad',
  informacion_fondo: '#e3f2fb',
  error: '#b42318',
  error_fondo: '#fdecea',
  morado: '#6b3fd4',
  morado_fondo: '#efe9fc',
  neutro: '#4a5668',
  neutro_fondo: '#eef1f5',
};

export const TONOS = {
  exito: { texto: COLORES.exito, fondo: COLORES.exito_fondo },
  advertencia: { texto: COLORES.advertencia, fondo: COLORES.advertencia_fondo },
  informacion: { texto: COLORES.informacion, fondo: COLORES.informacion_fondo },
  error: { texto: COLORES.error, fondo: COLORES.error_fondo },
  morado: { texto: COLORES.morado, fondo: COLORES.morado_fondo },
  neutro: { texto: COLORES.neutro, fondo: COLORES.neutro_fondo },
};

export const ESPACIO = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const RADIO = { control: 10, tarjeta: 14, pastilla: 999 };

export const TIPOGRAFIA = {
  titulo: { fontSize: 26, fontWeight: '700', color: COLORES.texto_principal },
  subtitulo: { fontSize: 20, fontWeight: '600', color: COLORES.texto_principal },
  titulo_tarjeta: { fontSize: 16, fontWeight: '600', color: COLORES.texto_principal },
  cuerpo: { fontSize: 15, color: COLORES.texto_principal },
  secundario: { fontSize: 13.5, color: COLORES.texto_secundario },
  nota: { fontSize: 12.5, color: COLORES.texto_suave },
  etiqueta: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORES.texto_suave,
    textTransform: 'uppercase',
  },
};

export const SOMBRA = {
  shadow_color: '#10306b',
  shadow_opacity: 0.06,
  shadow_radius: 8,
  shadow_offset: { width: 0, height: 2 },
  elevation: 2,
};
