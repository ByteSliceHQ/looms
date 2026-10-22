import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'

import { createLoomsClient, type LoomsClient } from '@looms/client'
import { LoomsProvider } from '@looms/react'

import type { DebuggerPlugin } from './plugin'

/** Where to land in a run another view links to. */
export interface OpenRunTarget {
  readonly seq?: number
}

export interface DebuggerContextValue {
  readonly client: LoomsClient
  readonly plugins: readonly DebuggerPlugin[]
  /** Opens another run, for example the run a schedule fired or the run that launched this one. */
  readonly openRun?: (runId: string, target?: OpenRunTarget) => void
}

const DebuggerContext = createContext<DebuggerContextValue | null>(null)

/** Supplies one Looms host to both the API client and the run stores. */
export function DebuggerProvider({
  endpoint = '',
  plugins,
  openRun,
  children,
}: {
  endpoint?: string
  plugins: readonly DebuggerPlugin[]
  openRun?: (runId: string, target?: OpenRunTarget) => void
  children: ReactNode
}) {
  const openRunRef = useRef(openRun)
  openRunRef.current = openRun
  const hasOpenRun = openRun !== undefined

  const stableOpenRun = useCallback((runId: string, target?: OpenRunTarget) => {
    openRunRef.current?.(runId, target)
  }, [])

  const value = useMemo<DebuggerContextValue>(() => {
    const client = createLoomsClient({ baseUrl: endpoint })

    if (!hasOpenRun) {
      return { client, plugins }
    }

    return { client, plugins, openRun: stableOpenRun }
  }, [endpoint, plugins, hasOpenRun, stableOpenRun])

  return (
    <LoomsProvider endpoint={endpoint}>
      <DebuggerContext.Provider value={value}>{children}</DebuggerContext.Provider>
    </LoomsProvider>
  )
}

export function useDebugger(): DebuggerContextValue {
  const value = useContext(DebuggerContext)

  if (!value) {
    throw new Error('useDebugger must be used within DebuggerProvider')
  }

  return value
}
