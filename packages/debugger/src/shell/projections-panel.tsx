import { ChevronRight, Layers } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { asJson, type JsonValue } from '@looms/core'
import { useRunSelector, useRunStore, type LoomsClientStore } from '@looms/react'

import { JsonTree } from '../components/json-tree'
import { useDebugger } from '../context'
import { cn, errorMessage } from '../lib/cn'
import { projectionFor } from '../plugin'
import { EmptyState, PanelHeader, PanelTitle } from '../ui/panel'
import { ScrollArea } from '../ui/scroll-area'

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <section className="border-border border-b last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="bg-background/95 hover:bg-accent/40 sticky top-0 z-10 flex h-8 w-full items-center gap-1.5 px-3 text-left backdrop-blur"
      >
        <ChevronRight
          aria-hidden
          className={cn(
            'text-muted-foreground ease-snappy size-3 transition-transform duration-100',
            open && 'rotate-90',
          )}
        />
        <h3 className="font-mono text-[11px] font-medium">{title}</h3>
      </button>
      {open ? <div className="px-3 pt-0.5 pb-3">{children}</div> : null}
    </section>
  )
}

function lastDurableSeq(store: LoomsClientStore): number {
  return store.events().reduce((seq, event) => (event.ephemeral ? seq : event.seq), 0)
}

function FetchedProjection({ runId, name }: { runId: string; name: string }) {
  const { client } = useDebugger()
  const durableSeq = useRunSelector(useRunStore(runId), lastDurableSeq)
  const [value, setValue] = useState<JsonValue | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    client.project(runId, name).then(
      (result) => {
        if (active) {
          setValue(asJson(result.value))
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
  }, [client, durableSeq, name, runId])

  if (error) {
    return <p className="text-status-failed text-xs">{error}</p>
  }

  if (value === null) {
    return <p className="text-muted-foreground text-xs">Loading…</p>
  }

  return <JsonTree value={value} defaultExpandDepth={2} />
}

function ProjectionBody({ runId, name }: { runId: string; name: string }) {
  const { plugins } = useDebugger()
  const view = projectionFor(plugins, name)

  if (view) {
    const View = view.component
    return <View runId={runId} />
  }

  return <FetchedProjection runId={runId} name={name} />
}

export function ProjectionsPanel({ runId, names }: { runId?: string; names: readonly string[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader>
        <PanelTitle meta={names.length}>Projections</PanelTitle>
      </PanelHeader>
      {!runId ? (
        <EmptyState icon={<Layers />} title="No run selected">
          Projections fold the run&apos;s event log into live views.
        </EmptyState>
      ) : names.length === 0 ? (
        <EmptyState icon={<Layers />} title="No projections" />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          {names.map((name) => (
            <Section key={name} title={name}>
              <ProjectionBody runId={runId} name={name} />
            </Section>
          ))}
        </ScrollArea>
      )}
    </div>
  )
}
