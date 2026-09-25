import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import * as React from 'react'

import { cn } from '../lib/cn'

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn('flex size-full flex-col overflow-hidden', className)}
      {...props}
    />
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="border-border flex h-10 items-center gap-2 border-b px-3"
    >
      <Search className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'placeholder:text-muted-foreground flex h-full w-full bg-transparent text-[13px] outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-80 scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain p-1',
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('text-muted-foreground py-8 text-center text-xs', className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        '[&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  )
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList }
