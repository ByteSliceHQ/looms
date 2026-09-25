import type { DebuggerEvent, EventStreamCatalog, EventSummary } from '../contracts'
import { compactJson } from '../lib/cn'
import type { DebuggerPlugin, EventFamilyView } from '../plugin'
import { builtinFamilies, RUNTIME_COLOR } from './builtin-families'
import { summarizeProtocolEvent } from './protocol-summarize'

function pluginSummary(
  plugins: readonly DebuggerPlugin[],
  event: DebuggerEvent,
): EventSummary | undefined {
  for (const plugin of plugins) {
    for (const family of plugin.families ?? []) {
      if (!event.type.startsWith(family.prefix) || !family.summarize) {
        continue
      }

      const summary = family.summarize(event)

      if (summary) {
        return summary
      }
    }
  }

  return undefined
}

function familyNames(views: readonly EventFamilyView[]): string[] {
  const names: string[] = []

  for (const view of views) {
    if (!names.includes(view.family)) {
      names.push(view.family)
    }
  }

  return names
}

export function summarizeEvent(event: DebuggerEvent): EventSummary {
  return (
    summarizeProtocolEvent(event) ?? {
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

export function createEventCatalog<TEvent extends DebuggerEvent = DebuggerEvent>(
  plugins: readonly DebuggerPlugin[] = [],
): EventStreamCatalog<TEvent> {
  const views = [...plugins.flatMap((plugin) => plugin.families ?? []), ...builtinFamilies]
  // ES2022 has no Array#toSorted. `views` is a fresh array.
  // oxlint-disable-next-line unicorn/no-array-sort
  const byPrefix = views.sort((left, right) => right.prefix.length - left.prefix.length)
  const colors = new Map(views.map((view) => [view.family, view.color]))

  function summarize(event: TEvent): EventSummary {
    return (
      summarizeProtocolEvent(event) ??
      pluginSummary(plugins, event) ?? {
        title: event.type,
        detail: compactJson(event.payload),
      }
    )
  }

  return {
    families: familyNames(views),
    familyOf(type) {
      return byPrefix.find((view) => type.startsWith(view.prefix))?.family ?? 'runtime'
    },
    familyColor(family) {
      return colors.get(family) ?? RUNTIME_COLOR
    },
    summarize,
    searchText(event) {
      return searchText(event, summarize)
    },
  }
}

export function createDefaultCatalog<
  TEvent extends DebuggerEvent = DebuggerEvent,
>(): EventStreamCatalog<TEvent> {
  return createEventCatalog([])
}

export const defaultEventCatalog: EventStreamCatalog = createDefaultCatalog()
