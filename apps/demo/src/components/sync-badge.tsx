import { useSyncStatus, type LoomsStore } from '@looms/livestore/react'

export function SyncBadge({ store }: { store: LoomsStore }) {
  const status = useSyncStatus({ store })
  const label = status.isSynced
    ? 'synced'
    : `syncing${status.pendingCount ? ` (${status.pendingCount})` : ''}`

  return (
    <span className={`sync-badge ${status.isSynced ? 'ok' : 'warn'}`} title={JSON.stringify(status)}>
      LiveStore · {label}
    </span>
  )
}
