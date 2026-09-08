import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: Number(process.env.DOCS_PORT ?? 8788),
    host: process.env.HOST ?? '127.0.0.1',
  },
  worker: {
    format: 'es',
  },
  plugins: [
    tanstackStart({
      srcDirectory: 'src',
    }),
    nitro({ preset: 'bun' }),
    viteReact(),
  ],
})
