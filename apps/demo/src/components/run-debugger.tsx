import { useEffect, useMemo, useState } from 'react'
import { createLoomsClient } from '@looms/client'
import { treeFromRun, type EventEnvelope, type ReplayStep, type RunState, type ThreadNode } from '@looms/core'
import { useProjection, useRunStore } from '@looms/livestore/react'
import { conversation } from '@looms/agent'
import { pendingApprovals } from '@looms/approval'
import { ledger } from '../modules/payments'
import type { DemoEvents } from '../runtime'
import { eventFamily, renderEvent } from './event-view'

const client = createLoomsClient()

function Tree({ node, depth = 0 }: { node: ThreadNode; depth?: number }) {
  return (
    <li>
      <code>
        {node.kind}:{node.definitionName}
      </code>{' '}
      <span className={`status ${node.status}`}>{node.status}</span>
      <div className="muted">
        {node.threadId}
        {depth > 0 ? ` · parent ${node.parentThreadId}` : ''}
      </div>
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <Tree key={child.threadId} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function RunDebugger({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  // SAFETY: demo host events are DemoEvents from the composed catalogs.
  const liveEvents = store.events() as DemoEvents[]
  const [fetched, setFetched] = useState<DemoEvents[]>([])
  const events = liveEvents.length > 0 ? liveEvents : fetched
  const approvals = useProjection(store, pendingApprovals)
  const convo = useProjection(store, conversation)
  const charges = useProjection(store, ledger)
  const [state, setState] = useState<RunState | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [step, setStep] = useState<ReplayStep | null>(null)

  useEffect(() => {
    void client.getEvents(runId).then((res) => {
      // SAFETY: host events are DemoEvents from the composed catalogs.
      setFetched(res.events as DemoEvents[])
    })
    void client.getRun(runId).then((res) => setState(res.state))
  }, [runId, liveEvents.length])

  useEffect(() => {
    if (selected === null) {
      setStep(null)
      return
    }
    void client.replayTo(runId, selected).then((res) => {
      // SAFETY: host replay payload is ReplayStep | null.
      setStep(res.step as ReplayStep | null)
    })
  }, [runId, selected])

  const tree = useMemo(() => (state ? treeFromRun(state) : null), [state])
  const grouped = useMemo(() => {
    const map = new Map<string, EventEnvelope[]>()
    for (const event of events) {
      const key = event.threadId ?? 'run'
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
    return map
  }, [events])

  return (
    <div className="debugger">
      <section className="panel">
        <h2>Thread tree</h2>
        {tree?.root ? (
          <ul>
            <Tree node={tree.root} />
          </ul>
        ) : (
          <p className="muted">Waiting for events…</p>
        )}
        <p className="muted">
          {convo.lines.length} conversation lines · {approvals.items.filter((item) => item.status === 'pending').length}{' '}
          pending approvals · {charges.entries.length} ledger rows
        </p>
      </section>
      <section className="panel">
        <h2>Timeline</h2>
        <div className="timeline">
          {[...grouped.entries()].map(([threadId, list]) => (
            <div key={threadId} className="timeline-group">
              <div className="muted">{threadId}</div>
              {list.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`evt family-${eventFamily(event.type)} ${selected === event.seq ? 'newest' : ''}`}
                  onClick={() => setSelected(event.seq)}
                >
                  <span className="seq">{event.seq}</span>
                  <span>
                    <span className="type">{event.type}</span>
                    {event.causationId ? <span className="muted"> ← {event.causationId}</span> : null}
                    {event.type === 'runtime.wait.registered' || event.type === 'runtime.wait.satisfied' ? (
                      <span className="chip">wait</span>
                    ) : null}
                    <div className="payload">
                      {renderEvent(
                        // SAFETY: timeline events come from the same DemoEvents log.
                        event as DemoEvents,
                      )}
                    </div>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Replay</h2>
        {step ? (
          <div className="stack">
            <div>
              <span className="type">{step.event.type}</span> @ {step.seq}
            </div>
            <div>
              <h2>Before</h2>
              <pre className="payload">{JSON.stringify(step.before, null, 2)}</pre>
            </div>
            <div>
              <h2>After</h2>
              <pre className="payload">{JSON.stringify(step.after, null, 2)}</pre>
            </div>
            <div>
              <h2>Effects</h2>
              <pre className="payload">{JSON.stringify(step.effects, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <p className="muted">Click an event to inspect state before/after and emitted effects.</p>
        )}
      </section>
    </div>
  )
}
