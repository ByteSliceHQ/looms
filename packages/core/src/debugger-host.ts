/** A request the runtime has matched and authorized under the debugger mount. */
export interface DebuggerRequest {
  /** Mount path without a trailing slash, such as `/debugger`. */
  readonly basePath: string
  /** Path below the mount: empty for the mount itself, otherwise it starts with `/`. */
  readonly path: string
}

/**
 * Serves a debugger UI under `basePath`. The runtime matches, authorizes, and strips the mount
 * path; the host only serves files.
 */
export interface DebuggerHost {
  /** Absolute mount path, such as `/debugger`. Must not overlap the HTTP API. */
  readonly basePath: string
  fetch(req: Request, mount: DebuggerRequest): Promise<Response | null>
}
