import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { asJson, type JsonValue, type ReplayStep } from '@looms/core'

import type { DebuggerEvent, ReplayLoader } from '../contracts'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { JsonTree } from './json-tree'

function Pane({ value, children }: { value: string; children: ReactNode }) {
  return (
    <TabsContent value={value} className="min-h-0">
      <ScrollArea className="h-full">
        <div className="px-3 pb-3">{children}</div>
      </ScrollArea>
    </TabsContent>
  )
}

function StepJson({
  step,
  pick,
}: {
  step: ReplayStep | null
  pick: (step: ReplayStep) => JsonValue
}) {
  return step ? (
    <JsonTree value={pick(step)} defaultExpandDepth={2} />
  ) : (
    <p className="text-muted-foreground text-xs">Loading…</p>
  )
}

export function EventInspector({
  event,
  loadReplayStep,
  onClose,
}: {
  event: DebuggerEvent
  loadReplayStep?: ReplayLoader
  onClose?: () => void
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
    <div className="border-border bg-sidebar flex h-[45%] min-h-40 shrink-0 flex-col border-t">
      <Tabs defaultValue="payload" className="min-h-0 flex-1 gap-0">
        <div className="flex h-10 shrink-0 items-center gap-2 pr-2 pl-3">
          <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
            #{event.seq}
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{event.type}</span>
          <TabsList>
            <TabsTrigger value="payload">Payload</TabsTrigger>
            <TabsTrigger value="envelope">Envelope</TabsTrigger>
            {canReplay ? <TabsTrigger value="state">State</TabsTrigger> : null}
            {canReplay ? <TabsTrigger value="effects">Effects</TabsTrigger> : null}
          </TabsList>
          {onClose ? (
            <Button variant="ghost" size="icon-sm" aria-label="Close inspector" onClick={onClose}>
              <X />
            </Button>
          ) : null}
        </div>
        <Pane value="payload">
          <JsonTree value={event.payload} defaultExpandDepth={2} />
        </Pane>
        <Pane value="envelope">
          <JsonTree
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
        </Pane>
        {canReplay ? (
          <Pane value="state">
            <div className="grid gap-3">
              <section>
                <h4 className="text-muted-foreground mb-1 text-[11px] font-medium">Before</h4>
                <StepJson step={step} pick={(loaded) => asJson(loaded.before)} />
              </section>
              <section>
                <h4 className="text-muted-foreground mb-1 text-[11px] font-medium">After</h4>
                <StepJson step={step} pick={(loaded) => asJson(loaded.after)} />
              </section>
            </div>
          </Pane>
        ) : null}
        {canReplay ? (
          <Pane value="effects">
            <StepJson step={step} pick={(loaded) => asJson(loaded.effects)} />
          </Pane>
        ) : null}
      </Tabs>
    </div>
  )
}
