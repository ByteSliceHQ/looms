import { submitOrder, type SubmitInput } from '@looms/meridian'
import { robinhoodBroker, simBroker, type Broker } from '@looms/meridian/broker'
import { settleOrder } from '@looms/meridian/execution'
import { createLoomsClient } from '@swirls/looms/client'
import { queueConsumer, routeToDurableObject, workerHandlers } from '@swirls/looms/cloudflare'

import { liveConfigured, liveEnabled, type Env } from './env'
import { modulesFor } from './host'

function rejectingBroker(reason: string): Broker {
  const fail = () => Promise.reject(new Error(reason))

  return {
    quote: fail,
    submit: fail,
    status: fail,
    cancel: () => Promise.resolve(),
  }
}

function brokerFor(env: Env, input: SubmitInput): Broker {
  if (input.venue !== 'robinhood') {
    return simBroker()
  }

  if (!liveEnabled(env) || !liveConfigured(env)) {
    return rejectingBroker('live trading is off')
  }

  return robinhoodBroker({
    apiKey: env.ROBINHOOD_API_KEY ?? '',
    privateKey: env.ROBINHOOD_PRIVATE_KEY ?? '',
  })
}

/**
 * The fill handler stays in this module. The Durable Object host imports the
 * effect definition and the queue binding, not the broker, so a retry keeps
 * the client order id derived from the effect id.
 */
export function consumeOrders(env: Env) {
  const fetchRun: typeof fetch = (input, init) => {
    const request = new Request(input, init)

    return routeToDurableObject(env.LOOMS_RUN, request, {
      modules: () => modulesFor(env),
    }).then((response) => response ?? new Response('Not Found', { status: 404 }))
  }

  return queueConsumer({
    callbacks: createLoomsClient({
      baseUrl: 'https://meridian.internal',
      workerCallbackToken: env.LOOMS_WORKER_TOKEN,
      fetch: fetchRun,
    }),
    handlers: workerHandlers([
      [submitOrder, (input, ctx) => settleOrder(input, ctx, brokerFor(env, input))],
    ]),
  })
}
