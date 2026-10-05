import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Comme CRA : signalé, mais ne bloque pas
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // Dette technique existante, signalée par les règles React Compiler
      // (eslint-plugin-react-hooks v7) : à corriger progressivement
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'no-useless-catch': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/setupTests.js', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    // Utilitaires de test : pas des composants rechargés à chaud
    files: ['src/test/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // En dernier : désactive les règles de style qui contrediraient Prettier
  prettier,
]);
