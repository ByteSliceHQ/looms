import { Button, StatusBadge, useDebugger, type ProjectionContext } from '@looms/debugger'

import type { PendingApprovalsState } from '../projections'
import { decision } from '../signals'

export function ApprovalsView({ runId, state }: ProjectionContext<PendingApprovalsState>) {
  const { client } = useDebugger()

  if (state.items.length === 0) {
    return <p className="text-muted-foreground text-xs">No approvals requested.</p>
  }

  function decide(approvalId: string, outcome: 'approve' | 'reject') {
    void client.signal(runId, [decision(approvalId, outcome)])
  }

  return (
    <ul className="grid gap-2">
      {state.items.map((item) => (
        <li key={item.approvalId} className="border-border bg-card/60 rounded-lg border p-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="min-w-0 flex-1 truncate font-medium">
              {item.title || item.approvalId}
            </span>
            <StatusBadge status={item.status} />
          </div>
          {item.status === 'pending' ? (
            <div className="mt-2 flex gap-1.5">
              <Button size="xs" onClick={() => decide(item.approvalId, 'approve')}>
                Approve
              </Button>
              <Button size="xs" variant="outline" onClick={() => decide(item.approvalId, 'reject')}>
                Reject
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
