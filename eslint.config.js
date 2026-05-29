import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      globals: globals.browser,
      sourceType: 'script',
      ecmaVersion: 2022,
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['tests/**/*.js', 'playwright.config.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      sourceType: 'module',
      ecmaVersion: 2022,
    },
    rules: {
      'no-unused-vars': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
];
