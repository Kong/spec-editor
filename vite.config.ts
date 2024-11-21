import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// !Important: always externalize `shiki/onig.wasm`
const externalDependencies: string[] = ['shiki/onig.wasm']

// https://vite.dev/config/
export default defineConfig({
  base: '/spec-editor',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      external: externalDependencies,
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
