import { cn } from '../lib/cn'
import { statusClass, statusDotClass } from '../lib/status'

export function StatusDot({ status }: { status: string }) {
  return <span className={statusDotClass(status)} aria-hidden />
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full bg-current/10 px-2 text-[11px] font-medium',
        statusClass(status),
        className,
      )}
    >
      <StatusDot status={status} />
      {status}
    </span>
  )
}
