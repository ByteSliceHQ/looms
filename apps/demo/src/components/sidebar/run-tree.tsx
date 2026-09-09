import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ThreadNode } from '@looms/core'
import { StatusDot } from '../status-dot'
import { useRun } from '@/hooks/use-run'
import { cn, shortId } from '@/lib/utils'
import { statusClass } from '@/lib/status'

function NodeRow({
  node,
  depth,
  selected,
  counts,
  collapsed,
  onToggle,
  onSelect,
}: {
  node: ThreadNode
  depth: number
  selected?: string
  counts: Map<string, number>
  collapsed: Set<string>
  onToggle: (id: string) => void
  onSelect: (threadId: string) => void
}) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsed.has(node.threadId)
  const count = counts.get(node.threadId) ?? 0
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
            className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onToggle(node.threadId)}
          >
            {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={() => onSelect(node.threadId)}
        >
          <StatusDot status={node.status} />
          <span className="truncate">
            <span className="font-medium text-foreground">{node.definitionName}</span>
            <span className="ml-1 text-[10px] text-muted-foreground font-mono">({node.kind})</span>
          </span>
          <span className={cn('shrink-0 text-[10px]', statusClass(node.status))}>{node.status}</span>
          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">{count}</span>
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
}

export function RunTree({
  runId,
  selectedThread,
  onSelectThread,
}: {
  runId: string
  selectedThread?: string
  onSelectThread: (threadId: string | undefined) => void
}) {
  const { tree, status, counts, events } = useRun(runId)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const runCount = counts.get('run') ?? events.length

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <h2 className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Run tree
      </h2>
      <button
        type="button"
        onClick={() => onSelectThread(undefined)}
        className={cn(
          'mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs',
          !selectedThread ? 'bg-accent' : 'hover:bg-accent/50',
        )}
      >
        <StatusDot status={status} />
        <span className="truncate font-mono">{shortId(runId)}</span>
        <span className={cn('ml-auto', statusClass(status))}>{status}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{runCount}</span>
      </button>
      {tree.root ? (
        <ul>
          <NodeRow
            node={tree.root}
            depth={0}
            selected={selectedThread}
            counts={counts}
            collapsed={collapsed}
            onToggle={toggle}
            onSelect={onSelectThread}
          />
        </ul>
      ) : (
        <p className="px-2 text-xs text-muted-foreground">Waiting for threads…</p>
      )}
    </div>
  )
}
