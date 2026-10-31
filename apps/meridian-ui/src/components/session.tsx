import { useMemo, useState } from 'react'

import { OrderClosed } from '@looms/meridian'
import { isJsonObject, isJsonString } from '@swirls/looms/core'
import { defineLiveFold, useLiveFold, useRunEvents, useRunStore } from '@swirls/looms/react'

import { decideApproval, haltSession, replayTo, resumeSession } from '../api'
import { clock, signed } from '../format'
import { Equity } from './ladder'

const emptyCurve: { x: number; y: number }[] = []

const tape = defineLiveFold({
  name: 'meridianTape',
  initialState: { points: emptyCurve, cash: 0, position: 0 },
  reduce(state, event) {
    if (event.type !== 'execution.order.closed') {
      return state
    }

    const parsed = OrderClosed.safeParse(event.payload)

    if (!parsed.success) {
      return state
    }

    return {
      cash: parsed.data.cash,
      position: parsed.data.position,
      points: state.points.concat({
        x: event.seq,
        y: parsed.data.cash + parsed.data.position * parsed.data.price,
      }),
    }
  },
})

export function SessionDesk({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const events = useRunEvents(store)
  const folded = useLiveFold(store, tape)
  const [scrub, setScrub] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')
  const last = events.at(-1)?.seq ?? 1
  const visibleSeq = scrub ?? last
  const visible = events.filter((event) => event.seq <= visibleSeq)

  const approvals = useMemo(
    () =>
      visible.flatMap((event) => {
        if (
          event.type !== 'approval.requested' ||
          !isJsonObject(event.payload) ||
          !isJsonString(event.payload.approvalId)
        ) {
          return []
        }

        const approvalId = event.payload.approvalId
        const title = isJsonString(event.payload.title) ? event.payload.title : 'Approval'

        const decided = visible.some(
          (later) =>
            later.type === 'approval.decided' &&
            isJsonObject(later.payload) &&
            later.payload.approvalId === approvalId,
        )

        return decided ? [] : [{ approvalId, title }]
      }),
    [visible],
  )

  return (
    <section className="session">
      <div className="row">
        <button
          type="button"
          onClick={() =>
            haltSession(runId).then(
              () => undefined,
              (error: Error) => setNote(error.message),
            )
          }
        >
          Halt
        </button>
        <button
          type="button"
          onClick={() =>
            resumeSession(runId).then(
              (next) => {
                window.location.assign(`/sessions/${next.runId}`)
              },
              (error: Error) => setNote(error.message),
            )
          }
        >
          Resume
        </button>
        <span className="muted">
          pos {folded.position} · equity {signed(folded.points.at(-1)?.y ?? folded.cash)}
        </span>
      </div>
      {note ? <p className="banner">{note}</p> : null}
      <Equity points={folded.points.filter((point) => point.x <= visibleSeq)} />
      <label className="scrub">
        Replay
        <input
          type="range"
          min={1}
          max={Math.max(last, 1)}
          value={visibleSeq}
          onChange={(event) => {
            const seq = Number(event.target.value)
            setScrub(seq)
            void replayTo(runId, seq)
          }}
        />
        <span>{visibleSeq}</span>
      </label>
      {approvals.map((approval) => (
        <div key={approval.approvalId} className="gate">
          <strong>{approval.title}</strong>
          <button
            type="button"
            onClick={() => decideApproval(runId, approval.approvalId, 'approve')}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => decideApproval(runId, approval.approvalId, 'reject')}
          >
            Reject
          </button>
        </div>
      ))}
      <ol className="rail">
        {visible.slice(-40).map((event) => (
          <li key={event.seq}>
            <span>{event.seq}</span>
            <code>{event.type}</code>
            <time>{clock(event.ts)}</time>
          </li>
        ))}
      </ol>
    </section>
  )
}
