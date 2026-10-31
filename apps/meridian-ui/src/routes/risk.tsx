import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { SIM_LIMITS } from '@looms/meridian'

import { fetchDesk, setKill, startEod } from '../api'
import { PageHeader } from '../components/shell'
import { signed, size } from '../format'

export const Route = createFileRoute('/risk')({
  loader: () => fetchDesk(),
  component: Risk,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function Risk() {
  const desk = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const exposure = new Map<string, { position: number; pnl: number }>()

  for (const session of desk.sessions) {
    const row = exposure.get(session.symbol) ?? { position: 0, pnl: 0 }

    exposure.set(session.symbol, {
      position: row.position + session.position,
      pnl: row.pnl + session.realizedPnl,
    })
  }

  const notional = desk.orders.reduce((sum, order) => sum + Math.abs(order.qty * order.price), 0)

  const positionUsed = Math.min(
    [...exposure.values()].reduce((sum, row) => sum + Math.abs(row.position), 0) /
      SIM_LIMITS.maxPosition,
    1,
  )

  const notionalUsed = Math.min(notional / SIM_LIMITS.maxNotional, 1)
  const breaches = desk.approvals

  return (
    <div>
      <PageHeader title="Risk" detail={desk.killed ? 'Kill switch on' : 'Kill switch off'} />
      <div className="row">
        <button
          type="button"
          className={desk.killed ? 'danger' : undefined}
          onClick={() => {
            setError('')

            void setKill(!desk.killed).then(
              () => router.invalidate(),
              (cause: Error) => setError(cause.message),
            )
          }}
        >
          {desk.killed ? 'Resume trading' : 'Kill switch'}
        </button>
        <button
          type="button"
          onClick={() => {
            setError('')

            void startEod().then(
              (started) => navigate({ to: '/eod/$runId', params: { runId: started.runId } }),
              (cause: Error) => setError(cause.message),
            )
          }}
        >
          Run end of day
        </button>
        <span className="muted">
          Live cap {desk.maxOrderUsd} / day {desk.maxDayUsd}
          {desk.live ? ' · LIVE' : ''}
        </span>
      </div>
      {error ? <p className="banner">{error}</p> : null}
      <h2>Exposure</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Position</th>
            <th>Realized</th>
          </tr>
        </thead>
        <tbody>
          {[...exposure.entries()].map(([symbol, row]) => (
            <tr key={symbol}>
              <td>{symbol}</td>
              <td>{size(row.position)}</td>
              <td>{signed(row.pnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Limits</h2>
      <p className="muted">
        Position {Math.round(positionUsed * 100)}% of {SIM_LIMITS.maxPosition}
      </p>
      <div className="gauge">
        <span style={{ width: `${positionUsed * 100}%` }} />
      </div>
      <p className="muted">
        Notional {Math.round(notionalUsed * 100)}% of {SIM_LIMITS.maxNotional}
      </p>
      <div className="gauge">
        <span style={{ width: `${notionalUsed * 100}%` }} />
      </div>
      <h2>Breaches</h2>
      <ul className="sessions">
        {breaches.map((approval) => (
          <li key={approval.approvalId}>
            <Link to="/sessions/$runId" params={{ runId: approval.runId }}>
              {approval.title}
            </Link>
            <span>{approval.status}</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        Open book run <code>{desk.openRunId}</code> · close <code>{desk.eodRunId}</code>
      </p>
    </div>
  )
}
