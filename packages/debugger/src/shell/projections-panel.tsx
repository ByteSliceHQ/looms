import { useEffect, useState, type ReactNode } from 'react'

import { asJson, type JsonValue } from '@looms/core'
import { useProjection, useRunEvents, useRunStore } from '@looms/react'

import { JsonView } from '../components/json-view'
import { useDebugger } from '../context'
import { projectionFor, type ProjectionView } from '../plugin'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-border border-b px-2 py-2">
      <h3 className="text-muted-foreground mb-1 text-[11px] font-medium tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function ClaimedProjection({ runId, view }: { runId: string; view: ProjectionView<any> }) {
  const store = useRunStore(runId)
  const state = useProjection(store, view.projection)
  const View = view.component

  return <View runId={runId} state={state} />
}

function FetchedProjection({ runId, name }: { runId: string; name: string }) {
  const { client } = useDebugger()
  const store = useRunStore(runId)
  const events = useRunEvents(store)
  const [value, setValue] = useState<JsonValue | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    client
      .project(runId, name)
      .then((result) => {
        if (active) {
          setValue(asJson(result.value))
          setError(null)
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      })

    return () => {
      active = false
    }
  }, [client, events.length, name, runId])

  if (error) {
    return <p className="text-status-failed text-xs">{error}</p>
  }

  if (value === null) {
    return <p className="text-muted-foreground text-xs">Loading…</p>
  }

  return <JsonView value={value} />
}

function ProjectionBody({ runId, name }: { runId: string; name: string }) {
  const { plugins } = useDebugger()
  const view = projectionFor(plugins, name)

  if (view) {
    return <ClaimedProjection runId={runId} view={view} />
  }

  return <FetchedProjection runId={runId} name={name} />
}

export function ProjectionsPanel({ runId, names }: { runId: string; names: readonly string[] }) {
  if (names.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-auto">
        <div className="border-border text-muted-foreground border-b px-2 py-1.5 text-[11px] font-medium tracking-wide uppercase">
          Projections
        </div>
        <p className="text-muted-foreground p-2 text-xs">No projections</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto">
      <div className="border-border text-muted-foreground border-b px-2 py-1.5 text-[11px] font-medium tracking-wide uppercase">
        Projections
      </div>
      {names.map((name) => (
        <Section key={name} title={name}>
          <ProjectionBody runId={runId} name={name} />
        </Section>
      ))}
    </div>
  )
}
