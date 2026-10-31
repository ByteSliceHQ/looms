import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { fetchDesk } from '../api'
import { PageHeader } from '../components/shell'
import { clock, price, signed, size } from '../format'

export const Route = createFileRoute('/orders')({
  loader: () => fetchDesk(),
  component: Blotter,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function Blotter() {
  const desk = Route.useLoaderData()
  const [status, setStatus] = useState('all')
  const [symbol, setSymbol] = useState('all')
  const [session, setSession] = useState('all')
  const statuses = [...new Set(desk.orders.map((order) => order.status))]
  const symbols = [...new Set(desk.orders.map((order) => order.symbol))]
  const sessions = [...new Set(desk.orders.map((order) => order.runId))]

  const rows = desk.orders.filter(
    (order) =>
      (status === 'all' || order.status === status) &&
      (symbol === 'all' || order.symbol === symbol) &&
      (session === 'all' || order.runId === session),
  )

  return (
    <div>
      <PageHeader title="Blotter" detail={`${rows.length} orders`} />
      <div className="row">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={symbol} onChange={(event) => setSymbol(event.target.value)}>
          <option value="all">All symbols</option>
          {symbols.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={session} onChange={(event) => setSession(event.target.value)}>
          <option value="all">All sessions</option>
          {sessions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Slip</th>
              <th>Status</th>
              <th>Venue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id}>
                <td>{clock(order.ts)}</td>
                <td>
                  <Link to="/sessions/$runId" params={{ runId: order.runId }}>
                    {order.symbol}
                  </Link>
                </td>
                <td className={order.side === 'buy' ? 'bid-text' : 'ask-text'}>{order.side}</td>
                <td>{size(order.qty)}</td>
                <td>{price(order.price)}</td>
                <td>{signed(order.slippageBps)}</td>
                <td>{order.status}</td>
                <td>{order.venue === 'robinhood' ? 'LIVE' : 'sim'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
