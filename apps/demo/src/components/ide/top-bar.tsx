import { Copy } from 'lucide-react'
import { useCallback } from 'react'

import { statusClass } from '@/lib/status'
import { shortId } from '@/lib/utils'
import { useRunStore, useRunSummary } from '@looms/livestore/react'

import { StatusDot } from '../status-dot'
import { Button } from '../ui/button'

function RunChip({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const live = summary.connection === 'live'

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(runId)
  }, [runId])

  return (
    <div className="flex items-center gap-2 text-xs">
      <StatusDot status={summary.status} />
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono"
        onClick={handleCopy}
        title={runId}
      >
        {shortId(runId)}
        <Copy className="size-3" />
      </button>
      <span className={statusClass(summary.status)}>{summary.status}</span>
      <span
        className={
          live
            ? 'bg-status-completed size-1.5 rounded-full'
            : 'bg-muted-foreground size-1.5 rounded-full'
        }
      />
    </div>
  )
}

export function TopBar({ runId }: { runId?: string }) {
  return (
    <header className="border-border flex h-10 shrink-0 items-center gap-3 border-b px-3">
      <Button variant="link" className="h-auto px-0 text-sm font-medium" asChild>
        <a href="/">Looms</a>
      </Button>
      <div className="ml-auto">{runId ? <RunChip runId={runId} /> : null}</div>
    </header>
  )
}
