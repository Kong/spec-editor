import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      include: ['**/*.spec.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**', 'node_modules/**', 'dist/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      deps: {
        optimizer: {
          web: {
            // https://github.com/vitest-dev/vitest/issues/4074
            exclude: ['vue'],
          },
        },
      },
    },
  }),
)
