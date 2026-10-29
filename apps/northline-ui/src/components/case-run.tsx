import { useEffect, useState } from 'react'

import type { CaseRecord, CaseStatus, ReplicaView } from '@looms/northline/http'
import { booking, dossier, outbox } from '@looms/northline/views'
import { decision, pendingApprovals } from '@swirls/looms/approval'
import { isJsonObject, type JsonValue, type RunStatus } from '@swirls/looms/core'
import { evaluations } from '@swirls/looms/evaluator'
import {
  useProjection,
  useRunStore,
  useRunSummary,
  type LoomsConnectionStatus,
} from '@swirls/looms/react'
import { nodes, type NodeStatus } from '@swirls/looms/workflow'

import { fetchCase } from '../api'
import { kindLabel, money, openedLabel } from '../format'
import { LiveDot, StatusPill } from './marks'

const STEPS = [
  { id: 'load', title: 'Look up', detail: 'Read the shipment from the board' },
  { id: 'classify', title: 'Classify', detail: 'Decide if a person has to see it' },
  { id: 'review', title: 'Service lead', detail: 'Book the recovery, or hold it' },
  { id: 'book', title: 'Linehaul', detail: 'Red Cedar, on the recovery queue' },
  { id: 'notify', title: 'Notice', detail: 'Email the consignee' },
] as const

