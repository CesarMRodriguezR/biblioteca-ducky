/*
 * ******************************************************************
 * Nombre del programa: MOVIL-LINT · eslint.config.mjs
 * Función: Revisar que el código de la versión móvil cumpla el estándar
 *          de codificación (llaves, sangría, comillas, JSX y hooks).
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Archivos .js de src/ e index.js
 * Salida: Errores de estilo en la terminal (npm run lint)
 * ******************************************************************
 */
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', '.expo/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, __DEV__: 'readonly', process: 'readonly', require: 'readonly' },
    },
    settings: { react: { version: '19.3' } },
    plugins: { '@stylistic': stylistic, react, 'react-hooks': reactHooks },
    rules: {
      '@stylistic/brace-style': ['error', 'allman', { allowSingleLine: false }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/max-len': ['error', { code: 100, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreUrls: true }],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      '@stylistic/no-trailing-spaces': 'error',
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': ['error', 'always'],
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none' }],
      'no-labels': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  { files: ['eslint.config.mjs'], languageOptions: { globals: { ...globals.node } } },
];
