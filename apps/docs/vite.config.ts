import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

// Nitro/Vite honor PORT over server.port; pin docs so a shared PORT (e.g. from demo) cannot collide.
const port = Number(process.env.DOCS_PORT ?? 8788)
process.env.PORT = String(port)
process.env.NITRO_PORT = String(port)

export default defineConfig({
  server: {
    port,
    strictPort: true,
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
    tailwindcss(),
  ],
})
