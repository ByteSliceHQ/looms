import { Bot, Workflow } from 'lucide-react'

import { cn } from '@/lib/utils'

import { catalog, type RunType } from '../../catalog'

export function RunTypes({
  selected,
  onSelect,
}: {
  selected?: string
  onSelect: (item: RunType) => void
}) {
  return (
    <div>
      <h2 className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
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
                <Icon className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="text-muted-foreground block truncate text-[11px]">
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
