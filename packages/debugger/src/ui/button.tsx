import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '../lib/cn'

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
  outline: 'border-input hover:bg-accent hover:text-accent-foreground border bg-transparent',
  ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
  destructive: 'text-muted-foreground hover:bg-status-failed/15 hover:text-status-failed',
} as const

const sizes = {
  xs: 'h-6 gap-1 rounded-sm px-2 text-[11px] [&_svg]:size-3',
  sm: 'h-7 gap-1.5 rounded-md px-2.5 text-xs [&_svg]:size-3.5',
  default: 'h-8 gap-1.5 rounded-md px-3 text-xs [&_svg]:size-3.5',
  'icon-xs': 'size-6 rounded-sm [&_svg]:size-3',
  'icon-sm': 'size-7 rounded-md [&_svg]:size-3.5',
  icon: 'size-8 rounded-md [&_svg]:size-4',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (props.type ?? 'button')}
      className={cn(
        'focus-visible:ring-ring/50 ease-snappy inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap outline-none select-none focus-visible:ring-[3px] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
        'transition-[transform,background-color,color,opacity] duration-150',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export { Button }
