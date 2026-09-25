import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import type { ComponentProps, Ref, UIEventHandler } from 'react'

import { cn } from '../lib/cn'

function ScrollArea({
  className,
  children,
  viewportRef,
  viewportClassName,
  onViewportScroll,
  horizontal = false,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  viewportRef?: Ref<HTMLDivElement>
  viewportClassName?: string
  onViewportScroll?: UIEventHandler<HTMLDivElement>
  horizontal?: boolean
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      type="hover"
      scrollHideDelay={400}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className={cn(
          // Radix wraps content in `display: table`, which lets long lines widen the viewport.
          'size-full overscroll-contain rounded-[inherit] outline-none [&>div]:block!',
          viewportClassName,
        )}
        onScroll={onViewportScroll}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      {horizontal ? <ScrollBar orientation="horizontal" /> : null}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'z-10 flex touch-none p-px transition-opacity duration-150 select-none data-[state=hidden]:opacity-0',
        orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-foreground/15 hover:bg-foreground/25 relative flex-1 rounded-full transition-colors"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
