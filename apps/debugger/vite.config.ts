import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const api = 'http://127.0.0.1:8787'
const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/definitions': api,
      '/health': api,
      '/operations': api,
      '/runs': api,
    },
  },
})
