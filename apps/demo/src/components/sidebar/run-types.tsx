import { Bot, Workflow } from 'lucide-react'
import { catalog, type RunType } from '../../catalog'
import { cn } from '@/lib/utils'

export function RunTypes({
  selected,
  onSelect,
}: {
  selected?: string
  onSelect: (item: RunType) => void
}) {
  return (
    <div>
      <h2 className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Run types
      </h2>
      <ul>
        {catalog.map((item) => {
          const Icon = item.kind === 'agent' ? Bot : Workflow
          const active = item.name === selected
          return (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                  active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
                )}
              >
                <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.kind}
                    {item.kind === 'agent' && item.conversational ? ' · chat' : ''}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
