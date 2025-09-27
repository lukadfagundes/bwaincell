module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off', // Using logger instead
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
  },
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  globals: {
    process: true,
    module: true,
    require: true,
    __dirname: true,
    __filename: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.js', 'jest.config.js', '.eslintrc.js'],
};
