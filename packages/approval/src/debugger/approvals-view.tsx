import { StatusDot, statusClass, useDebugger, type ProjectionContext } from '@looms/debugger'

import type { PendingApprovalsState } from '../projections'
import { decision } from '../signals'

export function ApprovalsView({ runId, state }: ProjectionContext<PendingApprovalsState>) {
  const { client } = useDebugger()

  if (state.items.length === 0) {
    return <p className="text-muted-foreground text-xs">None</p>
  }

  function decide(approvalId: string, outcome: 'approve' | 'reject') {
    void client.signal(runId, [decision(approvalId, outcome)])
  }

  return (
    <ul className="space-y-2">
      {state.items.map((item) => (
        <li key={item.approvalId} className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs">
            <StatusDot status={item.status} />
            <span className="min-w-0 flex-1 truncate">{item.title || item.approvalId}</span>
            <span className={statusClass(item.status)}>{item.status}</span>
          </div>
          {item.status === 'pending' ? (
            <div className="flex gap-1">
              <button
                type="button"
                className="bg-secondary rounded px-2 py-0.5 text-[11px]"
                onClick={() => decide(item.approvalId, 'approve')}
              >
                Approve
              </button>
              <button
                type="button"
                className="bg-secondary rounded px-2 py-0.5 text-[11px]"
                onClick={() => decide(item.approvalId, 'reject')}
              >
                Reject
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
