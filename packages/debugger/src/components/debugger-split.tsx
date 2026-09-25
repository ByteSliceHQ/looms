import type { ReactNode } from 'react'

import type { ThreadNode, ThreadTree } from '@looms/core'

import type { DebuggerEvent, EventStreamCatalog, ReplayLoader } from '../contracts'
import { cn } from '../lib/cn'
import { EventStream } from './event-stream'
import { RunTree } from './run-tree'

export function findThreadName(
  node: ThreadNode | null,
  threadId: string | undefined,
): string | undefined {
  if (!node || !threadId) {
    return undefined
  }

  if (node.threadId === threadId) {
    return node.definitionName
  }

  for (const child of node.children) {
    const name = findThreadName(child, threadId)

    if (name) {
      return name
    }
  }

  return undefined
}

export function DebuggerSplit<TEvent extends DebuggerEvent>({
  runId,
  runStatus,
  tree,
  events,
  eventCounts,
  startedAt,
  selectedThread,
  onSelectThread,
  selectedSeq,
  onSelectSeq,
  catalog,
  loadReplayStep,
  renderInspector,
  orientation = 'horizontal',
  showTreeHeading = true,
  className,
  treeClassName,
  streamClassName,
}: {
  runId: string
  runStatus: string
  tree: ThreadTree
  events: readonly TEvent[]
  eventCounts: Map<string, number>
  startedAt?: number
  selectedThread?: string
  onSelectThread: (threadId: string | undefined) => void
  selectedSeq?: number
  onSelectSeq: (seq: number | undefined) => void
  catalog?: EventStreamCatalog<TEvent>
  loadReplayStep?: ReplayLoader
  renderInspector?: (selected: TEvent) => ReactNode
  orientation?: 'horizontal' | 'vertical'
  showTreeHeading?: boolean
  className?: string
  treeClassName?: string
  streamClassName?: string
}) {
  const vertical = orientation === 'vertical'

  return (
    <div
      className={cn(
        'grid h-full min-h-0',
        vertical
          ? 'grid-rows-[minmax(0,38%)_minmax(0,1fr)]'
          : 'grid-cols-1 min-[36rem]:grid-cols-[14rem_minmax(0,1fr)]',
        className,
      )}
    >
      <section
        aria-label="Run tree"
        className={cn(
          'border-border min-h-0 overflow-hidden border-b',
          !vertical && 'min-[36rem]:border-r min-[36rem]:border-b-0',
          treeClassName,
        )}
      >
        <RunTree
          showHeading={showTreeHeading}
          runId={runId}
          runStatus={runStatus}
          tree={tree}
          eventCounts={eventCounts}
          totalEventCount={events.length}
          selectedThread={selectedThread}
          onSelectThread={onSelectThread}
        />
      </section>
      <section className={cn('min-h-0 overflow-hidden', streamClassName)}>
        <EventStream
          events={events}
          startedAt={startedAt}
          threadId={selectedThread}
          threadLabel={findThreadName(tree.root, selectedThread)}
          onClearThread={selectedThread ? () => onSelectThread(undefined) : undefined}
          selectedSeq={selectedSeq}
          onSelectSeq={onSelectSeq}
          catalog={catalog}
          loadReplayStep={loadReplayStep}
          renderInspector={renderInspector}
        />
      </section>
    </div>
  )
}
