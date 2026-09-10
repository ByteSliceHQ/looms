import { useRecentRuns, type RecentRun } from '@/hooks/use-recent-runs'
import { cn, shortId } from '@/lib/utils'

export function RecentRuns({
  selected,
  onSelect,
}: {
  selected?: string
  onSelect: (run: RecentRun) => void
}) {
  const runs = useRecentRuns()

  if (runs.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
        Recent
      </h2>
      <ul>
        {runs.map((run) => (
          <li key={run.runId}>
            <button
              type="button"
              onClick={() => onSelect(run)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs',
                selected === run.runId ? 'bg-accent' : 'hover:bg-accent/50',
              )}
            >
              <span className="min-w-0 truncate">{run.definitionName}</span>
              <span className="text-muted-foreground ml-auto shrink-0 font-mono">
                {shortId(run.runId)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
