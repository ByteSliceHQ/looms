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
  if (points.length === 0) {
    return <p className="muted">No fills yet.</p>
  }

  if (points.length === 1) {
    return (
      <svg className="equity" viewBox="0 0 640 160" role="img">
        <circle cx={320} cy={80} r={4} />
      </svg>
    )
  }

  const min = Math.min(...points.map((point) => point.y))
  const max = Math.max(...points.map((point) => point.y))
  const span = max - min || 1
  const width = 640
  const height = 160
  const step = width / (points.length - 1)

  const placed = points.map((point, index) => {
    const x = index * step
    const y = height - ((point.y - min) / span) * (height - 12) - 6

    return { x, y }
  })

  const path = placed
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')

  return (
    <svg className="equity" viewBox={`0 0 ${width} ${height}`} role="img">
      <path d={path} />
      {placed.map((point, index) => (
        <circle key={points[index]?.x ?? index} cx={point.x} cy={point.y} r={3.5} />
      ))}
    </svg>
  )
}

export function Sparkline({ symbol, tick }: { symbol: string; tick: number }) {
  const values = Array.from({ length: 24 }, (_, index) => {
    const quote = quoteAt(symbol, Math.max(tick - 23 + index, 0), 'sim')

    return quote?.last ?? 0
  })

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 72
      const y = 22 - ((value - min) / span) * 18 - 2

      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg className="spark" viewBox="0 0 72 22" role="img">
      <path d={path} />
    </svg>
  )
}

export function Candles({ symbol, tick }: { symbol: string; tick: number }) {
  const span = 8

  const bars = Array.from({ length: 28 }, (_, index) => {
    const end = Math.max(tick - (27 - index) * span, 0)
    let open = 0
    let high = 0
    let low = 0
    let close = 0

    for (let step = 0; step < span; step += 1) {
      const quote = quoteAt(symbol, end + step, 'sim')
      const last = quote?.last ?? close

      if (step === 0) {
        open = last
        high = last
        low = last
      }

      high = Math.max(high, last)
      low = Math.min(low, last)
      close = last
    }

    return { open, high, low, close }
  })

  const high = Math.max(...bars.map((bar) => bar.high))
  const low = Math.min(...bars.map((bar) => bar.low))
  const range = high - low || 1
  const width = 420
  const height = 140
  const slot = width / bars.length

  return (
    <svg className="candles" viewBox={`0 0 ${width} ${height}`} role="img">
      {bars.map((bar, index) => {
        const x = index * slot + slot / 2
        const top = ((high - bar.high) / range) * (height - 8) + 4
        const bottom = ((high - bar.low) / range) * (height - 8) + 4
        const bodyTop = ((high - Math.max(bar.open, bar.close)) / range) * (height - 8) + 4
        const bodyHeight = Math.max(1, (Math.abs(bar.close - bar.open) / range) * (height - 8))
        const up = bar.close >= bar.open

        return (
          <g key={index} className={up ? 'bid' : 'ask'}>
            <line x1={x} x2={x} y1={top} y2={bottom} />
            <rect x={x - 3} y={bodyTop} width={6} height={bodyHeight} />
          </g>
        )
      })}
    </svg>
  )
}
