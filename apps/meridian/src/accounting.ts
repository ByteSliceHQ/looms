import type { Side } from './market'

export interface Book {
  readonly position: number
  readonly avgCost: number
  readonly cash: number
  readonly realizedPnl: number
}

export const OPENING_CASH = 1_000_000

export const flatBook: Book = {
  position: 0,
  avgCost: 0,
  cash: OPENING_CASH,
  realizedPnl: 0,
}

export function applyFill(book: Book, fill: { side: Side; qty: number; price: number }): Book {
  const signed = fill.side === 'buy' ? fill.qty : -fill.qty
  const next = book.position + signed
  let realized = book.realizedPnl
  let avg = book.avgCost

  if (book.position !== 0 && Math.sign(signed) !== Math.sign(book.position)) {
    const closed = Math.min(Math.abs(signed), Math.abs(book.position))

    realized +=
      book.position > 0
        ? (fill.price - book.avgCost) * closed
        : (book.avgCost - fill.price) * closed

    if (next === 0) {
      avg = 0
    } else if (Math.sign(next) !== Math.sign(book.position)) {
      avg = fill.price
    }
  } else {
    const size = Math.abs(book.position) + Math.abs(signed)
    avg = size === 0 ? 0 : (Math.abs(book.position) * book.avgCost + fill.qty * fill.price) / size
  }

  return {
    position: next,
    avgCost: avg,
    cash: book.cash - signed * fill.price,
    realizedPnl: realized,
  }
}

export function unrealized(book: Book, mark: number): number {
  if (book.position === 0) {
    return 0
  }

  return book.position > 0
    ? (mark - book.avgCost) * book.position
    : (book.avgCost - mark) * Math.abs(book.position)
}
