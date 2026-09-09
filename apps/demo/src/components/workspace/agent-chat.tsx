import { useMemo, useState } from 'react'
import { conversation, userMessage } from '@looms/agent'
import { createRunId } from '@looms/core'
import { useProjection } from '@looms/livestore/react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import type { AgentRunType } from '../../catalog'
import { rememberRun } from '@/hooks/use-recent-runs'
import { useRun } from '@/hooks/use-run'
import { loomsClient } from '@/lib/looms-client'
import { cn, compactJson } from '@/lib/utils'
import type { DemoEvents } from '../../runtime'

function streamingText(events: DemoEvents[]): string | null {
  let lastMessage = -1
  for (const event of events) {
    if (event.type === 'agent.message') lastMessage = event.seq
  }
  const deltas: string[] = []
  let turnStarted = false
  for (const event of events) {
    if (event.seq <= lastMessage) continue
    if (event.type === 'agent.turn.started') turnStarted = true
    if (event.type === 'agent.turn.text_delta') deltas.push(event.payload.delta)
  }
  if (deltas.length > 0) return deltas.join('')
  return turnStarted ? '' : null
}

function Transcript({ runId }: { runId: string }) {
  const { store, events } = useRun(runId)
  const convo = useProjection(store, conversation)
  const stream = useMemo(() => streamingText(events), [events])

  return (
    <div className="space-y-2">
      {convo.lines.map((line, index) => (
        <div key={`${line.role}-${index}`} className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
          <div className="pt-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {line.role}
          </div>
          <div className="min-w-0">
            {line.role === 'tool' ? (
              <Collapsible>
                <CollapsibleTrigger className="text-[11px] text-muted-foreground hover:text-foreground">
                  {line.name ?? 'result'}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-1 font-mono text-[11px] whitespace-pre-wrap text-muted-foreground">
                    {line.content}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                {line.content ? <div className="whitespace-pre-wrap">{line.content}</div> : null}
                {line.toolCalls?.map((call) => (
                  <div key={call.id} className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {call.name}({compactJson(call.arguments)})
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ))}
      {stream !== null ? (
        <div className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
          <div className="pt-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            assistant
          </div>
          <div className={cn('whitespace-pre-wrap', stream.length === 0 && 'text-muted-foreground')}>
            {stream.length === 0 ? '…' : stream}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Composer({
  draft,
  pending,
  disabled,
  canSend,
  placeholder,
  submitLabel,
  onDraft,
  onSubmit,
}: {
  draft: string
  pending: boolean
  disabled: boolean
  canSend: boolean
  placeholder: string
  submitLabel: string
  onDraft: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="flex gap-2">
      <Textarea
        rows={2}
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (canSend) onSubmit()
          }
        }}
      />
      <Button type="button" disabled={pending || !canSend} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  )
}

function FollowUpComposer({
  runId,
  type,
  draft,
  pending,
  setDraft,
  onError,
  onSent,
  setPending,
}: {
  runId: string
  type: AgentRunType
  draft: string
  pending: boolean
  setDraft: (value: string) => void
  onError: (value: string | null) => void
  onSent: () => void
  setPending: (value: boolean) => void
}) {
  const { store, rootThreadId } = useRun(runId)
  const canFollowUp = type.conversational && Boolean(rootThreadId)
  const canSend = draft.trim().length > 0 && canFollowUp

  async function send() {
    const content = draft.trim()
    if (!content || !rootThreadId) return
    setPending(true)
    onError(null)
    try {
      await store.commit(userMessage(content, { threadId: rootThreadId }))
      onSent()
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <Composer
      draft={draft}
      pending={pending}
      disabled={!canFollowUp}
      canSend={canSend}
      placeholder={canFollowUp ? type.placeholder : 'Single-turn run. Start a new run to send again.'}
      submitLabel="Send"
      onDraft={setDraft}
      onSubmit={() => void send()}
    />
  )
}

export function AgentChat({
  type,
  runId,
  onStarted,
  onReset,
}: {
  type: AgentRunType
  runId?: string
  onStarted: (runId: string) => void
  onReset: () => void
}) {
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    const content = draft.trim()
    if (!content) return
    setPending(true)
    setError(null)
    const nextRunId = createRunId()
    rememberRun({
      runId: nextRunId,
      definitionName: type.name,
      kind: type.kind,
      startedAt: Date.now(),
    })
    setDraft('')
    onStarted(nextRunId)
    try {
      await loomsClient.startRun({
        kind: type.kind,
        definitionName: type.def.name,
        input: type.toInput(content),
        runId: nextRunId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-medium">{type.label}</h2>
        <p className="text-xs text-muted-foreground">{type.description}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {runId ? (
          <Transcript runId={runId} />
        ) : (
          <p className="text-xs text-muted-foreground">Send a message to start a run.</p>
        )}
      </div>
      <div className="border-t border-border p-3">
        {runId ? (
          <FollowUpComposer
            runId={runId}
            type={type}
            draft={draft}
            pending={pending}
            setDraft={setDraft}
            onError={setError}
            onSent={() => setDraft('')}
            setPending={setPending}
          />
        ) : (
          <Composer
            draft={draft}
            pending={pending}
            disabled={false}
            canSend={draft.trim().length > 0}
            placeholder={type.placeholder}
            submitLabel="Start"
            onDraft={setDraft}
            onSubmit={() => void start()}
          />
        )}
        {runId && !type.conversational ? (
          <button
            type="button"
            className="mt-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={onReset}
          >
            Start a new run
          </button>
        ) : null}
        {error ? <p className="mt-2 text-xs text-status-failed">{error}</p> : null}
      </div>
    </div>
  )
}
