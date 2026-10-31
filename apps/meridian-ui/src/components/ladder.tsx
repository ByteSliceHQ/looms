import { quoteAt, type Quote } from '@looms/meridian/market'

import { price, size } from '../format'

export function quoteFor(symbol: string, tick: number): Quote | undefined {
  return quoteAt(symbol, tick, 'sim')
}

export function Ladder({ quote }: { quote: Quote }) {
  const bids = quote.depth
    .filter((level) => level.side === 'buy')
    .toSorted((a, b) => b.price - a.price)

  const asks = quote.depth
    .filter((level) => level.side === 'sell')
    .toSorted((a, b) => a.price - b.price)

  const max = Math.max(...quote.depth.map((level) => level.size), 1)
  const width = 280
  const row = 18

  return (
    <svg
      className="ladder"
      viewBox={`0 0 ${width} ${(bids.length + asks.length) * row}`}
      role="img"
    >
      {asks.toReversed().map((level, index) => (
        <Bar
          key={`a${level.price}`}
          index={index}
          level={level}
          max={max}
          width={width}
          row={row}
        />
      ))}
      {bids.map((level, index) => (
        <Bar
          key={`b${level.price}`}
          index={asks.length + index}
          level={level}
          max={max}
          width={width}
          row={row}
        />
      ))}
    </svg>
  )
}

function Bar({
  index,
  level,
  max,
  width,
  row,
}: {
  index: number
  level: Quote['depth'][number]
  max: number
  width: number
  row: number
}) {
  const bar = (level.size / max) * (width * 0.46)
  const y = index * row
  const bid = level.side === 'buy'
  const x = bid ? width / 2 - bar : width / 2

  return (
    <g>
      <rect x={x} y={y + 3} width={bar} height={row - 6} className={bid ? 'bid' : 'ask'} />
      <text x={bid ? 4 : width - 4} y={y + 13} textAnchor={bid ? 'start' : 'end'}>
        {price(level.price)} · {size(level.size)}
      </text>
    </g>
  )
}

export function Equity({ points }: { points: readonly { x: number; y: number }[] }) {
  if (points.length < 2) {
    return <p className="muted">No fills yet.</p>
  }

  const min = Math.min(...points.map((point) => point.y))
  const max = Math.max(...points.map((point) => point.y))
  const span = max - min || 1
  const width = 640
  const height = 160
  const step = width / (points.length - 1)

  const path = points
    .map((point, index) => {
      const x = index * step
      const y = height - ((point.y - min) / span) * (height - 12) - 6
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg className="equity" viewBox={`0 0 ${width} ${height}`} role="img">
      <path d={path} />
    </svg>
  )
}
