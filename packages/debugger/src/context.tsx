import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { createLoomsClient, type LoomsClient } from '@looms/client'
import { LoomsProvider } from '@looms/react'

import type { DebuggerPlugin } from './plugin'

export interface DebuggerContextValue {
  readonly client: LoomsClient
  readonly plugins: readonly DebuggerPlugin[]
}

const DebuggerContext = createContext<DebuggerContextValue | null>(null)

/** Supplies one Looms host to both the API client and the run stores. */
export function DebuggerProvider({
  endpoint = '',
  plugins,
  children,
}: {
  endpoint?: string
  plugins: readonly DebuggerPlugin[]
  children: ReactNode
}) {
  const value = useMemo<DebuggerContextValue>(
    () => ({ client: createLoomsClient({ baseUrl: endpoint }), plugins }),
    [endpoint, plugins],
  )

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
