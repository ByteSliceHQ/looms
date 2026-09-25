import { ArrowUp, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../lib/cn'
import { Button } from '../ui/button'
import { Kbd } from '../ui/panel'

/**
 * Message input with one primary action. Enter sends, Shift+Enter adds a newline,
 * and `toolbar` holds secondary controls such as delivery mode.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  pending = false,
  disabled = false,
  placeholder = 'Message',
  submitLabel = 'Send',
  toolbar,
  error,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  pending?: boolean
  disabled?: boolean
  placeholder?: string
  submitLabel?: string
  toolbar?: ReactNode
  error?: string | null
  className?: string
}) {
  const canSubmit = !pending && !disabled && value.trim().length > 0

  return (
    <form
      className={cn('border-border shrink-0 border-t p-3', className)}
      onSubmit={(event) => {
        event.preventDefault()

        if (canSubmit) {
          onSubmit()
        }
      }}
    >
      <div className="border-input bg-card focus-within:border-ring/70 focus-within:ring-ring/25 rounded-lg border transition-[border-color,box-shadow] duration-150 focus-within:ring-[3px]">
        <textarea
          data-slot="composer-input"
          value={value}
          rows={1}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()

              if (canSubmit) {
                onSubmit()
              }
            }
          }}
          className="placeholder:text-muted-foreground block field-sizing-content max-h-48 min-h-11 w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-[13px] leading-relaxed outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex h-10 items-center gap-1 pr-1.5 pl-1.5">
          {toolbar}
          <span className="text-muted-foreground ml-auto hidden items-center gap-1 pr-1 text-[10px] @sm:flex">
            <Kbd>↵</Kbd>
            {submitLabel.toLowerCase()}
            <Kbd className="ml-1.5">⇧↵</Kbd>
            newline
          </span>
          <Button
            type="submit"
            size="icon-sm"
            aria-label={submitLabel}
            disabled={!canSubmit}
            className="ml-auto rounded-full @sm:ml-0"
          >
            {pending ? <LoaderCircle className="animate-spin" /> : <ArrowUp />}
          </Button>
        </div>
      </div>
      {error ? <p className="text-status-failed mt-2 px-1 text-[11px]">{error}</p> : null}
    </form>
  )
}
