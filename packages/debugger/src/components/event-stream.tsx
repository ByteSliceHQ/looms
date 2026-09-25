import { useVirtualizer } from '@tanstack/react-virtual'
import { Effect, Fiber } from 'effect'
import { Check, Search, SlidersHorizontal } from 'lucide-react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import type { DebuggerEvent, EventStreamCatalog, ReplayLoader } from '../contracts'
import { defaultEventCatalog } from '../events/catalog'
import { cn, shortId } from '../lib/cn'
import { getEventMeta } from '../lib/event-meta'
import { useVisibleEvents } from '../lib/visible-events'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { EventInspector } from './event-inspector'

const ROW_ESTIMATE = 28
const FOLLOW_THRESHOLD = 24

export function EventStream<TEvent extends DebuggerEvent>({
  events,
  startedAt,
  threadId,
  threadLabel,
  selectedSeq,
  onSelectSeq,
  catalog,
  loadReplayStep,
  renderInspector,
}: {
  events: readonly TEvent[]
  startedAt?: number
  threadId?: string
  threadLabel?: string
  selectedSeq?: number
  onSelectSeq: (seq: number | undefined) => void
  catalog?: EventStreamCatalog<TEvent>
  loadReplayStep?: ReplayLoader
  renderInspector?: (selected: TEvent) => ReactNode
}) {
  const eventCatalog = catalog ?? defaultEventCatalog
  const [query, setQuery] = useState('')
  const [follow, setFollow] = useState(true)
  const [families, setFamilies] = useState(() => new Set(eventCatalog.families))
  const parentRef = useRef<HTMLDivElement>(null)
  const followLock = useRef(false)

  const selected = useMemo(() => {
    if (selectedSeq === undefined) {
      return undefined
    }

    const idx = selectedSeq - 1

    if (idx >= 0 && idx < events.length && events[idx]?.seq === selectedSeq) {
      return events[idx]
    }

    return events.find((event) => event.seq === selectedSeq)
  }, [events, selectedSeq])

  const visible = useVisibleEvents({
    events,
    query,
    families,
    threadId,
    catalog: eventCatalog,
  })

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 16,
    paddingStart: 4,
    paddingEnd: 4,
    getItemKey: (index) => visible[index]?.id ?? index,
    // Avoid flushSync during ref measurement / follow-scroll under high event rates.
    useFlushSync: false,
  })

  useEffect(() => {
    if (!follow || visible.length === 0) {
      return () => undefined
    }

    followLock.current = true

    let followRelease: Fiber.Fiber<void> | undefined

    const rafId = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(visible.length - 1, { align: 'end' })

      followRelease = Effect.runFork(
        Effect.sleep(50).pipe(
          Effect.andThen(
            Effect.sync(() => {
              followLock.current = false
            }),
          ),
        ),
      )
    })

    return () => {
      cancelAnimationFrame(rafId)

      if (followRelease !== undefined) {
        Effect.runFork(Fiber.interrupt(followRelease))
      }

      followLock.current = false
    }
  }, [follow, visible.length, virtualizer])

  const onScroll = useCallback(() => {
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
  }, [follow])

  const toggleFamily = useCallback((family: string) => {
    setFamilies((prev) => {
      const next = new Set(prev)

      if (next.has(family)) {
        next.delete(family)
      } else {
        next.add(family)
      }

      return next
    })
  }, [])

  const hiddenFamilyCount = eventCatalog.families.length - families.size

  return (
    <div className="debugger-event-stream flex h-full min-h-0 flex-col">
      <div className="border-border flex min-h-10 items-center gap-1.5 border-b px-2 py-1.5">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events"
            aria-label="Search events"
            className="h-7 w-full pl-7 text-xs"
          />
        </div>

        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <button
              type="button"
              className="border-input text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 relative inline-flex size-7 shrink-0 items-center justify-center rounded-md border outline-none focus-visible:ring-[3px]"
              aria-label="Filter event families"
            >
              <SlidersHorizontal className="size-3.5" />
              {hiddenFamilyCount > 0 ? (
                <span className="bg-foreground text-background absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full font-mono text-[8px]">
                  {hiddenFamilyCount}
                </span>
              ) : null}
            </button>
          </DropdownMenuPrimitive.Trigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              align="end"
              sideOffset={5}
              className="bg-background text-foreground border-border z-50 min-w-36 rounded-md border p-1 shadow-lg"
            >
              <DropdownMenuPrimitive.Label className="text-muted-foreground px-2 py-1 text-[10px] font-medium tracking-wide uppercase">
                Event families
              </DropdownMenuPrimitive.Label>
              {eventCatalog.families.map((family) => (
                <DropdownMenuPrimitive.CheckboxItem
                  key={family}
                  checked={families.has(family)}
                  onCheckedChange={() => toggleFamily(family)}
                  onSelect={(event) => event.preventDefault()}
                  className="focus:bg-accent relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-7 font-mono text-xs outline-none select-none"
                >
                  <span className="absolute left-2 flex size-3.5 items-center justify-center">
                    <DropdownMenuPrimitive.ItemIndicator>
                      <Check className="size-3" />
                    </DropdownMenuPrimitive.ItemIndicator>
                  </span>
                  {family}
                </DropdownMenuPrimitive.CheckboxItem>
              ))}
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>

        <label className="text-muted-foreground hover:text-foreground flex shrink-0 cursor-pointer items-center gap-1.5 px-1 text-[10px]">
          <Checkbox
            checked={follow}
            onCheckedChange={(checked) => setFollow(checked === true)}
            aria-label="Follow newest events"
          />
          <span className="debugger-follow-label">Follow</span>
        </label>
      </div>
      {threadId ? (
        <div className="border-border text-muted-foreground flex items-center gap-1.5 border-b px-2 py-1 font-mono text-[10px]">
          <span className="text-[9px] tracking-wide uppercase">Thread</span>
          <span className="text-foreground truncate" title={threadId}>
            {threadLabel ?? shortId(threadId)}
          </span>
        </div>
      ) : null}
      <ScrollArea viewportRef={parentRef} className="min-h-32 flex-1" onViewportScroll={onScroll}>
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
                  catalog={eventCatalog}
                  startedAt={startedAt}
                  selected={selectedSeq === event.seq}
                  onSelectSeq={onSelectSeq}
                />
              </div>
            )
          })}
        </div>
      </ScrollArea>
      {selected
        ? (renderInspector?.(selected) ?? (
            <EventInspector event={selected} loadReplayStep={loadReplayStep} />
          ))
        : null}
    </div>
  )
}

interface EventRowProps<TEvent extends DebuggerEvent> {
  event: TEvent
  catalog: EventStreamCatalog<TEvent>
  startedAt?: number
  selected: boolean
  onSelectSeq: (seq: number | undefined) => void
}

function EventRow<TEvent extends DebuggerEvent>({
  event,
  catalog,
  startedAt,
  selected,
  onSelectSeq,
}: EventRowProps<TEvent>) {
  const meta = getEventMeta(event, catalog)
  const offset = startedAt !== undefined ? Math.max(0, event.ts - startedAt) : undefined

  const handleClick = useCallback(() => {
    onSelectSeq(selected ? undefined : event.seq)
  }, [onSelectSeq, selected, event.seq])

  return (
    <button
      type="button"
      onClick={handleClick}
      title={[meta.summary.title, meta.summary.detail].filter(Boolean).join(' — ')}
      className={cn(
        'flex w-full items-start gap-1.5 rounded-sm px-1.5 py-1 text-left font-mono text-[11px]',
        selected ? 'bg-accent' : 'hover:bg-accent/40',
        event.ephemeral && 'opacity-50',
      )}
    >
      <span
        className="mt-1.5 size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: catalog.familyColor(meta.family) }}
      />
      <span className="text-muted-foreground w-6 shrink-0 text-right tabular-nums">
        {event.seq}
      </span>
      <span className="debugger-event-offset text-muted-foreground w-10 shrink-0 text-right tabular-nums">
        {offset !== undefined ? `+${offset}` : ''}
      </span>
      <span className="min-w-0 flex-1 truncate whitespace-nowrap">
        <span className="text-foreground">{meta.summary.title}</span>
        {meta.summary.detail ? (
          <span className="text-muted-foreground ml-1">{meta.summary.detail}</span>
        ) : null}
      </span>
      {event.causationId ? (
        <span className="debugger-event-causation text-muted-foreground shrink-0">
          ← {shortId(event.causationId)}
        </span>
      ) : null}
      {event.threadId ? (
        <span className="debugger-event-thread text-muted-foreground shrink-0">
          {shortId(event.threadId)}
        </span>
      ) : null}
    </button>
  )
}
