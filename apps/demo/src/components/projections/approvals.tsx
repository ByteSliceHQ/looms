import { useRun } from '@/hooks/use-run'
import { statusClass } from '@/lib/status'
import { pendingApprovals, decision } from '@looms/approval'
import { useProjection } from '@looms/livestore/react'

import { StatusDot } from '../status-dot'
import { Button } from '../ui/button'

export function Approvals({ runId }: { runId: string }) {
  const { store } = useRun(runId)
  const approvals = useProjection(store, pendingApprovals)

  async function decide(approvalId: string, outcome: 'approve' | 'reject') {
    await store.commit(decision(approvalId, outcome))
  }

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
