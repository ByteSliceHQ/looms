import { createFileRoute } from '@tanstack/react-router'

import { DailyFillsReady } from '@looms/meridian'
import { useRunEvents, useRunStore } from '@swirls/looms/react'

import { SessionDesk } from '../components/session'
import { PageHeader } from '../components/shell'
import { signed, size } from '../format'

export const Route = createFileRoute('/eod/$runId')({
  component: EndOfDay,
})

type Fill = {
  readonly runId: string
  readonly symbol: string
  readonly side: 'buy' | 'sell'
  readonly qty: number
  readonly price: number
}

function group(fills: readonly Fill[], key: (fill: Fill) => string) {
  const rows = new Map<string, { pnl: number; qty: number; fills: number }>()

  for (const fill of fills) {
    const name = key(fill)
    const row = rows.get(name) ?? { pnl: 0, qty: 0, fills: 0 }
    const cash = fill.side === 'buy' ? -fill.price * fill.qty : fill.price * fill.qty

    rows.set(name, { pnl: row.pnl + cash, qty: row.qty + fill.qty, fills: row.fills + 1 })
  }

  return [...rows.entries()]
}

function EndOfDay() {
  const { runId } = Route.useParams()
  const store = useRunStore(runId)
  const events = useRunEvents(store)
  const ready = events.toReversed().find((event) => event.type === 'ledger.daily_fills.ready')
  const parsed = DailyFillsReady.safeParse(ready ? ready.payload : null)
  const fills = parsed.success ? parsed.data.fills : []
  const bySymbol = group(fills, (fill) => fill.symbol)
  const bySession = group(fills, (fill) => fill.runId)

  return (
    <div>
      <PageHeader title="End of day" detail={`${fills.length} fills from the D1 copy`} />
      <h2>By symbol</h2>
      <Attribution rows={bySymbol} label="Symbol" />
      <h2>By session</h2>
      <Attribution rows={bySession} label="Session" />
      <SessionDesk runId={runId} />
    </div>
  )
}

function Attribution({
  rows,
  label,
}: {
  rows: readonly (readonly [string, { pnl: number; qty: number; fills: number }])[]
  label: string
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>{label}</th>
          <th>Fills</th>
          <th>Qty</th>
          <th>Cash flow</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, row]) => (
          <tr key={name}>
            <td>{name}</td>
            <td>{row.fills}</td>
            <td>{size(row.qty)}</td>
            <td>{signed(row.pnl)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
