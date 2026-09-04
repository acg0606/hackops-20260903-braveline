const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['android/**', 'dist/*', 'node_modules.*/*'],
  },
  {
    files: ['src/app/rehearse.tsx'],
    rules: {
      // Animated.Value instances are stable imperative handles consumed by React Native styles.
      'react-hooks/refs': 'off',
    },
  },
]);
