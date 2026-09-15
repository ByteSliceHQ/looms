import { isLoomsApiPath } from '@looms/runtime'

type LoomsBackend = 'bun' | 'cloudflare'

function parseBackend(raw?: string): LoomsBackend {
  if (raw === 'cloudflare') {
    return 'cloudflare'
  }

  return 'bun'
}

const backend = parseBackend(process.env.LOOMS_BACKEND)
const workerUrl = process.env.LOOMS_WORKER_URL ?? 'http://127.0.0.1:8788'

async function forwardToWorker(req: Request): Promise<Response | null> {
  const url = new URL(req.url)

  if (!isLoomsApiPath(url.pathname)) {
    return null
  }

  const target = new URL(url.pathname + url.search, workerUrl)
  const headers = new Headers(req.headers)
  headers.delete('host')
  // Bun/Node fetch auto-decompresses response bodies. If we forward the browser's
  // Accept-Encoding, wrangler returns Content-Encoding: gzip with bytes the runtime
  // has already inflated — the browser then fails with ERR_CONTENT_DECODING_FAILED.
  headers.delete('accept-encoding')

  const init: RequestInit = {
    method: req.method,
    headers,
    // SAFETY: duplex 'half' is required when streaming request body in Fetch API
    // @ts-expect-error duplex is supported in modern runtimes
    duplex: req.body ? 'half' : undefined,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
  }

  try {
    const upstream = await fetch(target.toString(), init)
    const responseHeaders = new Headers(upstream.headers)
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause)

    return Response.json(
      {
        error: `Failed to proxy to Cloudflare Worker backend at ${workerUrl}: ${error}`,
      },
      { status: 502 },
    )
  }
}

/**
 * HTTP entry: Pluggable between local Bun+SQLite actor process and Cloudflare DO / celld worker.
 *
 * The Bun backend is loaded dynamically so Vite's Node-based SSR never evaluates
 * `bun:sqlite` when LOOMS_BACKEND=cloudflare.
 */
export const looms = {
  fetch: async (req: Request): Promise<Response | null> => {
    switch (backend) {
      case 'bun': {
        // SAFETY: dynamic + @vite-ignore keeps bun:sqlite out of Vite's Node SSR
        // graph when LOOMS_BACKEND=cloudflare (Vite's bin shebang is Node).
        const { getLocalRuntime } = await import(/* @vite-ignore */ './looms.bun')
        const runtime = await getLocalRuntime()
        return runtime.fetch(req)
      }

      case 'cloudflare': {
        return forwardToWorker(req)
      }

      default: {
        const unreachable: never = backend
        throw new Error('Unhandled backend: ' + String(unreachable))
      }
    }
  },
}
