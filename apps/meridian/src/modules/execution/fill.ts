import { Effect } from 'effect'

import type { EventInput, WorkerEffectContext } from '@swirls/looms/core'

import { applyFill, type Book } from '../../accounting'
import { clientOrderId } from '../../broker/robinhood'
import { slippageBps } from '../../broker/sim'
import type { Broker, BrokerResult } from '../../broker/types'
import { executionEvents, type SubmitInput } from './events'

const POLL_MS = 1_000
const POLL_BUDGET_MS = 28_000

function pause(ms: number): Promise<void> {
  return Effect.runPromise(Effect.sleep(ms))
}

function eventsFor(
  input: SubmitInput,
  id: string,
  book: Book,
  dayNotional: number,
  result: BrokerResult,
): EventInput[] {
  const closed = {
    clientOrderId: id,
    symbol: input.symbol,
    side: input.side,
    qty: result.fills.reduce((sum, fill) => sum + fill.qty, 0),
    requestedQty: input.qty,
    price: result.vwap || input.arrivalPrice,
    vwap: result.vwap,
    slippageBps: result.slippageBps,
    venue: input.venue,
    tick: input.tick,
    status: result.status,
    reason: result.reason,
    position: book.position,
    avgCost: book.avgCost,
    cash: book.cash,
    realizedPnl: book.realizedPnl,
    dayNotional,
  }

  const events: EventInput[] = []

  if (result.status === 'rejected') {
    events.push(executionEvents.input('order.rejected', closed))
  } else {
    events.push(
      executionEvents.input('order.accepted', {
        clientOrderId: id,
        symbol: input.symbol,
        side: input.side,
        qty: input.qty,
        venue: input.venue,
      }),
    )

    result.fills.forEach((fill, index) => {
      const payload = {
        clientOrderId: id,
        symbol: input.symbol,
        side: input.side,
        qty: fill.qty,
        price: fill.price,
        venue: input.venue,
      }

      const last = index === result.fills.length - 1 && result.status === 'filled'
      events.push(executionEvents.input(last ? 'order.filled' : 'order.partially_filled', payload))
    })

    if (result.status === 'working') {
      events.push(executionEvents.input('order.working', closed))
    }
  }

  events.push(executionEvents.input('order.closed', closed))
  return events
}

function withArrival(input: SubmitInput, result: BrokerResult): BrokerResult {
  if (!(result.vwap > 0)) {
    return result
  }

  return { ...result, slippageBps: slippageBps(input.side, input.arrivalPrice, result.vwap) }
}

function untilSettled(
  input: SubmitInput,
  ctx: WorkerEffectContext,
  broker: Broker,
  id: string,
  first: BrokerResult,
  left = POLL_BUDGET_MS / POLL_MS,
): Promise<BrokerResult> {
  if (first.status !== 'working' || left <= 0) {
    return Promise.resolve(withArrival(input, first))
  }

  return ctx
    .heartbeat({ stage: 'working' })
    .then(() =>
      pause(POLL_MS).then(() =>
        broker
          .status(first.orderId || id)
          .then((next) => untilSettled(input, ctx, broker, id, next, left - 1)),
      ),
    )
}

export function settleOrder(
  input: SubmitInput,
  ctx: WorkerEffectContext,
  broker: Broker,
): Promise<ReadonlyArray<EventInput>> {
  return clientOrderId(ctx.effectId).then((id) =>
    ctx.heartbeat({ stage: 'submit' }).then(() =>
      broker
        .submit(
          {
            symbol: input.symbol,
            side: input.side,
            qty: input.qty,
            tick: input.tick,
            arrivalPrice: input.arrivalPrice,
          },
          id,
        )
        .then((first) => untilSettled(input, ctx, broker, id, first))
        .then((result) => {
          let book: Book = {
            position: input.position,
            avgCost: input.avgCost,
            cash: input.cash,
            realizedPnl: input.realizedPnl,
          }

          for (const fill of result.fills) {
            book = applyFill(book, { side: input.side, qty: fill.qty, price: fill.price })
          }

          const traded = result.fills.reduce((sum, fill) => sum + fill.qty * fill.price, 0)
          return eventsFor(input, id, book, input.dayNotional + traded, result)
        }),
    ),
  )
}
