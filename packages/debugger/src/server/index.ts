import { constants } from 'node:fs'
import { access, readFile, realpath, stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface DebuggerUi {
  readonly basePath: string
  fetch(req: Request): Promise<Response>
}

export interface DebuggerUiOptions {
  /** Mount path. Defaults to `/debugger`. */
  readonly path?: string
  /** Built SPA directory. Defaults to the package `dist/app`. */
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

function normalizeBasePath(path: string): string {
  if (!path.startsWith('/') || path.includes('//') || path.split('/').includes('..')) {
    throw new Error(`debugger basePath must be an absolute URL path: ${path}`)
  }

  const base = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  if (base === '/') {
    throw new Error('debugger basePath must not be /')
  }

  return base
}

function isDebuggerRequestPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

/** Built SPA directory beside the server module: `dist/debugger/app` in the published package. */
export function debuggerAppRoot(moduleUrl: string = import.meta.url): string {
  return fileURLToPath(new URL('../app/', moduleUrl))
}

function injectDocument(html: string, basePath: string): string {
  const href = basePath.endsWith('/') ? basePath : `${basePath}/`
  const snippet = `<base href="${href}">`

  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${snippet}`)
  }

  return `${snippet}${html}`
}

function htmlResponse(root: string, basePath: string): Promise<Response> {
  return readFile(join(root, 'index.html'), 'utf8').then(
    (html) =>
      new Response(injectDocument(html, basePath), {
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'text/html; charset=utf-8',
        },
      }),
    () => new Response('Debugger UI is not built', { status: 404 }),
  )
}

function fileResponse(
  root: string,
  file: string,
  method: string,
  basePath: string,
): Promise<Response | null> {
  return realpath(root).then((rootReal) =>
    realpath(file).then(
      (fileReal) => {
        if (!inside(rootReal, fileReal)) {
          return new Response('Invalid path', { status: 400 })
        }

        return stat(fileReal).then((info) => {
          if (!info.isFile()) {
            return null
          }

          if (fileReal.endsWith(`${sep}index.html`)) {
            return readFile(fileReal, 'utf8').then(
              (html) =>
                new Response(injectDocument(html, basePath), {
                  headers: {
                    'cache-control': 'no-cache',
                    'content-type': 'text/html; charset=utf-8',
                  },
                }),
            )
          }

          const headers = new Headers({
            'cache-control': fileReal.includes(`${sep}assets${sep}`) ? assetCache : 'no-cache',
            'content-type': contentType(extname(fileReal)),
          })

          if (method === 'HEAD') {
            return new Response(null, { headers })
          }

          return readFile(fileReal).then((body) => new Response(body, { headers }))
        })
      },
      () => null,
    ),
  )
}

function requestedFile(root: string, pathname: string, basePath: string): string | null {
  const relative = pathname === basePath ? '' : pathname.slice(basePath.length)
  let decoded = relative

  try {
    decoded = decodeURIComponent(relative)
  } catch {
    return null
  }

  if (decoded.includes('\0')) {
    return null
  }

  const trimmed = decoded.replace(/^[/\\]+/, '')

  if (trimmed.split(/[/\\]/).includes('..')) {
    return null
  }

  const file = normalize(join(root, trimmed))
  return inside(root, file) ? file : null
}

function serveDebugger(req: Request, root: string, basePath: string): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return Promise.resolve(new Response('Method Not Allowed', { status: 405 }))
  }

  const pathname = new URL(req.url).pathname

  if (!isDebuggerRequestPath(pathname, basePath)) {
    return Promise.resolve(new Response('Not Found', { status: 404 }))
  }

  const file = requestedFile(root, pathname, basePath)

  if (!file) {
    return Promise.resolve(new Response('Invalid path', { status: 400 }))
  }

  return access(file, constants.F_OK).then(
    () =>
      fileResponse(root, file, req.method, basePath).then(
        (response) => response ?? htmlResponse(root, basePath),
      ),
    () => htmlResponse(root, basePath),
  )
}

/** Static host for the debugger SPA. Mount it with `createLooms({ debugger: debuggerUi() })`. */
export function debuggerUi(options: DebuggerUiOptions = {}): DebuggerUi {
  const basePath = normalizeBasePath(options.path ?? '/debugger')
  const root = options.root ?? debuggerAppRoot()

  return {
    basePath,
    fetch: (req) => serveDebugger(req, root, basePath),
  }
}
