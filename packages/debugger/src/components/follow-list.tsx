import { useVirtualizer } from '@tanstack/react-virtual'
import { Effect, Fiber } from 'effect'
import { ArrowDown } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
  type UIEvent,
} from 'react'

import { cn } from '../lib/cn'
import { ScrollArea } from '../ui/scroll-area'

const FOLLOW_THRESHOLD = 24
const USER_INPUT_WINDOW = 400

/**
 * A virtualized list that stays pinned to its newest item while following, stops following
 * when the reader scrolls up, and resumes when they return to the bottom.
 */
export function FollowList<T>({
  items,
  getKey,
  renderItem,
  estimateSize,
  overscan = 8,
  follow: controlledFollow,
  onFollowChange,
  paddingStart = 4,
  paddingEnd = 4,
  className,
  itemClassName,
  empty,
}: {
  items: readonly T[]
  getKey: (item: T, index: number) => string | number
  renderItem: (item: T, index: number) => ReactNode
  estimateSize: number
  overscan?: number
  follow?: boolean
  onFollowChange?: (follow: boolean) => void
  paddingStart?: number
  paddingEnd?: number
  className?: string
  itemClassName?: string
  empty?: ReactNode
}) {
  const [ownFollow, setOwnFollow] = useState(true)
  const follow = controlledFollow ?? ownFollow
  const parentRef = useRef<HTMLDivElement>(null)
  const followLock = useRef(false)
  const lastScrollTop = useRef(0)
  const lastInputAt = useRef(Number.NEGATIVE_INFINITY)

  const setFollow = useCallback(
    (next: boolean) => {
      setOwnFollow(next)
      onFollowChange?.(next)
    },
    [onFollowChange],
  )

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    paddingStart,
    paddingEnd,
    getItemKey: (index) => {
      const item = items[index]
      return item === undefined ? index : getKey(item, index)
    },
    // Avoid flushSync during ref measurement / follow-scroll under high event rates.
    useFlushSync: false,
  })

  const totalSize = virtualizer.getTotalSize()
  const viewportHeight = virtualizer.scrollRect?.height ?? 0

  useEffect(() => {
    const el = parentRef.current

    // Content that shrank to fit (e.g. after filtering) never scrolls, so resume following here.
    if (!follow && el && el.scrollHeight <= el.clientHeight + 1) {
      setFollow(true)
    }

    if (!follow || items.length === 0) {
      return () => undefined
    }

    followLock.current = true

    let followRelease: Fiber.Fiber<void> | undefined

    const rafId = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(items.length - 1, { align: 'end' })

      followRelease = Effect.runFork(
        Effect.sleep(50).pipe(
          Effect.andThen(
            Effect.sync(() => {
              followLock.current = false
            }),
          ),
        ),
      )
    })

    return () => {
      cancelAnimationFrame(rafId)

      if (followRelease !== undefined) {
        Effect.runFork(Fiber.interrupt(followRelease))
      }

      followLock.current = false
    }
  }, [follow, items.length, setFollow, totalSize, viewportHeight, virtualizer])

  const noteInput = useCallback((event: SyntheticEvent) => {
    lastInputAt.current = event.timeStamp
  }, [])

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const el = parentRef.current

      if (!el) {
        return
      }

      // Row measurement also moves scrollTop, so only an upward scroll right after reader input unfollows.
      const movedUp = el.scrollTop < lastScrollTop.current - 1
      const fromReader = event.timeStamp - lastInputAt.current < USER_INPUT_WINDOW
      lastScrollTop.current = el.scrollTop

      if (followLock.current) {
        return
      }

      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD

      if (follow && !atBottom && movedUp && fromReader) {
        setFollow(false)
      } else if (!follow && atBottom) {
        setFollow(true)
      }
    },
    [follow, setFollow],
  )

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      <ScrollArea
        viewportRef={parentRef}
        className="size-full"
        onViewportScroll={onScroll}
        onWheel={noteInput}
        onTouchMove={noteInput}
        onPointerDown={noteInput}
        onKeyDown={noteInput}
      >
        {items.length === 0 && empty !== undefined ? (
          empty
        ) : (
          <div className="relative w-full" style={{ height: totalSize }}>
            {virtualizer.getVirtualItems().map((row) => {
              const item = items[row.index]

              if (item === undefined) {
                return null
              }

              return (
                <div
                  key={row.key}
                  data-index={row.index}
                  ref={virtualizer.measureElement}
                  className={cn('absolute top-0 left-0 w-full', itemClassName)}
                  style={{ transform: `translateY(${row.start}px)` }}
                >
                  {renderItem(item, row.index)}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
      {!follow && items.length > 0 ? (
        <button
          type="button"
          onClick={() => setFollow(true)}
          className="debugger-float-in bg-card/95 text-foreground border-border hover:bg-accent absolute bottom-3 left-1/2 z-20 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium shadow-lg shadow-black/30 backdrop-blur active:scale-[0.97]"
        >
          <ArrowDown className="size-3" />
          Jump to latest
        </button>
      ) : null}
    </div>
  )
}
