import { useEffect, useState } from 'react'

import { asJson, type ReplayStep } from '@looms/core'

import type { DebuggerEvent, ReplayLoader } from '../contracts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { JsonView } from './json-view'

export function EventInspector({
  event,
  loadReplayStep,
}: {
  event: DebuggerEvent
  loadReplayStep?: ReplayLoader
}) {
  const [step, setStep] = useState<ReplayStep | null>(null)
  const canReplay = loadReplayStep !== undefined

  useEffect(() => {
    if (!loadReplayStep) {
      setStep(null)
      return () => undefined
    }

    let cancelled = false

    void loadReplayStep({ runId: event.runId, seq: event.seq }).then((next) => {
      if (!cancelled) {
        setStep(next)
      }
    })

    return () => {
      cancelled = true
    }
  }, [event.runId, event.seq, loadReplayStep])

  return (
    <div className="border-border flex max-h-[45%] min-h-0 shrink-0 flex-col border-t">
      <div className="text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-[11px]">
        <span className="font-mono">{event.seq}</span>
        <span className="text-foreground truncate font-mono">{event.type}</span>
      </div>
      <Tabs defaultValue="payload" className="min-h-0 flex-1 px-3 pb-2">
        <TabsList>
          <TabsTrigger value="payload">Payload</TabsTrigger>
          <TabsTrigger value="envelope">Envelope</TabsTrigger>
          {canReplay ? <TabsTrigger value="before">Before</TabsTrigger> : null}
          {canReplay ? <TabsTrigger value="after">After</TabsTrigger> : null}
          {canReplay ? <TabsTrigger value="effects">Effects</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="payload" className="overflow-auto">
          <JsonView value={event.payload} />
        </TabsContent>
        <TabsContent value="envelope" className="overflow-auto">
          <JsonView
            value={asJson({
              id: event.id,
              runId: event.runId,
              seq: event.seq,
              ts: event.ts,
              type: event.type,
              threadId: event.threadId,
              parentThreadId: event.parentThreadId ?? null,
              causationId: event.causationId ?? null,
              correlationId: event.correlationId ?? null,
              effectId: event.effectId ?? null,
              origin: event.origin,
              ephemeral: event.ephemeral ?? false,
            })}
          />
        </TabsContent>
        {canReplay ? (
          <TabsContent value="before" className="overflow-auto">
            {step ? (
              <JsonView value={asJson(step.before)} />
            ) : (
              <p className="text-muted-foreground text-xs">Loading…</p>
            )}
          </TabsContent>
        ) : null}
        {canReplay ? (
          <TabsContent value="after" className="overflow-auto">
            {step ? (
              <JsonView value={asJson(step.after)} />
            ) : (
              <p className="text-muted-foreground text-xs">Loading…</p>
            )}
          </TabsContent>
        ) : null}
        {canReplay ? (
          <TabsContent value="effects" className="overflow-auto">
            {step ? (
              <JsonView value={asJson(step.effects)} />
            ) : (
              <p className="text-muted-foreground text-xs">Loading…</p>
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
