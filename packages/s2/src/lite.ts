import * as childProcess from 'node:child_process'
import * as fs from 'node:fs'
import * as net from 'node:net'
import * as os from 'node:os'
import * as path from 'node:path'

import type { EventStore } from '@looms/core'

import { s2 } from './store'

export interface S2LiteOptions {
  /** Port for local s2-lite process. Defaults to 8080. */
  readonly port?: number
  /** Basin name. Defaults to 'looms-demo'. */
  readonly basin?: string
  /** Auth token for local access. Defaults to 's2_local'. */
  readonly accessToken?: string
  /** Environment bag used to locate the s2 binary. */
  readonly env?: Record<string, string | undefined>
  /** Explicit path to the s2 binary, skipping lookup. */
  readonly binaryPath?: string
}

export function findS2Binary(env: Record<string, string | undefined>): string | undefined {
  // 1. Check PATH
  const pathDirs = (env.PATH ?? '').split(path.delimiter)

  for (const dir of pathDirs) {
    if (!dir) {
      continue
    }

    const candidate = path.join(dir, 's2')

    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate
      }
    } catch {
      // Ignore filesystem access errors during lookup.
    }
  }

  // 2. Check FLOX_ENV_CACHE
  if (env.FLOX_ENV_CACHE) {
    const floxCandidate = path.join(env.FLOX_ENV_CACHE, 's2', 'bin', 's2')

    if (fs.existsSync(floxCandidate)) {
      return floxCandidate
    }
  }

  // 3. Check S2_INSTALL_PREFIX
  if (env.S2_INSTALL_PREFIX) {
    const prefixCandidate = path.join(env.S2_INSTALL_PREFIX, 'bin', 's2')

    if (fs.existsSync(prefixCandidate)) {
      return prefixCandidate
    }
  }

  // 4. Check ~/.s2/bin/s2
  const homeCandidate = path.join(os.homedir(), '.s2', 'bin', 's2')

  if (fs.existsSync(homeCandidate)) {
    return homeCandidate
  }

  // 5. Check local ./.s2/bin/s2
  const localCandidate = path.join(process.cwd(), '.s2', 'bin', 's2')

  if (fs.existsSync(localCandidate)) {
    return localCandidate
  }

  return undefined
}

export function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(200)

    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })

    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })

    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })

    socket.connect(port, host)
  })
}

export interface StartedS2Lite {
  readonly port: number
  readonly endpoint: string
  readonly stop: () => void
}

interface S2ChildProcess {
  kill(signal?: string): boolean
  exitCode: number | null
  stderr: {
    on(event: string, listener: (chunk: any) => void): void
  } | null
}

let activeProcess: S2ChildProcess | null = null

export async function startS2Lite(options: S2LiteOptions = {}): Promise<StartedS2Lite> {
  const port = options.port ?? 8080
  const endpoint = `http://127.0.0.1:${port}`

  // 1. Check if an s2-lite instance is already responding on this port.
  const alreadyRunning = await isPortOpen(port)

  if (alreadyRunning) {
    return {
      port,
      endpoint,
      stop: () => {
        // Did not spawn this process, no-op stop.
      },
    }
  }

  // 2. Locate the s2 binary.
  const binaryPath = options.binaryPath ?? findS2Binary(options.env ?? {})

  if (!binaryPath) {
    throw new Error(
      `s2 CLI binary not found on PATH or in standard locations.
To install s2-lite for local development:
  flox activate          # installs into $FLOX_ENV_CACHE/s2 (preferred)
  bun run setup:s2       # scripts/install-s2-cli.sh
  https://s2.dev/docs/cli/installation`,
    )
  }

  // 3. Spawn s2 lite.
  // SAFETY: child_process.spawn returns child process matching S2ChildProcess.
  const child = childProcess.spawn(binaryPath, ['lite', '--port', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  }) as S2ChildProcess

  activeProcess = child

  const cleanup = () => {
    if (activeProcess === child) {
      activeProcess = null
    }

    try {
      child.kill('SIGTERM')
    } catch {
      // Process may already have exited.
    }
  }

  process.once('exit', cleanup)
  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)

  let stderrOutput = ''

  child.stderr?.on('data', (chunk) => {
    stderrOutput += chunk.toString()
  })

  // 4. Poll until the port responds or the process exits unexpectedly.
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `s2 lite process exited with code ${child.exitCode} before becoming ready: ${stderrOutput}`,
      )
    }

    const ready = await isPortOpen(port)

    if (ready) {
      return {
        port,
        endpoint,
        stop: cleanup,
      }
    }

    await new Promise((r) => setTimeout(r, 50))
  }

  cleanup()
  throw new Error(`Timed out waiting for s2 lite to start on port ${port}: ${stderrOutput}`)
}

/**
 * Returns a factory function for createLooms that automatically starts local s2-lite
 * and connects an S2 EventStore to it.
 */
export function s2Lite(options: S2LiteOptions = {}): () => Promise<EventStore> {
  return async () => {
    const started = await startS2Lite(options)
    return s2({
      basin: options.basin ?? 'looms-demo',
      accessToken: options.accessToken ?? 's2_local',
      endpoint: started.endpoint,
    })
  }
}
