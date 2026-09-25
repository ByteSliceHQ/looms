import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { createLoomsClient, type LoomsClient } from '@looms/client'

import type { DebuggerPlugin } from './plugin'

export interface DebuggerContextValue {
  readonly client: LoomsClient
  readonly plugins: readonly DebuggerPlugin[]
}

const DebuggerContext = createContext<DebuggerContextValue | null>(null)

export function DebuggerProvider({
  client,
  plugins,
  children,
}: {
  client?: LoomsClient
  plugins: readonly DebuggerPlugin[]
  children: ReactNode
}) {
  const value = useMemo<DebuggerContextValue>(
    () => ({ client: client ?? createLoomsClient(), plugins }),
    [client, plugins],
  )

  return <DebuggerContext.Provider value={value}>{children}</DebuggerContext.Provider>
}

export function useDebugger(): DebuggerContextValue {
  const value = useContext(DebuggerContext)

  if (!value) {
    throw new Error('useDebugger must be used within DebuggerProvider')
  }

  return value
}
