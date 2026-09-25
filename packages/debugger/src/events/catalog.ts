import type { DebuggerEvent, EventStreamCatalog, EventSummary } from '../contracts'
import { compactJson } from '../lib/cn'
import type { DebuggerPlugin, EventFamilyView } from '../plugin'
import { builtinFamilies, runtimeFamily } from './builtin-families'
import { summarizeProtocolEvent } from './protocol-summarize'

function prefixOf(view: EventFamilyView): string {
  return view.prefix ?? `${view.family}.`
}

function searchText(event: DebuggerEvent, summary: EventSummary): string {
  return [event.type, event.threadId ?? '', summary.title, summary.detail ?? '', event.id]
    .join(' ')
    .toLowerCase()
}

/** Each event type belongs to the family view with the longest matching prefix. */
export function createEventCatalog<TEvent extends DebuggerEvent = DebuggerEvent>(
  plugins: readonly DebuggerPlugin[] = [],
): EventStreamCatalog<TEvent> {
  const views = [...plugins.flatMap((plugin) => plugin.families ?? []), ...builtinFamilies]
  // ES2022 has no Array#toSorted. `views` is a fresh array.
  // oxlint-disable-next-line unicorn/no-array-sort
  const byPrefix = views.sort((left, right) => prefixOf(right).length - prefixOf(left).length)
  const colors = new Map(views.map((view) => [view.family, view.color]))

  function viewOf(type: string): EventFamilyView {
    return byPrefix.find((view) => type.startsWith(prefixOf(view))) ?? runtimeFamily
  }

  function summarize(event: TEvent): EventSummary {
    return (
      summarizeProtocolEvent(event) ??
      viewOf(event.type).summarize?.(event) ?? {
        title: event.type,
        detail: compactJson(event.payload),
      }
    )
  }

  return {
    families: [...new Set(views.map((view) => view.family))],
    familyOf: (type) => viewOf(type).family,
    familyColor: (family) => colors.get(family) ?? runtimeFamily.color,
    summarize,
    searchText: (event) => searchText(event, summarize(event)),
  }
}

export const defaultEventCatalog: EventStreamCatalog = createEventCatalog()
