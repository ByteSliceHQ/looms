import { useCallback } from 'react'

import { statusClass } from '@/lib/status'
import { decision, pendingApprovals } from '@looms/approval'
import { useProjection, useRunStore } from '@looms/livestore/react'

import { StatusDot } from '../status-dot'
import { Button } from '../ui/button'

export function Approvals({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const approvals = useProjection(store, pendingApprovals)

  const decide = useCallback(
    async (approvalId: string, outcome: 'approve' | 'reject') => {
      await store.commit(decision(approvalId, outcome))
    },
    [store],
  )

  if (approvals.items.length === 0) {
    return <p className="text-muted-foreground text-xs">None</p>
  }

  return (
    <ul className="space-y-2">
      {approvals.items.map((item) => (
        <li key={item.approvalId} className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs">
            <StatusDot status={item.status} />
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            <span className={statusClass(item.status)}>{item.status}</span>
          </div>
          {item.status === 'pending' ? (
            <div className="flex gap-1">
              <Button size="sm" onClick={() => void decide(item.approvalId, 'approve')}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void decide(item.approvalId, 'reject')}
              >
                Reject
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
