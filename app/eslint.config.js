// app/eslint.config.js
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      env: {
        browser: true,
        node: true,
        es2021: true,
      },
    },
    rules: {
      'no-eval': 'error',
      'no-console': 'warn',
      'eqeqeq': 'error',
      'no-unused-vars': 'warn',
      // There is no built-in 'no-inner-html', use 'no-inner-html' as a custom rule if needed
    },
  },
];