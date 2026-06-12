const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'supabase/functions/**', '.expo/*'],
  },
  {
    rules: {
      'no-console': 'error',
    },
  },
  {
    // src/engine = TypeScript pur : aucune dépendance app/RN (cf. CLAUDE.md)
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'expo', 'expo-*', '@expo/*', '@supabase/*', 'zustand', '@tanstack/*', 'i18next'],
              message: "src/engine doit rester du TypeScript pur (aucun import react/expo/supabase).",
            },
          ],
        },
      ],
    },
  },
  {
    // Outillage CLI et façade de log : console assumée
    files: ['scripts/**/*.ts', 'src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]);
