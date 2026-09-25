import { DateTime } from 'effect'
import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { RunSummary } from '@looms/core'
import { useRunStore, useRunSummary, useThreadTree } from '@looms/react'

import { StatusDot } from '../components/status-dot'
import { useDebugger } from '../context'
import { errorMessage, shortId } from '../lib/cn'
import { relativeTime, runCreatedAt } from '../lib/time'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Kbd } from '../ui/panel'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

/** The list stays short enough to render eagerly; typing narrows the rest. */
const RESULT_LIMIT = 100

interface IndexedRun {
  readonly run: RunSummary
  readonly createdAt: number
  readonly haystack: string
}

function useRunSummaries(refreshKey: string) {
  const { client } = useDebugger()
  const [runs, setRuns] = useState<readonly RunSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    client.listRunSummaries().then(
      (listed) => {
        if (active) {
          setRuns(listed.runs)
          setError(null)
        }
      },
      (cause: unknown) => {
        if (active) {
          setError(errorMessage(cause))
        }
      },
    )

    return () => {
      active = false
    }
  }, [client, refreshKey])

  return { runs, error }
}

function indexRuns(runs: readonly RunSummary[]): IndexedRun[] {
  const indexed = runs.map((run) => ({
    run,
    createdAt: runCreatedAt(run.runId) ?? 0,
    haystack: [run.definitionName, run.kind, run.status, run.runId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }))

  // ES2022 has no Array#toSorted. `indexed` is a fresh array.
  // oxlint-disable-next-line unicorn/no-array-sort
  return indexed.sort((left, right) => right.createdAt - left.createdAt)
}

function matches(entry: IndexedRun, terms: readonly string[]): boolean {
  return terms.every((term) => entry.haystack.includes(term))
}

function CurrentRun({ runId, fallbackLabel }: { runId: string; fallbackLabel?: string }) {
  const store = useRunStore(runId)
  const { status } = useRunSummary(store)
  const { root } = useThreadTree(store)

  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <StatusDot status={status} />
      <span className="truncate">{root?.definitionName ?? fallbackLabel ?? 'Run'}</span>
      <span className="text-muted-foreground font-mono text-[11px]">{shortId(runId)}</span>
    </span>
  )
}

function useCommandK(onToggle: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onToggle()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onToggle])
}

export function RunSearch({
  runId,
  fallbackLabel,
  onSelectRun,
}: {
  runId?: string
  fallbackLabel?: string
  onSelectRun: (run: RunSummary) => void
}) {
  const [open, setOpen] = useState(false)
  const [viaKeyboard, setViaKeyboard] = useState(false)
  const [query, setQuery] = useState('')
  const { runs, error } = useRunSummaries(`${runId ?? ''}:${open}`)
  const indexed = useMemo(() => indexRuns(runs), [runs])
  const current = runs.find((run) => run.runId === runId)
  const now = open ? DateTime.toEpochMillis(DateTime.nowUnsafe()) : 0

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    const found = terms.length === 0 ? indexed : indexed.filter((entry) => matches(entry, terms))
    return { shown: found.slice(0, RESULT_LIMIT), total: found.length }
  }, [indexed, query])

  const toggleFromKeyboard = useCallback(() => {
    setViaKeyboard(true)
    setOpen((value) => !value)
  }, [])

  useCommandK(toggleFromKeyboard)

  function change(next: boolean) {
    setOpen(next)

    if (!next) {
      setQuery('')
      setViaKeyboard(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={change}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Search runs"
          className="border-input bg-background/40 hover:bg-accent/60 hover:border-ring/40 focus-visible:ring-ring/50 data-[state=open]:border-ring/60 flex h-7 w-80 min-w-0 items-center gap-2 rounded-md border pr-1 pl-2.5 text-left text-xs transition-colors outline-none focus-visible:ring-[3px]"
        >
          <Search className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          {runId ? (
            <CurrentRun runId={runId} fallbackLabel={current?.definitionName ?? fallbackLabel} />
          ) : (
            <span className="text-muted-foreground flex-1 truncate">Search runs…</span>
          )}
          <Kbd>⌘K</Kbd>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[26rem] p-0"
        data-instant={viaKeyboard ? '' : undefined}
      >
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search by name, kind, status or id…"
          />
          <CommandList>
            <CommandEmpty>{error ?? 'No runs match.'}</CommandEmpty>
            {results.shown.length > 0 ? (
              <CommandGroup heading={query ? 'Matches' : 'Recent runs'}>
                {results.shown.map(({ run, createdAt }) => (
                  <CommandItem
                    key={run.runId}
                    value={run.runId}
                    onSelect={() => {
                      onSelectRun(run)
                      change(false)
                    }}
                    className="h-8"
                  >
                    <StatusDot status={run.status} />
                    <span className="min-w-0 truncate font-medium">
                      {run.definitionName ?? shortId(run.runId)}
                    </span>
                    {run.kind ? (
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {run.kind}
                      </span>
                    ) : null}
                    <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[10px]">
                      {shortId(run.runId)}
                    </span>
                    <span className="text-muted-foreground/80 w-14 shrink-0 text-right text-[10px] tabular-nums">
                      {createdAt ? relativeTime(createdAt, now) : ''}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
          <div className="border-border text-muted-foreground flex h-8 items-center gap-3 border-t px-3 text-[10px]">
            <span className="tabular-nums">
              {results.total > results.shown.length
                ? `${results.shown.length} of ${results.total} runs · keep typing to narrow`
                : `${results.total} ${results.total === 1 ? 'run' : 'runs'}`}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd>
              open
            </span>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
