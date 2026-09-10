import { cn } from '@/lib/utils'
import type { JsonValue } from '@looms/core'

export function JsonView({ value, className }: { value: JsonValue; className?: string }) {
  return (
    <pre
      className={cn(
        'text-muted-foreground overflow-auto font-mono text-[11px] leading-relaxed wrap-break-word whitespace-pre-wrap',
        className,
      )}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
