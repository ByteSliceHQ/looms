import { useState } from 'react'

import { createEventId, isJsonObject, isJsonString, type EventInput } from '@looms/core'
import {
  compactJson,
  errorMessage,
  inputForm,
  messageInput,
  StartForm,
  useDebugger,
  useStartRun,
  type DebuggerContextValue,
  type WorkspaceContext,
} from '@looms/debugger'
import { createFold, useEventFold, useProjection, useRunStore, useRunSummary } from '@looms/react'

import { conversation } from '../projections'
import { sendAgentSessionMessage, userMessage } from '../signals'
import type { AgentMessageDelivery } from '../types'

function sessionClient(client: DebuggerContextValue['client']) {
  return {
    getRun: (runId: string) => client.getRun(runId).then((result) => result.state),
    signal: (runId: string, events: readonly EventInput[]) => client.signal(runId, events),
  }
}

interface StreamingState {
  lastMessageSeq: number
  turnStarted: boolean
  parts: string[]
}

const streamingFold = createFold<StreamingState>({
  name: 'agentStreamingText',
  initialState: { lastMessageSeq: -1, turnStarted: false, parts: [] },
  includeEphemeral: true,
  reduce(state, event) {
    if (event.type === 'agent.message') {
      return { lastMessageSeq: event.seq, turnStarted: false, parts: [] }
    }

    if (event.seq <= state.lastMessageSeq) {
      return state
    }

    if (event.type === 'agent.turn.started') {
      return { ...state, turnStarted: true }
    }

    if (
      event.type === 'agent.turn.text_delta' &&
      isJsonObject(event.payload) &&
      isJsonString(event.payload.delta)
    ) {
      return {
        ...state,
        turnStarted: true,
        parts: state.parts.concat(event.payload.delta),
      }
    }

    return state
  },
})

function Transcript({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const convo = useProjection(store, conversation)
  const streaming = useEventFold(store, streamingFold)
  const stream = streaming.turnStarted ? streaming.parts.join('') : null

  return (
    <div className="space-y-2">
      {convo.lines.map((line, index) => (
        <div
          key={line.toolCallId ?? `${index}:${line.role}:${line.name ?? ''}`}
          className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm"
        >
          <div className="text-muted-foreground pt-0.5 font-mono text-[10px] tracking-wide uppercase">
            {line.role}
          </div>
          <div className="min-w-0">
            {line.content ? <div className="whitespace-pre-wrap">{line.content}</div> : null}
            {line.toolCalls?.map((call) => (
              <div key={call.id} className="text-muted-foreground mt-1 font-mono text-[11px]">
                {call.name}({compactJson(call.arguments)})
              </div>
            ))}
          </div>
        </div>
      ))}
      {stream !== null ? (
        <div className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
          <div className="text-muted-foreground pt-0.5 font-mono text-[10px] tracking-wide uppercase">
            assistant
          </div>
          <div className={stream.length === 0 ? 'text-muted-foreground' : undefined}>
            {stream.length === 0 ? '…' : stream}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AgentChat(context: WorkspaceContext) {
  const { definition, runId } = context
  const { client } = useDebugger()
  const [draft, setDraft] = useState('')
  const [delivery, setDelivery] = useState<AgentMessageDelivery>('followUp')
  const { start, pending, error } = useStartRun(context)
  const session = definition.kind === 'agent-session'
  const form = inputForm(definition.inputSchema)

  if (!runId && !session && messageInput(form, '') === undefined) {
    return <StartForm {...context} />
  }

  function send() {
    const content = draft.trim()
    const input = session ? null : messageInput(form, content)

    if (!content || input === undefined) {
      return
    }

    setDraft('')

    start(
      input,
      session
        ? (id) => sendAgentSessionMessage(sessionClient(client), id, createEventId(), content)
        : undefined,
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {runId ? (
          <Transcript runId={runId} />
        ) : (
          <p className="text-muted-foreground text-xs">Send a message to start a run.</p>
        )}
      </div>
      {runId ? (
        <FollowUp runId={runId} session={session} delivery={delivery} setDelivery={setDelivery} />
      ) : (
        <form
          className="border-border flex gap-2 border-t p-3"
          onSubmit={(event) => {
            event.preventDefault()
            send()
          }}
        >
          <textarea
            className="border-border bg-background min-h-16 flex-1 rounded border px-2 py-1 text-sm"
            value={draft}
            placeholder="Message"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground h-8 rounded px-3 text-xs"
            disabled={pending || draft.trim().length === 0}
          >
            Start
          </button>
        </form>
      )}
      {error ? <p className="text-status-failed px-3 pb-3 text-xs">{error}</p> : null}
    </div>
  )
}

function FollowUp({
  runId,
  session,
  delivery,
  setDelivery,
}: {
  runId: string
  session: boolean
  delivery: AgentMessageDelivery
  setDelivery: (delivery: AgentMessageDelivery) => void
}) {
  const { client } = useDebugger()
  const store = useRunStore(runId)
  const { rootThreadId } = useRunSummary(store)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function send() {
    const content = draft.trim()

    if (!content || !rootThreadId) {
      return
    }

    setPending(true)
    setError(null)

    const commit = session
      ? sendAgentSessionMessage(sessionClient(client), runId, createEventId(), content, {
          delivery,
          threadId: rootThreadId,
        })
      : store.commit(userMessage(content, { threadId: rootThreadId }))

    commit
      .then(() => setDraft(''))
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setPending(false))
  }

  return (
    <form
      className="border-border space-y-2 border-t p-3"
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
    >
      {session ? (
        <label className="text-muted-foreground flex items-center gap-2 text-[11px]">
          Delivery
          <select
            className="border-border bg-background rounded border px-2 py-1"
            value={delivery}
            onChange={(event) => {
              const value = event.target.value

              if (value === 'followUp' || value === 'steer' || value === 'nextTurn') {
                setDelivery(value)
              }
            }}
          >
            <option value="followUp">follow up</option>
            <option value="steer">steer active turn</option>
            <option value="nextTurn">hold for next turn</option>
          </select>
        </label>
      ) : null}
      <div className="flex gap-2">
        <textarea
          className="border-border bg-background min-h-16 flex-1 rounded border px-2 py-1 text-sm"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground h-8 rounded px-3 text-xs"
          disabled={pending || draft.trim().length === 0 || !rootThreadId}
        >
          Send
        </button>
      </div>
      {error ? <p className="text-status-failed text-xs">{error}</p> : null}
    </form>
  )
}
