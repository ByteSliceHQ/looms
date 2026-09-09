import type { JsonValue } from '@looms/core'
import { cn } from '@/lib/utils'

export function JsonView({ value, className }: { value: JsonValue; className?: string }) {
  return (
    <pre
      className={cn(
        'overflow-auto font-mono text-[11px] leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground',
        className,
      )}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
