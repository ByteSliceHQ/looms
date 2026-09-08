import { useMemo, useState } from 'react'
import { queries, sendMessage, type EventLogRow, type LoomsStore } from '@looms/livestore/react'
import { Schema } from 'effect'

const TextDeltaPayload = Schema.Struct({
  delta: Schema.String,
})

const TurnStartedPayload = Schema.Struct({
  turn: Schema.Number,
})

const ActorStartedPayload = Schema.Struct({
  maxTurns: Schema.optional(Schema.Number),
})

interface TurnBudget {
  readonly turn: number
  readonly maxTurns: number
}

function decodePayload<A>(schema: Schema.Codec<A, unknown>, json: string): A | undefined {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return undefined
  }
  const decoded = Schema.decodeUnknownExit(schema)(raw)
  return decoded._tag === 'Success' ? decoded.value : undefined
}

function streamingText(events: ReadonlyArray<EventLogRow>): string | null {
  let lastStartedSeq = -1
  for (const evt of events) {
    if (evt.type === 'agent.turn.started') lastStartedSeq = evt.seq
    if (evt.type === 'agent.message' && evt.seq > lastStartedSeq) lastStartedSeq = -1
    if (
      (evt.type === 'actor.completed' || evt.type === 'actor.failed') &&
      evt.seq > lastStartedSeq
    ) {
      lastStartedSeq = -1
    }
  }
  if (lastStartedSeq < 0) return null
  return events
    .filter((evt) => evt.type === 'agent.turn.text_delta' && evt.seq > lastStartedSeq)
    .map((evt) => decodePayload(TextDeltaPayload, evt.payloadJson)?.delta ?? '')
    .join('')
}

function isTurnInFlight(events: ReadonlyArray<EventLogRow>): boolean {
  const last = events.at(-1)
  if (!last) return false
  switch (last.type) {
    case 'agent.turn.started':
    case 'agent.turn.text_delta':
    case 'agent.tool_call.requested':
    case 'tool.result':
    case 'child.spawned':
    case 'workflow.node.started':
    case 'workflow.node.finished':
    case 'agent.message.received':
      return true
    default:
      return false
  }
}

function turnBudget(events: ReadonlyArray<EventLogRow>): TurnBudget {
  let turn = 0
  let maxTurns = 20
  for (const evt of events) {
    if (evt.type === 'actor.started') {
      const payload = decodePayload(ActorStartedPayload, evt.payloadJson)
      if (payload?.maxTurns !== undefined) maxTurns = payload.maxTurns
    }
    if (evt.type === 'agent.turn.started') {
      const payload = decodePayload(TurnStartedPayload, evt.payloadJson)
      if (payload) turn = payload.turn
    }
  }
  return { turn, maxTurns }
}

export function ChatPanel({ store }: { store: LoomsStore }) {
  const messages = store.useQuery(queries.messages)
  const events = store.useQuery(queries.events)
  const actors = store.useQuery(queries.actors)
  const [draft, setDraft] = useState('')
  const actor = actors[0]
  const status = actor?.status ?? null
  const stream = useMemo(() => streamingText(events), [events])
  const busy = isTurnInFlight(events)
  const budget = useMemo(() => turnBudget(events), [events])

  function onSend() {
    const text = draft.trim()
    if (!text || busy) return
    sendMessage(store, text)
    setDraft('')
  }

  return (
    <section className="panel chat-panel">
      <div className="row">
        <h2>Chat</h2>
        <span className={`status ${status ?? ''}`}>status: {status ?? '—'}</span>
        <span className="muted">
          turn {budget.turn} / {budget.maxTurns}
        </span>
      </div>
      <div className="chat-log">
        {messages.length === 0 && stream === null ? (
          <p className="muted">Send a message to start the turn.</p>
        ) : (
          messages.map((message) => {
            if (message.role === 'tool') {
              return (
                <div className="chip" key={message.id}>
                  <strong>{message.name ?? 'tool'}</strong> {message.content}
                </div>
              )
            }
            if (message.role === 'system') return null
            return (
              <div className={`bubble ${message.role}`} key={message.id}>
                <div className="bubble-role">{message.role}</div>
                <div className="bubble-body">{message.content || '…'}</div>
              </div>
            )
          })
        )}
        {stream !== null ? (
          <div className="bubble assistant streaming">
            <div className="bubble-role">assistant</div>
            <div className="bubble-body">{stream || 'Thinking…'}</div>
          </div>
        ) : null}
      </div>
      <div className="composer">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={busy ? 'Waiting for the actor…' : 'Message the assistant'}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend()
          }}
        />
        <button type="button" disabled={busy || draft.trim().length === 0} onClick={onSend}>
          Send
        </button>
      </div>
    </section>
  )
}
