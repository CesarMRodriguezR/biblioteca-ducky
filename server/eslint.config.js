/*
 * ******************************************************************
 * Nombre del programa: API-LINT · eslint.config.js
 * Función: Revisar que el código del servidor cumpla el estándar de
 *          codificación (llaves, sangría, comillas, punto y coma).
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Archivos .js de src/ y pruebas/
 * Salida: Errores de estilo en la terminal (npm run lint)
 * ******************************************************************
 */
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/brace-style': ['error', 'allman', { allowSingleLine: false }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/max-len': ['error', { code: 100, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreUrls: true }],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': ['error', 'always'],
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none' }],
      'no-labels': 'error',
    },
  },
];
