import { Link, createFileRoute } from '@tanstack/react-router'

import { fetchDesk } from '../api'
import { PageHeader } from '../components/shell'
import { clock, price, size } from '../format'

export const Route = createFileRoute('/orders')({
  loader: () => fetchDesk(),
  component: Blotter,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function Blotter() {
  const desk = Route.useLoaderData()

  return (
    <div>
      <PageHeader title="Blotter" detail={`${desk.orders.length} orders`} />
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Status</th>
            <th>Venue</th>
          </tr>
        </thead>
        <tbody>
          {desk.orders.map((order) => (
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
              <td>{order.status}</td>
              <td>{order.venue === 'robinhood' ? 'LIVE' : 'sim'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
