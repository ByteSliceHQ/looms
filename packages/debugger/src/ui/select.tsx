import { Check, ChevronDown } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../lib/cn'

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground flex h-7 items-center gap-1 rounded-md px-2 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-3 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          'debugger-pop bg-card text-card-foreground border-border z-50 min-w-40 overflow-hidden rounded-lg border p-1 shadow-xl shadow-black/30',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  description,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { description?: string }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'focus:bg-accent relative flex cursor-default flex-col items-start rounded-sm py-1.5 pr-2 pl-7 text-xs outline-none select-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute top-2 left-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-3.5" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {description ? (
        <span className="text-muted-foreground text-[11px]">{description}</span>
      ) : null}
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
