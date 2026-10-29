import type { CaseStatus } from '@looms/northline/http'
import type { LoomsConnectionStatus } from '@swirls/looms/react'

import { statusLabel } from '../format'

export function StatusPill({ status }: { status: CaseStatus }) {
  return <span className={`pill pill-${status}`}>{statusLabel(status)}</span>
}

export function LiveDot({ connection }: { connection: LoomsConnectionStatus }) {
  const label =
    connection === 'live' ? 'Live' : connection === 'reconnecting' ? 'Reconnecting' : 'Connecting'

  return <span className={`live live-${connection}`}>{label}</span>
}
