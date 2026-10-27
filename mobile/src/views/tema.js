/** Tokens del "design system telefono" del prototipo. */
export const colores = {
  azulPrincipal: '#10306b',
  azulCampo: '#223c72',
  azulBrillante: '#1a8fd6',
  dorado: '#c99a2e',
  doradoClaro: '#e6c46a',
  textoPrincipal: '#1c2533',
  textoSecundario: '#4a5668',
  textoSuave: '#6b7686',
  linea: '#dce3ec',
  fondo: '#f6f8fb',
  blanco: '#ffffff',
  exito: '#1f7a4d',
  exitoFondo: '#e6f4ec',
  advertencia: '#9a5b00',
  advertenciaFondo: '#fdf1de',
  informacion: '#0a6bad',
  informacionFondo: '#e3f2fb',
  error: '#b42318',
  errorFondo: '#fdecea',
  morado: '#6b3fd4',
  moradoFondo: '#efe9fc',
  neutro: '#4a5668',
  neutroFondo: '#eef1f5',
};

export const tonos = {
  exito: { texto: colores.exito, fondo: colores.exitoFondo },
  advertencia: { texto: colores.advertencia, fondo: colores.advertenciaFondo },
  informacion: { texto: colores.informacion, fondo: colores.informacionFondo },
  error: { texto: colores.error, fondo: colores.errorFondo },
  morado: { texto: colores.morado, fondo: colores.moradoFondo },
  neutro: { texto: colores.neutro, fondo: colores.neutroFondo },
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const radio = { control: 10, tarjeta: 14, pastilla: 999 };

export const tipografia = {
  titulo: { fontSize: 26, fontWeight: '700', color: colores.textoPrincipal },
  subtitulo: { fontSize: 20, fontWeight: '600', color: colores.textoPrincipal },
  tituloTarjeta: { fontSize: 16, fontWeight: '600', color: colores.textoPrincipal },
  cuerpo: { fontSize: 15, color: colores.textoPrincipal },
  secundario: { fontSize: 13.5, color: colores.textoSecundario },
  caption: { fontSize: 12.5, color: colores.textoSuave },
  etiqueta: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, color: colores.textoSuave, textTransform: 'uppercase' },
};

export const sombra = {
  shadowColor: '#10306b',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
