import { AgentChat } from '../workspace/agent-chat'
import { WorkflowForm } from '../workspace/workflow-form'
import type { RunType } from '../../catalog'

export function WorkspacePanel({
  type,
  runId,
  onStarted,
  onReset,
}: {
  type?: RunType
  runId?: string
  onStarted: (runId: string) => void
  onReset: () => void
}) {
  if (!type) {
    return <p className="p-3 text-xs text-muted-foreground">Select a run type.</p>
  }
  if (type.kind === 'workflow') {
    return <WorkflowForm key={type.name} type={type} runId={runId} onStarted={onStarted} />
  }
  return (
    <AgentChat key={type.name} type={type} runId={runId} onStarted={onStarted} onReset={onReset} />
  )
}
