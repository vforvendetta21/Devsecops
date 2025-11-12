module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-eval': 'error',
    'no-inner-html': 'warn',
    'no-console': 'warn',
    'eqeqeq': 'error',
    'no-unused-vars': 'warn'
  }
};