const path = require('path');

module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb', 'next/core-web-vitals', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 6,
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    mocha: true,
    es6: true,
    jest: true,
    es2021: true,
  },
  overrides: [
    {
      files: ['*.stories.js', '*.test.js'],
      rules: { 'react/prop-types': 0 },
    },
  ],
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['components', path.resolve(__dirname, 'src', 'components')],
          ['features', path.resolve(__dirname, 'src', 'components', 'features')],
          ['icons', path.resolve(__dirname, 'src', 'icons')],
          ['stylesheets', path.resolve(__dirname, 'src', 'stylesheets')],
          ['utils', path.resolve(__dirname, 'src', 'utils')],
          ['constants', path.resolve(__dirname, 'src', 'constants')],
          ['helpers', path.resolve(__dirname, 'src', 'helpers')],
        ],
        extensions: ['.js', '.jsx', '.json'],
      },
    },
    react: { version: 'detect' },
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'no-console': 1,
    indent: ['error', 2, { SwitchCase: 1 }],
    'space-before-function-paren': 'off',
    'react/prefer-stateless-function': 'warn',
    'react/jsx-one-expression-per-line': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'linebreak-style': 'off',
    'global-require': 'off',
    semi: 'warn',
    'arrow-body-style': 'off',
    'no-multiple-empty-lines': ['warn', { max: 1 }],
    'no-return-assign': 'off',
    'import/no-cycle': 2,
    radix: ['error', 'as-needed'],
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'func-names': ['error', 'always'],
    'no-restricted-syntax': ['off', 'ForOfStatement', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'no-unused-expressions': [
      'error',
      {
        allowTaggedTemplates: true,
      },
    ],
    'no-underscore-dangle': ['error', { allow: ['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] }],
  },
};
