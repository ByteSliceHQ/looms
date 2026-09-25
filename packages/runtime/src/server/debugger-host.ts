import type { RouteInfo } from './auth'
import { LOOMS_API_ROOTS } from './fetch-handler'

export const debuggerRoute: RouteInfo = { access: 'read', name: 'debugger' }

/**
 * Serves a debugger UI for requests under `basePath`. The runtime does not read the filesystem;
 * the host implementation does.
 */
export interface DebuggerHost {
  /** Absolute mount path, such as `/debugger`. Must not overlap the HTTP API. */
  readonly basePath: string
  fetch(req: Request): Promise<Response | null>
}

export function normalizeDebuggerBasePath(path: string): string {
  if (!path.startsWith('/') || path.includes('//') || path.split('/').includes('..')) {
    throw new Error(`debugger basePath must be an absolute URL path: ${path}`)
  }

  const base = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  if (base === '/') {
    throw new Error('debugger basePath must not be /')
  }

  for (const reserved of LOOMS_API_ROOTS) {
    if (base === reserved || base.startsWith(`${reserved}/`) || reserved.startsWith(`${base}/`)) {
      throw new Error(`debugger basePath overlaps the HTTP API: ${base}`)
    }
  }

  return base
}

export function isDebuggerRequestPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}
