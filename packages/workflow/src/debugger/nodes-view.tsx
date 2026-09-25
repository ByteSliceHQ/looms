import { asJson } from '@looms/core'
import { JsonView, StatusDot, statusClass, type ProjectionContext } from '@looms/debugger'

import type { NodesProjectionState } from '../projections'

export function WorkflowNodesView({ state }: ProjectionContext<NodesProjectionState>) {
  const entries = Object.entries(state.nodes)

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-xs">No nodes</p>
  }

  return (
    <ul className="space-y-2">
      {entries.map(([id, node]) => (
        <li key={id} className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <StatusDot status={node.status} />
            <span className="font-mono">{id}</span>
            <span className={statusClass(node.status)}>{node.status}</span>
          </div>
          {node.result !== null ? <JsonView value={asJson(node.result)} /> : null}
          {node.error ? <p className="text-status-failed">{node.error}</p> : null}
        </li>
      ))}
    </ul>
  )
}
