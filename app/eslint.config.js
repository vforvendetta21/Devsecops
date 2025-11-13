// app/eslint.config.js
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-eval': 'error',
      'no-console': 'warn',
      'eqeqeq': 'error',
      'no-unused-vars': 'warn',
    },
  },
];
