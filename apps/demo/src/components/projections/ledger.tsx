import { statusClass } from '@/lib/status'
import { useProjection, useRunStore } from '@looms/react'

import { ledger } from '../../modules/payments'
import { StatusDot } from '../status-dot'

export function Ledger({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const charges = useProjection(store, ledger)

  if (charges.entries.length === 0) {
    return <p className="text-muted-foreground text-xs">No charges</p>
  }

  return (
    <ul className="space-y-1">
      {charges.entries.map((entry) => (
        <li key={entry.chargeId} className="flex items-center gap-1.5 text-xs">
          <StatusDot status={entry.status} />
          <span>
            {entry.amount} {entry.currency}
          </span>
          <span className={statusClass(entry.status)}>{entry.status}</span>
        </li>
      ))}
    </ul>
  )
}
