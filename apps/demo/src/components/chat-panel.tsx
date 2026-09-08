import { conversation, tokenUsage, userMessage } from '@looms/agent'
import { decision, pendingApprovals } from '@looms/approval'
import { useProjection, useRunStore } from '@looms/livestore/react'
import { useState } from 'react'
import { ledger } from '../modules/payments'

export function ChatPanel({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const convo = useProjection(store, conversation)
  const usage = useProjection(store, tokenUsage)
  const approvals = useProjection(store, pendingApprovals)
  const charges = useProjection(store, ledger)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const tables = store.getState()
  const rootThreadId =
    [...tables.threads.values()].find((row) => row.parentThreadId === null)?.threadId ??
    tables.runs.get(runId)?.rootThreadId ??
    undefined

  async function send() {
    const content = draft.trim()
    if (!content || !rootThreadId) return
    setPending(true)
    try {
      await store.commit(userMessage(content, { threadId: rootThreadId }))
      setDraft('')
    } finally {
      setPending(false)
    }
  }

  async function decide(approvalId: string, outcome: 'approve' | 'reject') {
    await store.commit(decision(approvalId, outcome))
  }

  return (
    <div className="chat-layout">
      <section className="panel chat-panel">
        <h2>Conversation</h2>
        <div className="chat-log">
          {convo.lines.map((line, index) => (
            <div key={`${line.role}-${index}`} className={`bubble ${line.role}`}>
              <div className="bubble-role">{line.role}</div>
              {line.content ? <div className="bubble-body">{line.content}</div> : null}
              {line.toolCalls && line.toolCalls.length > 0 ? (
                <div className="muted">called {line.toolCalls.map((call) => call.name).join(', ')}</div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="composer">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a follow-up…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send()
            }}
          />
          <button type="button" disabled={pending || draft.trim().length === 0} onClick={() => void send()}>
            Send
          </button>
        </div>
      </section>
      <div className="stack">
        <section className="panel">
          <h2>Approvals</h2>
          {approvals.items.length === 0 ? <p className="muted">None</p> : null}
          {approvals.items.map((item) => (
            <div key={item.approvalId}>
              <div>{item.title}</div>
              <span className={`status ${item.status}`}>{item.status}</span>
              {item.status === 'pending' ? (
                <div className="row tight">
                  <button type="button" className="ok" onClick={() => void decide(item.approvalId, 'approve')}>
                    Approve
                  </button>
                  <button type="button" className="bad" onClick={() => void decide(item.approvalId, 'reject')}>
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Ledger</h2>
          {charges.entries.length === 0 ? <p className="muted">No charges</p> : null}
          {charges.entries.map((entry) => (
            <div key={entry.chargeId}>
              {entry.amount} {entry.currency} · <span className={`status ${entry.status}`}>{entry.status}</span>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Token usage</h2>
          <code>
            in {usage.input} / out {usage.output}
          </code>
        </section>
      </div>
    </div>
  )
}
