import { readFile, realpath, stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DebuggerHost, DebuggerRequest } from '@looms/core'

export interface DebuggerUiOptions {
  /** Mount path. Defaults to `/debugger`. */
  readonly path?: string
  /** Built SPA directory. Defaults to `debuggerAppRoot()`. */
  readonly root?: string
}

function contentType(extension: string): string {
  switch (extension) {
    case '.css':
      return 'text/css; charset=utf-8'
    case '.html':
      return 'text/html; charset=utf-8'
    case '.ico':
      return 'image/x-icon'
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8'
    case '.json':
    case '.map':
      return 'application/json; charset=utf-8'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.txt':
      return 'text/plain; charset=utf-8'
    case '.woff2':
      return 'font/woff2'
    default:
      return 'application/octet-stream'
  }
}

const assetCache = 'public, max-age=31536000, immutable'

function inside(root: string, file: string): boolean {
  const rootPath = normalize(root)
  const filePath = normalize(file)
  const prefix = rootPath.endsWith(sep) ? rootPath : `${rootPath}${sep}`
  return filePath === rootPath || filePath.startsWith(prefix)
}

/**
 * Built SPA directory beside the server module: `dist/debugger/app` in the published package.
 * Source checkouts have no bundle there; pass `root` pointing at `apps/debugger/dist` instead.
 */
export function debuggerAppRoot(moduleUrl: string = import.meta.url): string {
  return fileURLToPath(new URL('../app/', moduleUrl))
}

/** Relative file path for a mount path, or null when it cannot name a file inside the bundle. */
function relativeFile(path: string): string | null {
  let decoded: string

  try {
    decoded = decodeURIComponent(path)
  } catch {
    return null
  }

  const relative = decoded.replace(/^[/\\]+/, '')

  if (relative.includes('\0') || relative.split(/[/\\]/).includes('..')) {
    return null
  }

  return relative
}

function shellResponse(root: string, basePath: string, head: boolean): Promise<Response> {
  return readFile(join(root, 'index.html'), 'utf8').then(
    (html) => {
      const base = `<base href="${basePath}/">`

      const document = html.includes('<head>')
        ? html.replace('<head>', `<head>${base}`)
        : base + html

      return new Response(head ? null : document, {
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'text/html; charset=utf-8',
        },
      })
    },
    () => new Response('Debugger UI is not built', { status: 404 }),
  )
}

function fileResponse(file: string, relative: string, head: boolean): Promise<Response> {
  const headers = new Headers({
    'cache-control': relative.startsWith('assets/') ? assetCache : 'no-cache',
    'content-type': contentType(extname(file)),
  })

  if (head) {
    return Promise.resolve(new Response(null, { headers }))
  }

  return readFile(file).then((body) => new Response(body, { headers }))
}

function serveBundle(
  root: string,
  relative: string,
  mount: DebuggerRequest,
  head: boolean,
): Promise<Response> {
  return realpath(join(root, relative)).then(
    (file) => {
      if (!inside(root, file)) {
        return new Response('Invalid path', { status: 400 })
      }

      return stat(file).then((info) =>
        info.isFile() && file !== join(root, 'index.html')
          ? fileResponse(file, relative, head)
          : shellResponse(root, mount.basePath, head),
      )
    },
    // Client routes have no extension; a missing asset must 404 rather than load the HTML shell.
    () =>
      extname(relative) === ''
        ? shellResponse(root, mount.basePath, head)
        : new Response('Not Found', { status: 404 }),
  )
}

function serveDebugger(root: string, req: Request, mount: DebuggerRequest): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return Promise.resolve(new Response('Method Not Allowed', { status: 405 }))
  }

  const relative = relativeFile(mount.path)

  if (relative === null) {
    return Promise.resolve(new Response('Invalid path', { status: 400 }))
  }

  return realpath(root).then(
    (rootReal) => serveBundle(rootReal, relative, mount, req.method === 'HEAD'),
    () => new Response('Debugger UI is not built', { status: 404 }),
  )
}

/** Static host for the debugger SPA. Mount it with `createLooms({ debugger: debuggerUi() })`. */
export function debuggerUi(options: DebuggerUiOptions = {}): DebuggerHost {
  const root = options.root ?? debuggerAppRoot()

  return {
    basePath: options.path ?? '/debugger',
    fetch: (req, mount) => serveDebugger(root, req, mount),
  }
}