export function CaseRun({
  record,
  replica: initialReplica,
}: {
  record: CaseRecord
  replica: ReplicaView
}) {
  const store = useRunStore(record.runId)
  const summary = useRunSummary(store)
  const graph = useProjection(store, nodes)
  const scored = useProjection(store, evaluations)
  const approvals = useProjection(store, pendingApprovals)
  const loaded = useProjection(store, dossier)
  const booked = useProjection(store, booking)
  const mail = useProjection(store, outbox)
  const [busy, setBusy] = useState<'approve' | 'reject' | undefined>(undefined)
  const [decisionError, setDecisionError] = useState<string | undefined>(undefined)
  const [replica, setReplica] = useState(initialReplica)

  useEffect(() => {
    let current = true

    if (initialReplica.attached) {
      void fetchCase(record.id).then(
        (body) => {
          if (current) {
            setReplica(body.replica)
          }
        },
        () => undefined,
      )
    }

    return () => {
      current = false
    }
  }, [initialReplica.attached, record.id, summary.status])

  const pending = approvals.items.filter((item) => item.status === 'pending')
  const evaluation = scored.items[scored.items.length - 1]
  const status = shownStatus(summary.connection, pending.length > 0, summary.status, record.status)
  const shipment = loaded.shipment
  const when = openedLabel(record.openedAt)

  const facts = [
    record.destination,
    kindLabel(record.kind),
    shipment ? money(shipment.valueUsd) : '',
    shipment && shipment.hoursLate > 0 ? `${shipment.hoursLate}h late` : '',
    shipment ? `${shipment.pieces} pieces` : '',
  ].filter((fact) => fact.length > 0)

  function choose(approvalId: string, choice: 'approve' | 'reject') {
    setBusy(choice)
    setDecisionError(undefined)

    void store.commit(decision(approvalId, choice)).then(
      () => setBusy(undefined),
      (cause) => {
        setBusy(undefined)
        setDecisionError(cause instanceof Error ? cause.message : 'Could not record that decision')
      },
    )
  }

  return (
    <article className="case">
      <header className="case-head">
        <div>
          <p className="page-kicker">PRO {record.pro}</p>
          <h1 className="page-title">{record.consignee}</h1>
          <p className="case-meta">{facts.join(' · ')}</p>
          <p className="case-opened">
            Opened by {record.openedBy}
            {when ? ` · ${when}` : ''}
          </p>
          <p className="quiet">{ledgerLine(replica)}</p>
        </div>
        <div className="case-status">
          <StatusPill status={status} />
          <LiveDot connection={summary.connection} />
        </div>
      </header>

      {shipment?.note ? <p className="shipment-note">{shipment.note}</p> : null}
      {loaded.error ? <p className="banner">{loaded.error}</p> : null}
      {status === 'failed' ? <p className="banner">This recovery failed.</p> : null}

      <ol className="steps" aria-live="polite">
        {STEPS.map((step) => {
          const node = graph.nodes[step.id]
          return (
            <li key={step.id} className={`step step-${node?.status ?? 'pending'}`}>
              <span className="step-mark" aria-hidden="true" />
              <div className="step-body">
                <div className="step-line">
                  <h2 className="step-title">{step.title}</h2>
                  <span className="step-state">
                    {stepState(node?.status, node?.result ?? null)}
                  </span>
                </div>
                <p className="step-detail">{step.detail}</p>
                {node?.error ? <p className="step-error">{node.error}</p> : null}
              </div>
            </li>
          )
        })}
      </ol>

      {evaluation ? (
        <section className="card">
          <h2 className="card-title">Classification</h2>
          <p>{routeCopy(evaluation.route, evaluation.reason)}</p>
        </section>
      ) : null}

      {pending.map((item) => (
        <section key={item.approvalId} className="card card-waiting">
          <h2 className="card-title">{item.title}</h2>
          {item.description ? <p>{item.description}</p> : null}
          <div className="actions">
            <button
              type="button"
              className="button"
              disabled={busy !== undefined}
              onClick={() => choose(item.approvalId, 'approve')}
            >
              {busy === 'approve' ? 'Booking…' : 'Book recovery'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={busy !== undefined}
              onClick={() => choose(item.approvalId, 'reject')}
            >
              {busy === 'reject' ? 'Holding…' : 'Hold'}
            </button>
          </div>
          {decisionError ? <p className="banner">{decisionError}</p> : null}
        </section>
      ))}

      {booked.booking ? (
        <section className="card">
          <h2 className="card-title">Booked with {booked.booking.partner}</h2>
          <p>{booked.booking.window}</p>
          <p className="quiet">Booking {booked.booking.bookingId}</p>
        </section>
      ) : null}

      {mail.items.length > 0 ? (
        <section className="card">
          <h2 className="card-title">Consignee notice</h2>
          {mail.items.map((item) => (
            <div key={item.noticeId} className="notice">
              <p className="notice-subject">{item.subject}</p>
              <p className="quiet">
                {item.to} · {item.status === 'delivered' ? 'Delivered' : 'Queued'}
              </p>
              <p className="notice-body">{item.body}</p>
            </div>
          ))}
        </section>
      ) : null}
    </article>
  )
}

function shownStatus(
  connection: LoomsConnectionStatus,
  pending: boolean,
  run: RunStatus,
  recorded: CaseStatus,
): CaseStatus {
  if (connection !== 'live') {
    return recorded
  }

  if (pending) {
    return 'waiting'
  }

  switch (run) {
    case 'running':
      return 'running'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'cancelled'

    default: {
      const unreachable: never = run
      return unreachable
    }
  }
}

function stepState(status: NodeStatus | undefined, result: JsonValue | null): string {
  switch (status) {
    case undefined:
    case 'pending':
      return 'Queued'
    case 'running':
      return 'Working'
    case 'skipped':
      return 'Not on this path'
    case 'failed':
      return 'Failed'
    case 'completed':
      if (isJsonObject(result) && result.skipped === true) {
        return 'Not required'
      }

      if (isJsonObject(result) && result.booked === false) {
        return 'Held'
      }

      return 'Done'

    default: {
      const unreachable: never = status
      return unreachable
    }
  }
}

function routeCopy(
  route: string,
  reason: 'model' | 'uncertain' | 'skipped' | 'unavailable',
): string {
  switch (reason) {
    case 'skipped':
      return 'Policy sent this to a service lead'
    case 'uncertain':
      return 'The evaluator was unsure'
    case 'unavailable':
      return 'The evaluator was unavailable, so a person has to see it'
    case 'model':
      return route === 'auto' ? 'Recovers on its own' : 'The evaluator asked for a service lead'

    default: {
      const unreachable: never = reason
      return unreachable
    }
  }
}

function ledgerLine(replica: ReplicaView): string {
  if (!replica.attached) {
    return 'Events stay on the run until Postgres is attached.'
  }

  const copy = replica.copy

  if (!copy) {
    return 'Waiting for this run to land in Postgres.'
  }

  if (copy.purgedAt !== null) {
    return 'The event copy was purged. The case summary is still in Postgres.'
  }

  if (copy.complete) {
    return `Copied through event ${copy.replicatedSeq}. The run is complete in Postgres.`
  }

  return `Copied through event ${copy.replicatedSeq}.`
}
