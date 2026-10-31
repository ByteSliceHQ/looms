import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { isLiveSymbol, LIVE_SYMBOLS, SIM_SYMBOLS } from '@looms/meridian/market'

import { fetchDesk, startSession } from '../api'
import { Ladder, quoteFor } from '../components/ladder'
import { PageHeader } from '../components/shell'
import { price, signed } from '../format'

export const Route = createFileRoute('/')({
  loader: () => fetchDesk(),
  component: Floor,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function Floor() {
  const desk = Route.useLoaderData()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const [symbol, setSymbol] = useState('NVDA')
  const [strategy, setStrategy] = useState<'momentum' | 'mean-revert'>('momentum')
  const [error, setError] = useState('')
  const quote = quoteFor(symbol, tick)

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 250)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="floor">
      <PageHeader title="Floor" detail={desk.live ? 'Live venue armed' : 'Simulated exchange'} />
      <div className="layout">
        <section>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Bid</th>
                <th>Ask</th>
                <th>Last</th>
              </tr>
            </thead>
            <tbody>
              {[...SIM_SYMBOLS, ...(desk.live ? LIVE_SYMBOLS : [])].map((name) => {
                const row = quoteFor(name, tick)

                return (
                  <tr
                    key={name}
                    className={name === symbol ? 'selected' : undefined}
                    onClick={() => setSymbol(name)}
                  >
                    <td>{name}</td>
                    <td className="bid-text">{row ? price(row.bid) : '—'}</td>
                    <td className="ask-text">{row ? price(row.ask) : '—'}</td>
                    <td>{row ? price(row.last) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="muted">
            Book {signed(desk.realizedPnl)} realized · {desk.position} shares · {desk.openOrders}{' '}
            working
          </p>
          <ul className="sessions">
            {desk.sessions.map((session) => (
              <li key={session.runId}>
                <Link to="/sessions/$runId" params={{ runId: session.runId }}>
                  {session.symbol} {session.strategy}
                </Link>
                <span>{session.status}</span>
                {session.venue === 'robinhood' ? <em>LIVE</em> : null}
              </li>
            ))}
          </ul>
        </section>
        <section>
          {quote ? <Ladder quote={quote} /> : null}
          <form
            className="ticket"
            onSubmit={(event) => {
              event.preventDefault()
              setError('')
              const live = desk.live && isLiveSymbol(symbol)

              void startSession({
                symbol,
                strategy,
                venue: live ? 'robinhood' : 'sim',
                cycles: 8,
                intervalMs: live ? 5_000 : 250,
              }).then(
                (started) => navigate({ to: '/sessions/$runId', params: { runId: started.runId } }),
                (cause: Error) => setError(cause.message),
              )
            }}
          >
            <label>
              Strategy
              <select
                value={strategy}
                onChange={(event) =>
                  setStrategy(event.target.value === 'mean-revert' ? 'mean-revert' : 'momentum')
                }
              >
                <option value="momentum">Momentum</option>
                <option value="mean-revert">Mean revert</option>
              </select>
            </label>
            <button type="submit">Start {symbol}</button>
            {desk.live && isLiveSymbol(symbol) ? <span className="live">LIVE</span> : null}
          </form>
          {error ? <p className="banner">{error}</p> : null}
        </section>
      </div>
    </div>
  )
}
