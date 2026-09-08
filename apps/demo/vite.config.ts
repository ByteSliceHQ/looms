import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig(({ mode }) => {
  // App-local `.env` → process.env (so Looms sees LOOMS_S2_*).
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    server: {
      port: Number(process.env.PORT ?? 8787),
      host: process.env.HOST ?? '127.0.0.1',
    },
    worker: {
      format: 'es',
    },
    plugins: [
      tanstackStart({
        srcDirectory: 'src',
        importProtection: {
          client: {
            // Allow `@looms/livestore/react` and `@looms/client` in the browser; block host packages.
            specifiers: [
              /^@looms\/(runtime|s2)(\/|$)/,
              /^@looms\/livestore$/,
            ],
          },
        },
      }),
      nitro({ preset: 'bun' }),
      viteReact(),
    ],
  }
})
