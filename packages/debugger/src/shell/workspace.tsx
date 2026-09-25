import type { LoomsDefinition } from '@looms/client'

import { useDebugger } from '../context'
import { workspaceFor } from '../plugin'
import { RunTools } from './run-tools'
import { StartForm } from './start-form'

export function Workspace({
  definition,
  runId,
  onStarted,
}: {
  definition: LoomsDefinition | undefined
  runId?: string
  onStarted: (runId: string) => void
}) {
  const { plugins } = useDebugger()

  if (!definition) {
    return <p className="text-muted-foreground p-3 text-xs">Select a run type to start.</p>
  }

  const view = workspaceFor(plugins, definition.kind)
  const View = view?.component ?? StartForm

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <View definition={definition} runId={runId} onStarted={onStarted} />
      </div>
      {runId ? <RunTools runId={runId} /> : null}
    </div>
  )
}
