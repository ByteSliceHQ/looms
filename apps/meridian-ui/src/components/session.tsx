import { useMemo, useState } from 'react'

import { OrderClosed, SIM_LIMITS } from '@looms/meridian'
import { isJsonObject, isJsonString, type JsonValue } from '@swirls/looms/core'
import { defineLiveFold, useLiveFold, useRunEvents, useRunStore } from '@swirls/looms/react'

import { decideApproval, haltSession, replayTo, resumeSession } from '../api'
import { clock, price, signed, size } from '../format'
import { Equity } from './ladder'

const steps = ['observe', 'signal', 'risk', 'review', 'execute', 'grade', 'pace'] as const

type Step = (typeof steps)[number]
type StepState = 'idle' | 'started' | 'finished'

interface Cycle {
  readonly index: number
  readonly steps: Record<Step, StepState>
}

interface FillRow {
  readonly seq: number
  readonly symbol: string
  readonly side: string
  readonly qty: number
  readonly price: number
  readonly slippageBps: number
  readonly status: string
  readonly grade: string
}

interface DeskView {
  readonly points: { x: number; y: number }[]
  readonly cash: number
  readonly position: number
  readonly cycles: Cycle[]
  readonly fills: FillRow[]
  readonly risk: { readonly outcome: string; readonly reason: string }
}

const emptySteps = (): Record<Step, StepState> => ({
  observe: 'idle',
  signal: 'idle',
  risk: 'idle',
  review: 'idle',
  execute: 'idle',
  grade: 'idle',
  pace: 'idle',
})

const emptyView: DeskView = {
  points: [],
  cash: 0,
  position: 0,
  cycles: [],
  fills: [],
  risk: { outcome: 'passed', reason: 'no check yet' },
}

function isStep(value: string): value is Step {
  return steps.some((step) => step === value)
}

function nodeId(payload: JsonValue): string | undefined {
  if (!isJsonObject(payload) || !isJsonString(payload.nodeId)) {
    return undefined
  }

  return payload.nodeId
}

function reduceView(
  state: DeskView,
  event: { type: string; seq: number; payload: JsonValue },
): DeskView {
  const id = nodeId(event.payload)

  if (event.type === 'workflow.node.started' && id !== undefined && isStep(id)) {
    const cycles =
      id === 'observe'
        ? state.cycles.concat({ index: state.cycles.length, steps: emptySteps() })
        : state.cycles

    const current = cycles.at(-1)

    if (!current) {
      return state
    }

    const next = cycles.slice(0, -1).concat({
      ...current,
      steps: { ...current.steps, [id]: 'started' },
    })

    return { ...state, cycles: next }
  }

  if (event.type === 'workflow.node.finished' && id !== undefined && isStep(id)) {
    const current = state.cycles.at(-1)

    if (!current) {
      return state
    }

    return {
      ...state,
      cycles: state.cycles.slice(0, -1).concat({
        ...current,
        steps: { ...current.steps, [id]: 'finished' },
      }),
    }
  }

  if (event.type === 'risk.check.completed' && isJsonObject(event.payload)) {
    const outcome = isJsonString(event.payload.outcome) ? event.payload.outcome : state.risk.outcome
    const reason = isJsonString(event.payload.reason) ? event.payload.reason : state.risk.reason

    return { ...state, risk: { outcome, reason } }
  }

  if (
    event.type === 'evaluator.evaluated' &&
    isJsonObject(event.payload) &&
    isJsonString(event.payload.route)
  ) {
    const fills = state.fills.slice()
    const last = fills.at(-1)

    if (!last || last.grade !== '') {
      return state
    }

    fills[fills.length - 1] = { ...last, grade: event.payload.route }

    return { ...state, fills }
  }

  if (event.type !== 'execution.order.closed') {
    return state
  }

  const parsed = OrderClosed.safeParse(event.payload)

  if (!parsed.success) {
    return state
  }

  return {
    ...state,
    cash: parsed.data.cash,
    position: parsed.data.position,
    points: state.points.concat({
      x: event.seq,
      y: parsed.data.cash + parsed.data.position * parsed.data.price,
    }),
    fills: state.fills.concat({
      seq: event.seq,
      symbol: parsed.data.symbol,
      side: parsed.data.side,
      qty: parsed.data.qty,
      price: parsed.data.price,
      slippageBps: parsed.data.slippageBps,
      status: parsed.data.status,
      grade: '',
    }),
  }
}

const tape = defineLiveFold({
  name: 'meridianTape',
  initialState: emptyView,
  reduce: reduceView,
})

export function SessionDesk({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const events = useRunEvents(store)
  const live = useLiveFold(store, tape)
  const [scrub, setScrub] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')
  const last = events.at(-1)?.seq ?? 1
  const visibleSeq = scrub ?? last
  const visible = events.filter((event) => event.seq <= visibleSeq)
  const prefix = useMemo(() => visible.reduce(reduceView, emptyView), [visible])
  const view = scrub === undefined ? live : prefix

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

  const used = Math.min(Math.abs(view.position) / SIM_LIMITS.maxPosition, 1)

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
          pos {size(view.position)} · equity {signed(view.points.at(-1)?.y ?? view.cash)}
        </span>
      </div>
      {note ? <p className="banner">{note}</p> : null}
      <Equity points={view.points} />
      <p className="muted">
        Risk {view.risk.outcome} · {view.risk.reason}
      </p>
      <div className="gauge" aria-label="Position versus the limit">
        <span style={{ width: `${used * 100}%` }} />
      </div>
      <ol className="cycles">
        {view.cycles.map((cycle) => (
          <li key={cycle.index}>
            <span>{cycle.index + 1}</span>
            {steps.map((step) => (
              <em key={step} className={cycle.steps[step]}>
                {step}
              </em>
            ))}
          </li>
        ))}
      </ol>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Slip</th>
            <th>Status</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {view.fills.map((fill) => (
            <tr key={fill.seq}>
              <td>{fill.symbol}</td>
              <td className={fill.side === 'buy' ? 'bid-text' : 'ask-text'}>{fill.side}</td>
              <td>{size(fill.qty)}</td>
              <td>{price(fill.price)}</td>
              <td>{signed(fill.slippageBps)}</td>
              <td>{fill.status}</td>
              <td>{fill.grade || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
