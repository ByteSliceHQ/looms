import { statusClass } from '@/lib/status'
import { useProjection, useRunStore } from '@looms/react'
import { nodes } from '@looms/workflow'

import { JsonView } from '../json-view'
import { StatusDot } from '../status-dot'

export function WorkflowNodes({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const projected = useProjection(store, nodes)
  const entries = Object.entries(projected.nodes)

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-xs">No nodes</p>
  }

  return (
    <ul className="space-y-2">
      {entries.map(([id, node]) => (
        <li key={id} className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs">
            <StatusDot status={node.status} />
            <span className="font-mono">{id}</span>
            <span className={statusClass(node.status)}>{node.status}</span>
          </div>
          {node.result !== null ? <JsonView value={node.result} /> : null}
          {node.error ? <p className="text-status-failed text-xs">{node.error}</p> : null}
        </li>
      ))}
    </ul>
  )
}
