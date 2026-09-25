import { MousePointerClick } from 'lucide-react'

import type { PublishedDefinition } from '@looms/core'

import { useDebugger } from '../context'
import { workspaceFor } from '../plugin'
import { EmptyState, PanelHeader } from '../ui/panel'
import { definitionKey } from './definition-key'
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
    return (
      <div className="flex h-full flex-col">
        <PanelHeader />
        <EmptyState icon={<MousePointerClick />} title="Pick a run type">
          Choose one from the run type menu to start a run, or press ⌘K to open a past run.
        </EmptyState>
      </div>
    )
  }

  const View = workspaceFor(plugins, definition)?.component ?? StartForm

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader>
        <h2 className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[13px] font-medium">{definition.name}</span>
          {definition.description ? (
            <span className="text-muted-foreground truncate text-xs" title={definition.description}>
              {definition.description}
            </span>
          ) : null}
        </h2>
      </PanelHeader>
      <div className="min-h-0 flex-1 overflow-hidden">
        <View
          key={definitionKey(definition)}
          definition={definition}
          runId={runId}
          onStarted={onStarted}
        />
      </div>
    </div>
  )
}
