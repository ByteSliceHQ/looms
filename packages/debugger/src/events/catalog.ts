import type { DebuggerEvent, EventStreamCatalog } from '../contracts'
import { compactJson } from '../lib/cn'
import { summarizeDomainEvent } from './domain-summarize'
import { DEFAULT_FAMILIES, familyClass, familyFromPrefix, type EventSummary } from './family'
import { summarizeProtocolEvent } from './protocol-summarize'

export function summarizeEvent(event: DebuggerEvent): EventSummary {
  return (
    summarizeProtocolEvent(event) ??
    summarizeDomainEvent(event) ?? {
      title: event.type,
      detail: compactJson(event.payload),
    }
  )
}

export function searchText<TEvent extends DebuggerEvent>(
  event: TEvent,
  summarize: (event: TEvent) => EventSummary = summarizeEvent,
): string {
  const summary = summarize(event)
  return [event.type, event.threadId ?? '', summary.title, summary.detail ?? '', event.id]
    .join(' ')
    .toLowerCase()
}

export function createDefaultCatalog<
  TEvent extends DebuggerEvent = DebuggerEvent,
>(): EventStreamCatalog<TEvent> {
  return {
    families: DEFAULT_FAMILIES,
    familyOf: familyFromPrefix,
    familyClass,
    summarize: (event) => summarizeEvent(event),
    searchText: (event) => searchText(event),
  }
}

export const defaultEventCatalog: EventStreamCatalog = createDefaultCatalog()
