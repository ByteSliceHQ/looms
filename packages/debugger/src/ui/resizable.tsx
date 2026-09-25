import type { ComponentProps } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'

import { cn } from '../lib/cn'

function ResizablePanelGroup({ className, ...props }: ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn('flex size-full aria-[orientation=vertical]:flex-col', className)}
      {...props}
    />
  )
}

function ResizablePanel(props: ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />
}

/** A hairline divider with a wider invisible hit area that brightens while hovered or dragged. */
function ResizableHandle({ className, ...props }: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        'bg-border relative w-px shrink-0 outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2',
        'data-[separator=active]:bg-ring data-[separator=focus]:bg-ring data-[separator=hover]:bg-ring/60 transition-colors duration-150',
        className,
      )}
      {...props}
    />
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
