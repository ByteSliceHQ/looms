import { ArrowDownToLine, Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'

import type { DebuggerEvent, EventStreamCatalog, ReplayLoader } from '../contracts'
import { defaultEventCatalog } from '../events/catalog'
import { cn, shortId } from '../lib/cn'
import { getEventMeta } from '../lib/event-meta'
import { useVisibleEvents } from '../lib/visible-events'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { PanelHeader, PanelTitle } from '../ui/panel'
import { EventInspector } from './event-inspector'
import { FollowList } from './follow-list'

const ROW_ESTIMATE = 26

export function EventStream<TEvent extends DebuggerEvent>({
  events,
  startedAt,
  threadId,
  threadLabel,
  onClearThread,
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
  onClearThread?: () => void
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
  const filtered = visible.length !== events.length

  return (
    <div className="debugger-event-stream flex h-full min-h-0 flex-col">
      <PanelHeader className="gap-1.5 pr-2">
        <PanelTitle
          className="hidden @md:flex"
          meta={filtered ? `${visible.length}/${events.length}` : events.length}
        >
          Events
        </PanelTitle>
        <div className="relative ml-auto min-w-0 flex-1 @md:max-w-64">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative"
              aria-label="Filter event families"
            >
              <SlidersHorizontal />
              {hiddenFamilyCount > 0 ? (
                <span className="bg-foreground text-background absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full font-mono text-[8px]">
                  {hiddenFamilyCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Event families</DropdownMenuLabel>
            {eventCatalog.families.map((family) => (
              <DropdownMenuCheckboxItem
                key={family}
                checked={families.has(family)}
                onCheckedChange={() => toggleFamily(family)}
                onSelect={(event) => event.preventDefault()}
                className="font-mono"
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: eventCatalog.familyColor(family) }}
                />
                {family}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={follow}
          aria-label="Follow newest events"
          onClick={() => setFollow(!follow)}
          className="aria-pressed:bg-accent aria-pressed:text-foreground px-2"
        >
          <ArrowDownToLine />
          <span className="hidden @lg:inline">Follow</span>
        </Button>
      </PanelHeader>
      {threadId ? (
        <div className="border-border flex h-8 shrink-0 items-center gap-2 border-b px-3 text-[11px]">
          <span className="text-muted-foreground">Thread</span>
          <span className="bg-accent text-foreground inline-flex h-5 min-w-0 items-center gap-1 rounded-sm pr-0.5 pl-1.5 font-mono">
            <span className="truncate" title={threadId}>
              {threadLabel ?? shortId(threadId)}
            </span>
            {onClearThread ? (
              <button
                type="button"
                aria-label="Show all threads"
                onClick={onClearThread}
                className="text-muted-foreground hover:text-foreground hover:bg-background/60 flex size-4 items-center justify-center rounded-sm"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </span>
        </div>
      ) : null}
      <FollowList
        items={visible}
        getKey={(event) => event.id}
        estimateSize={ROW_ESTIMATE}
        overscan={16}
        follow={follow}
        onFollowChange={setFollow}
        className="min-h-32"
        itemClassName="px-1.5"
        empty={
          <p className="text-muted-foreground p-6 text-center text-xs">
            {events.length === 0 ? 'Waiting for events…' : 'No events match these filters.'}
          </p>
        }
        renderItem={(event) => (
          <EventRow
            event={event}
            catalog={eventCatalog}
            startedAt={startedAt}
            selected={selectedSeq === event.seq}
            onSelectSeq={onSelectSeq}
          />
        )}
      />
      {selected
        ? (renderInspector?.(selected) ?? (
            <EventInspector
              event={selected}
              loadReplayStep={loadReplayStep}
              onClose={() => onSelectSeq(undefined)}
            />
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

  return (
    <button
      type="button"
      onClick={() => onSelectSeq(selected ? undefined : event.seq)}
      title={[meta.summary.title, meta.summary.detail].filter(Boolean).join(' — ')}
      className={cn(
        'flex h-[26px] w-full items-center gap-2 rounded-sm px-1.5 text-left font-mono text-[11px]',
        selected ? 'bg-accent' : 'hover:bg-accent/40',
        event.ephemeral && 'opacity-50',
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: catalog.familyColor(meta.family) }}
      />
      <span className="text-muted-foreground w-7 shrink-0 text-right tabular-nums">
        {event.seq}
      </span>
      <span className="debugger-event-offset text-muted-foreground/70 w-12 shrink-0 text-right tabular-nums">
        {offset !== undefined ? `+${offset}` : ''}
      </span>
      <span className="min-w-0 flex-1 truncate whitespace-nowrap">
        <span className="text-foreground">{meta.summary.title}</span>
        {meta.summary.detail ? (
          <span className="text-muted-foreground ml-1.5">{meta.summary.detail}</span>
        ) : null}
      </span>
      {event.causationId ? (
        <span className="debugger-event-causation text-muted-foreground/70 shrink-0">
          ← {shortId(event.causationId)}
        </span>
      ) : null}
      {event.threadId ? (
        <span className="debugger-event-thread text-muted-foreground/70 shrink-0">
          {shortId(event.threadId)}
        </span>
      ) : null}
    </button>
  )
}
