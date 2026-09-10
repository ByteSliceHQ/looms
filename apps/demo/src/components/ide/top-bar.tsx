import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useRun } from '@/hooks/use-run'
import { statusClass } from '@/lib/status'
import { shortId } from '@/lib/utils'

import { StatusDot } from '../status-dot'
import { Button } from '../ui/button'

function RunChip({ runId }: { runId: string }) {
  const { status, store } = useRun(runId)
  const [live, setLive] = useState(false)

  useEffect(() => {
    return store.subscribe(() => setLive(true))
  }, [store])

  return (
    <div className="flex items-center gap-2 text-xs">
      <StatusDot status={status} />
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono"
        onClick={() => void navigator.clipboard.writeText(runId)}
        title={runId}
      >
        {shortId(runId)}
        <Copy className="size-3" />
      </button>
      <span className={statusClass(status)}>{status}</span>
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
      <span className="text-muted-foreground text-xs">demo</span>
      <div className="ml-auto">{runId ? <RunChip runId={runId} /> : null}</div>
    </header>
  )
}
