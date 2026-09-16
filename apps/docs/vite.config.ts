import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

// Nitro/Vite honor PORT over server.port; pin docs so a shared PORT (e.g. from demo) cannot collide.
const port = Number(process.env.DOCS_PORT ?? 8788)
process.env.PORT = String(port)
process.env.NITRO_PORT = String(port)

export default defineConfig(({ command, mode }) => {
  const isPrerenderBuild = mode === 'prerender'

  return {
    server: {
      port,
      strictPort: true,
      host: process.env.HOST ?? '127.0.0.1',
    },
    optimizeDeps: {
      include: ['katex'],
    },
    worker: {
      format: 'es',
    },
    plugins: [
      tanstackStart({
        srcDirectory: 'src',
        prerender: isPrerenderBuild
          ? {
              enabled: true,
              crawlLinks: true,
              failOnError: true,
              filter: ({ path }) => !path.includes('.'),
            }
          : undefined,
      }),
      nitro(
        isPrerenderBuild
          ? {
              preset: 'bun',
              output: {
                dir: '.prerender',
              },
            }
          : command === 'serve'
            ? {
                preset: 'bun',
              }
            : {
                preset: 'cloudflare_module',
                cloudflare: {
                  deployConfig: true,
                },
              },
      ),
      viteReact(),
      tailwindcss(),
    ],
  }
})
