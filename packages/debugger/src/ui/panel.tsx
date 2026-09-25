import type { ComponentProps, ReactNode } from 'react'

import { cn } from '../lib/cn'

/** Every panel header shares this height so the columns read as one surface. */
function PanelHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-header"
      className={cn('border-border flex h-10 shrink-0 items-center gap-2 border-b px-3', className)}
      {...props}
    />
  )
}

function PanelTitle({
  className,
  children,
  meta,
  ...props
}: ComponentProps<'h2'> & { meta?: ReactNode }) {
  return (
    <h2
      data-slot="panel-title"
      className={cn('flex min-w-0 items-baseline gap-2 text-[13px] font-medium', className)}
      {...props}
    >
      <span className="truncate">{children}</span>
      {meta !== undefined && meta !== null ? (
        <span className="text-muted-foreground shrink-0 font-mono text-[11px] font-normal tabular-nums">
          {meta}
        </span>
      ) : null}
    </h2>
  )
}

function EmptyState({
  icon,
  title,
  children,
  className,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-32 flex-col items-center justify-center gap-2 px-6 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="text-muted-foreground/70 border-border bg-card mb-1 flex size-8 items-center justify-center rounded-lg border [&_svg]:size-4">
          {icon}
        </div>
      ) : null}
      <p className="text-foreground text-[13px] font-medium">{title}</p>
      {children ? (
        <p className="text-muted-foreground max-w-60 text-xs leading-relaxed">{children}</p>
      ) : null}
    </div>
  )
}

function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'border-border bg-background/60 text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-sans text-[10px] font-medium',
        className,
      )}
      {...props}
    />
  )
}

export { EmptyState, Kbd, PanelHeader, PanelTitle }
