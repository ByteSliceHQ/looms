import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useRun } from '@/hooks/use-run'
import { cn, shortId } from '@/lib/utils'

import type { DemoEvents } from '../../runtime'
import { Input } from '../ui/input'
import { EventInspector } from './event-inspector'
import {
  eventFamily,
  familyClass,
  searchText,
  summarizeEvent,
  type EventFamily,
} from './event-summary'

const FAMILIES: EventFamily[] = ['runtime', 'agent', 'workflow', 'approval', 'payments', 'wait']
const ROW_ESTIMATE = 28
const FOLLOW_THRESHOLD = 24

export function EventStream({
  runId,
  threadId,
  selectedSeq,
  onSelectSeq,
}: {
  runId: string
  threadId?: string
  selectedSeq?: number
  onSelectSeq: (seq: number | undefined) => void
}) {
  const { events, startedAt } = useRun(runId)
  const [query, setQuery] = useState('')
  const [follow, setFollow] = useState(true)
  const [families, setFamilies] = useState<Set<EventFamily>>(new Set(FAMILIES))
  const parentRef = useRef<HTMLDivElement>(null)
  const followLock = useRef(false)
  const selected = events.find((event) => event.seq === selectedSeq)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((event) => {
      if (threadId && event.threadId !== threadId) {
        return false
      }

      if (!families.has(eventFamily(event.type))) {
        return false
      }

      if (q && !searchText(event).includes(q)) {
        return false
      }

      return true
    })
  }, [events, families, query, threadId])

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 16,
    paddingStart: 4,
    paddingEnd: 4,
    getItemKey: (index) => visible[index]?.id ?? index,
  })

  useEffect(() => {
    if (!follow || visible.length === 0) {
      return
    }

    followLock.current = true
    virtualizer.scrollToIndex(visible.length - 1, { align: 'end' })

    const timer = setTimeout(() => {
      followLock.current = false
    }, 80)

    return () => clearTimeout(timer)
  }, [follow, visible.length, virtualizer])

  function onScroll() {
    if (followLock.current) {
      return
    }

    const el = parentRef.current

    if (!el) {
      return
    }

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD

    if (follow && !atBottom) {
      setFollow(false)
    } else if (!follow && atBottom) {
      setFollow(true)
    }
  }

  function toggleFamily(family: EventFamily) {
    setFamilies((prev) => {
      const next = new Set(prev)

      if (next.has(family)) {
        next.delete(family)
      } else {
        next.add(family)
      }

      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5">
        <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          Events
        </span>
        {threadId ? (
          <span className="text-muted-foreground font-mono text-[10px]">
            thr {shortId(threadId)}
          </span>
        ) : null}
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter"
          className="h-7 w-32"
        />
        <div className="flex flex-wrap gap-1">
          {FAMILIES.map((family) => (
            <button
              key={family}
              type="button"
              onClick={() => toggleFamily(family)}
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[10px]',
                families.has(family) ? 'bg-secondary text-foreground' : 'text-muted-foreground',
              )}
            >
              {family}
            </button>
          ))}
        </div>
        <label className="text-muted-foreground ml-auto flex items-center gap-1 text-[11px]">
          <input
            type="checkbox"
            checked={follow}
            onChange={(event) => setFollow(event.target.checked)}
          />
          follow
        </label>
      </div>
      <div ref={parentRef} className="min-h-32 flex-1 overflow-auto" onScroll={onScroll}>
        <div className="relative w-full px-1" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((row) => {
            const event = visible[row.index]

            if (!event) {
              return null
            }

            return (
              <div
                key={event.id}
                data-index={row.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${row.start}px)` }}
              >
                <EventRow
                  event={event}
                  startedAt={startedAt}
                  selected={selectedSeq === event.seq}
                  onSelect={() => onSelectSeq(selectedSeq === event.seq ? undefined : event.seq)}
                />
              </div>
            )
          })}
        </div>
      </div>
      {selected ? <EventInspector runId={runId} event={selected} /> : null}
    </div>
  )
}

function EventRow({
  event,
  startedAt,
  selected,
  onSelect,
}: {
  event: DemoEvents
  startedAt?: number
  selected: boolean
  onSelect: () => void
}) {
  const family = eventFamily(event.type)
  const summary = summarizeEvent(event)
  const offset = startedAt !== undefined ? Math.max(0, event.ts - startedAt) : undefined
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-2 rounded-sm px-1.5 py-1 text-left font-mono text-[11px]',
        selected ? 'bg-accent' : 'hover:bg-accent/40',
        event.ephemeral && 'opacity-50',
      )}
    >
      <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', familyClass(family))} />
      <span className="text-muted-foreground w-7 shrink-0 text-right tabular-nums">
        {event.seq}
      </span>
      <span className="text-muted-foreground w-10 shrink-0 text-right tabular-nums">
        {offset !== undefined ? `+${offset}` : ''}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground">{summary.title}</span>
        {summary.detail ? (
          <span className="text-muted-foreground ml-1">{summary.detail}</span>
        ) : null}
      </span>
      {event.causationId ? (
        <span className="text-muted-foreground shrink-0">← {shortId(event.causationId)}</span>
      ) : null}
      {event.threadId ? (
        <span className="text-muted-foreground shrink-0">{shortId(event.threadId)}</span>
      ) : null}
    </button>
  )
}
