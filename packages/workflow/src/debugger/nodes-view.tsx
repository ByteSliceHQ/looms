import { asJson } from '@looms/core'
import { JsonTree, StatusBadge } from '@looms/debugger'
import { useProjection, useRunStore } from '@looms/react'

import { nodes } from '../projections'

export function WorkflowNodesView({ runId }: { runId: string }) {
  const state = useProjection(useRunStore(runId), nodes)
  const entries = Object.entries(state.nodes)

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-xs">No nodes yet.</p>
  }

  return (
    <ul className="grid gap-2">
      {entries.map(([id, node]) => (
        <li key={id} className="border-border bg-card/60 rounded-lg border p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono font-medium">{id}</span>
            <StatusBadge status={node.status} />
          </div>
          {node.result !== null ? (
            <JsonTree value={asJson(node.result)} className="mt-1.5" />
          ) : null}
          {node.error ? <p className="text-status-failed mt-1.5">{node.error}</p> : null}
        </li>
      ))}
    </ul>
  )
}
