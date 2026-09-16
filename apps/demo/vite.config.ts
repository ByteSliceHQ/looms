import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // App-local `.env` → process.env (so Looms sees LOOMS_S2_*).
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  const port = Number(process.env.PORT ?? 8787)
  process.env.PORT = String(port)
  process.env.NITRO_PORT = String(port)

  return {
    server: {
      port,
      strictPort: true,
      host: process.env.HOST ?? '127.0.0.1',
    },
    worker: {
      format: 'es',
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    plugins: [
      tanstackStart({
        srcDirectory: 'src',
        importProtection: {
          client: {
            // Allow `@swirls/looms/react` and `@swirls/looms/client` in the browser; block host packages.
            specifiers: [/^@swirls\/looms\/(runtime|s2)(\/|$)/],
          },
        },
      }),
      nitro({ preset: 'bun' }),
      viteReact(),
      tailwindcss(),
    ],
  }
})
