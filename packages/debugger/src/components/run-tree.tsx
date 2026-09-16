import { ChevronDown, ChevronRight } from 'lucide-react'
import { memo, useCallback, useState } from 'react'

import type { ThreadNode } from '@looms/core'

import { cn, shortId } from '../lib/cn'
import { statusClass } from '../lib/status'
import { StatusDot } from './status-dot'

interface NodeRowProps {
  node: ThreadNode
  depth: number
  selected?: string
  counts: ReadonlyMap<string, number> | Map<string, number>
  collapsed: ReadonlySet<string>
  onToggle: (id: string) => void
  onSelect: (threadId: string) => void
}

const NodeRow = memo(function NodeRow({
  node,
  depth,
  selected,
  counts,
  collapsed,
  onToggle,
  onSelect,
}: NodeRowProps) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsed.has(node.threadId)
  const count = counts.get(node.threadId) ?? 0

  const handleToggle = useCallback(() => {
    onToggle(node.threadId)
  }, [onToggle, node.threadId])

  const handleSelect = useCallback(() => {
    onSelect(node.threadId)
  }, [onSelect, node.threadId])

  return (
    <li className="relative">
      <div
        className={cn(
          'flex items-center gap-1 rounded-md py-0.5 pr-1 text-xs transition-colors',
          selected === node.threadId ? 'bg-accent font-medium' : 'hover:bg-accent/50',
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground size-4 shrink-0"
            onClick={handleToggle}
            aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
          >
            {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={handleSelect}
        >
          <StatusDot status={node.status} />
          <span className="truncate">
            <span className="text-foreground font-medium">{node.definitionName}</span>
            <span className="text-muted-foreground ml-1 font-mono text-[10px]">({node.kind})</span>
          </span>
          <span className={cn('shrink-0 text-[10px]', statusClass(node.status))}>
            {node.status}
          </span>
          <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[10px]">
            {count}
          </span>
        </button>
      </div>
      {hasChildren && !isCollapsed ? (
        <ul className="relative">
          {node.children.map((child) => (
            <NodeRow
              key={child.threadId}
              node={child}
              depth={depth + 1}
              selected={selected}
              counts={counts}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
})

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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const runCount = totalEventCount ?? eventCounts.get('run') ?? 0

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

  const handleSelectRoot = useCallback(() => {
    onSelectThread(undefined)
  }, [onSelectThread])

  return (
    <div>
      {showHeading && (
        <h2 className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
          Run tree
        </h2>
      )}
      <button
        type="button"
        onClick={handleSelectRoot}
        className={cn(
          'mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs',
          !selectedThread ? 'bg-accent' : 'hover:bg-accent/50',
        )}
      >
        <StatusDot status={runStatus} />
        <span className="truncate font-mono">{formatRunLabel(runId)}</span>
        <span className={cn('ml-auto', statusClass(runStatus))}>{runStatus}</span>
        <span className="text-muted-foreground font-mono text-[10px]">{runCount}</span>
      </button>
      {tree.root ? (
        <ul>
          <NodeRow
            node={tree.root}
            depth={0}
            selected={selectedThread}
            counts={eventCounts}
            collapsed={collapsed}
            onToggle={toggle}
            onSelect={onSelectThread}
          />
        </ul>
      ) : (
        <p className="text-muted-foreground px-2 text-xs">Waiting for threads…</p>
      )}
    </div>
  )
}
