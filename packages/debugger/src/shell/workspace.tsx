import type { PublishedDefinition } from '@looms/core'

import { useDebugger } from '../context'
import { workspaceFor } from '../plugin'
import { definitionKey } from './definition-key'
import { RunTools } from './run-tools'
import { StartForm } from './start-form'

export function Workspace({
  definition,
  runId,
  onStarted,
}: {
  definition: PublishedDefinition | undefined
  runId?: string
  onStarted: (runId: string) => void
}) {
  const { plugins } = useDebugger()

  if (!definition) {
    return <p className="text-muted-foreground p-3 text-xs">Select a run type to start.</p>
  }

  const View = workspaceFor(plugins, definition.kind)?.component ?? StartForm

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border border-b px-3 py-2">
        <h2 className="text-sm font-medium">{definition.name}</h2>
        {definition.description ? (
          <p className="text-muted-foreground text-xs">{definition.description}</p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <View
          key={definitionKey(definition)}
          definition={definition}
          runId={runId}
          onStarted={onStarted}
        />
      </div>
      {runId ? <RunTools runId={runId} /> : null}
    </div>
  )
}
