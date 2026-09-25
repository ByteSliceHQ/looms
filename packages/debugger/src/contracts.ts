import type { EventEnvelope, JsonValue, ReplayStep, ThreadTree } from '@looms/core'

export type EventFamily = string

export type EventSummary = {
  title: string
  detail?: string
}

export type DebuggerEvent<TType extends string = string> = Pick<
  EventEnvelope<TType>,
  'id' | 'runId' | 'seq' | 'ts' | 'type' | 'payload' | 'threadId' | 'causationId' | 'ephemeral'
> &
  Partial<Pick<EventEnvelope<TType>, 'parentThreadId' | 'correlationId' | 'effectId' | 'origin'>>

export type EventStreamCatalog<TEvent extends DebuggerEvent = DebuggerEvent> = {
  families: readonly string[]
  familyOf: (type: string) => string
  familyColor: (family: string) => string
  summarize: (event: TEvent) => EventSummary
  searchText?: (event: TEvent) => string
}

export type ReplayLoader = (input: { runId: string; seq: number }) => Promise<ReplayStep | null>

export type RunTreeModel = {
  runId: string
  runStatus: string
  tree: ThreadTree
  eventCounts: Map<string, number>
  totalEventCount?: number
}

export type { JsonValue, ReplayStep, ThreadTree }
