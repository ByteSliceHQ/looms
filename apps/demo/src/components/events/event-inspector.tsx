import { useEffect, useState } from 'react'
import { asJson, type ReplayStep } from '@looms/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { JsonView } from '../json-view'
import { loomsClient } from '@/lib/looms-client'
import type { DemoEvents } from '../../runtime'

export function EventInspector({ runId, event }: { runId: string; event: DemoEvents }) {
  const [step, setStep] = useState<ReplayStep | null>(null)

  useEffect(() => {
    let cancelled = false
    void loomsClient.replayTo(runId, event.seq).then((res) => {
      if (cancelled) return
      // SAFETY: host replay payload is ReplayStep | null.
      setStep(res.step as ReplayStep | null)
    })
    return () => {
      cancelled = true
    }
  }, [runId, event.seq])

  return (
    <div className="flex max-h-[45%] min-h-0 shrink-0 flex-col border-t border-border">
      <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-mono">{event.seq}</span>
        <span className="truncate font-mono text-foreground">{event.type}</span>
      </div>
      <Tabs defaultValue="payload" className="min-h-0 flex-1 px-3 pb-2">
        <TabsList>
          <TabsTrigger value="payload">Payload</TabsTrigger>
          <TabsTrigger value="envelope">Envelope</TabsTrigger>
          <TabsTrigger value="before">Before</TabsTrigger>
          <TabsTrigger value="after">After</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
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
        <TabsContent value="before" className="overflow-auto">
          {step ? <JsonView value={asJson(step.before)} /> : <p className="text-xs text-muted-foreground">Loading…</p>}
        </TabsContent>
        <TabsContent value="after" className="overflow-auto">
          {step ? <JsonView value={asJson(step.after)} /> : <p className="text-xs text-muted-foreground">Loading…</p>}
        </TabsContent>
        <TabsContent value="effects" className="overflow-auto">
          {step ? <JsonView value={asJson(step.effects)} /> : <p className="text-xs text-muted-foreground">Loading…</p>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
