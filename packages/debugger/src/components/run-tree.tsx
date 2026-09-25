import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'

import type { ThreadNode } from '@looms/core'

import { cn, shortId } from '../lib/cn'
import { PanelHeader, PanelTitle } from '../ui/panel'
import { ScrollArea } from '../ui/scroll-area'
import { StatusBadge, StatusDot } from './status-dot'

const ROW_HEIGHT = 28
const INDENT = 14

interface FlatNode {
  readonly node: ThreadNode
  readonly depth: number
}

function flatten(root: ThreadNode | null, collapsed: ReadonlySet<string>): FlatNode[] {
  const rows: FlatNode[] = []

  if (!root) {
    return rows
  }

  const stack: FlatNode[] = [{ node: root, depth: 0 }]

  while (stack.length > 0) {
    const next = stack.pop()

    if (!next) {
      break
    }

    rows.push(next)

    if (!collapsed.has(next.node.threadId)) {
      for (let index = next.node.children.length - 1; index >= 0; index--) {
        const child = next.node.children[index]

        if (child) {
          stack.push({ node: child, depth: next.depth + 1 })
        }
      }
    }
  }

  return rows
}

function NodeRow({
  row,
  selected,
  count,
  collapsed,
  onToggle,
  onSelect,
}: {
  row: FlatNode
  selected: boolean
  count: number
  collapsed: boolean
  onToggle: (threadId: string) => void
  onSelect: (threadId: string) => void
}) {
  const { node, depth } = row
  const hasChildren = node.children.length > 0

  return (
    <div
      className={cn(
        'group/row relative flex h-7 items-center rounded-md pr-2 text-xs',
        selected ? 'bg-accent text-foreground' : 'hover:bg-accent/50',
      )}
      style={{ paddingLeft: 4 + depth * INDENT }}
      title={`${node.definitionName} · ${node.kind} · ${node.status}`}
    >
      {Array.from({ length: depth }, (_, level) => (
        <span
          key={level}
          aria-hidden
          className="bg-border absolute inset-y-0 w-px"
          style={{ left: 12 + level * INDENT }}
        />
      ))}
      {hasChildren ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-background/40 flex size-4 shrink-0 items-center justify-center rounded-sm"
          onClick={() => onToggle(node.threadId)}
          aria-label={collapsed ? 'Expand thread' : 'Collapse thread'}
          aria-expanded={!collapsed}
        >
          <ChevronRight
            className={cn(
              'ease-snappy size-3 transition-transform duration-100',
              !collapsed && 'rotate-90',
            )}
          />
        </button>
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <button
        type="button"
        className="flex h-full min-w-0 flex-1 items-center gap-2 pl-1 text-left"
        onClick={() => onSelect(node.threadId)}
      >
        <StatusDot status={node.status} />
        <span className="min-w-0 truncate">
          <span className="font-medium">{node.definitionName}</span>
          <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">{node.kind}</span>
        </span>
        <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[10px] tabular-nums">
          {count}
        </span>
      </button>
    </div>
  )
}

export function RunTree({
  runId,
  runStatus,
  tree,
  eventCounts,
  totalEventCount,
  selectedThread,
  onSelectThread,
  formatRunLabel = shortId,
  showHeading = true,
}: {
  runId: string
  runStatus: string
  tree: { root: ThreadNode | null }
  eventCounts: ReadonlyMap<string, number> | Map<string, number>
  totalEventCount?: number
  selectedThread?: string
  onSelectThread: (threadId: string | undefined) => void
  formatRunLabel?: (runId: string) => string
  showHeading?: boolean
}) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
  const runCount = totalEventCount ?? eventCounts.get('run') ?? 0
  const rows = useMemo(() => flatten(tree.root, collapsed), [tree.root, collapsed])
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    getItemKey: (index) => rows[index]?.node.threadId ?? index,
    useFlushSync: false,
  })

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeading ? (
        <PanelHeader>
          <PanelTitle>Run tree</PanelTitle>
          <StatusBadge status={runStatus} className="ml-auto" />
        </PanelHeader>
      ) : null}
      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={() => onSelectThread(undefined)}
          className={cn(
            'flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs',
            !selectedThread ? 'bg-accent text-foreground' : 'hover:bg-accent/50',
          )}
        >
          <span className="text-muted-foreground">All threads</span>
          <span className="text-muted-foreground/70 truncate font-mono text-[10px]">
            {formatRunLabel(runId)}
          </span>
          <span className="text-muted-foreground ml-auto font-mono text-[10px] tabular-nums">
            {runCount}
          </span>
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-4 py-2 text-xs">Waiting for threads…</p>
      ) : (
        <ScrollArea viewportRef={parentRef} className="min-h-0 flex-1">
          <div className="relative mx-2 mb-2" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index]

              if (!row) {
                return null
              }

              return (
                <div
                  key={item.key}
                  className="absolute top-0 left-0 w-full"
                  style={{ transform: `translateY(${item.start}px)`, height: ROW_HEIGHT }}
                >
                  <NodeRow
                    row={row}
                    selected={selectedThread === row.node.threadId}
                    count={eventCounts.get(row.node.threadId) ?? 0}
                    collapsed={collapsed.has(row.node.threadId)}
                    onToggle={toggle}
                    onSelect={onSelectThread}
                  />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
