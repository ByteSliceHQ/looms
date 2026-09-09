import { useProjection } from '@looms/livestore/react'
import { nodes } from '@looms/workflow'
import { StatusDot } from '../status-dot'
import { JsonView } from '../json-view'
import { useRun } from '@/hooks/use-run'
import { statusClass } from '@/lib/status'

export function WorkflowNodes({ runId }: { runId: string }) {
  const { store } = useRun(runId)
  const projected = useProjection(store, nodes)
  const entries = Object.entries(projected.nodes)
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">No nodes</p>
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
          {node.error ? <p className="text-xs text-status-failed">{node.error}</p> : null}
        </li>
      ))}
    </ul>
  )
}
