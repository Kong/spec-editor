import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import MonacoVitePlugin from '@kong-ui-public/monaco-editor/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueDevTools(),
    MonacoVitePlugin({
      languages: ['yaml', 'json'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        // Inject the @kong/design-tokens SCSS variables to make them available for all components.
        // This is not needed in host applications.
        additionalData: `
          @use "sass:color";
          @use "@/styles/globals" as *;
        `,
      },
    },
  },
})
