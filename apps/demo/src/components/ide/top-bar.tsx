import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { StatusDot } from '../status-dot'
import { Button } from '../ui/button'
import { useRun } from '@/hooks/use-run'
import { shortId } from '@/lib/utils'
import { statusClass } from '@/lib/status'

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
        className="flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground"
        onClick={() => void navigator.clipboard.writeText(runId)}
        title={runId}
      >
        {shortId(runId)}
        <Copy className="size-3" />
      </button>
      <span className={statusClass(status)}>{status}</span>
      <span className={live ? 'size-1.5 rounded-full bg-status-completed' : 'size-1.5 rounded-full bg-muted-foreground'} />
    </div>
  )
}

export function TopBar({ runId }: { runId?: string }) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-3 border-b border-border px-3">
      <Button variant="link" className="h-auto px-0 text-sm font-medium" asChild>
        <a href="/">Looms</a>
      </Button>
      <span className="text-xs text-muted-foreground">demo</span>
      <div className="ml-auto">{runId ? <RunChip runId={runId} /> : null}</div>
    </header>
  )
}
