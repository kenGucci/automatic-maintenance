module.exports = {
  env: { node: true, es2021: true, jest: true },
  extends: 'eslint:recommended',
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'never']
  }
};
