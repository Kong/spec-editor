import eslintKongUiConfig from '@kong/eslint-config-kong-ui'

export default [
  ...eslintKongUiConfig,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
]
