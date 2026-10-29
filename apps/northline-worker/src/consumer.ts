import { bookRecovery } from '@looms/northline'
import { confirmBooking } from '@looms/northline/recovery'
import { createLoomsClient } from '@swirls/looms/client'
import { queueConsumer, routeToDurableObject, workerHandlers } from '@swirls/looms/cloudflare'

import type { Env } from './env'
import { modulesFor } from './host'

/**
 * The booking handler stays in this module. The Durable Object host imports the
 * effect definition and the queue binding, not the partner call, so a separate
 * consumer worker can take this file without taking the actor.
 */
export function consumeRecovery(env: Env) {
  const fetchRun: typeof fetch = (input, init) => {
    const request = new Request(input, init)

    return routeToDurableObject(env.LOOMS_RUN, request, {
      modules: () => modulesFor(env),
    }).then((response) => response ?? new Response('Not Found', { status: 404 }))
  }

  return queueConsumer({
    callbacks: createLoomsClient({
      baseUrl: 'https://northline.internal',
      workerCallbackToken: env.LOOMS_WORKER_TOKEN,
      fetch: fetchRun,
    }),
    handlers: workerHandlers([[bookRecovery, confirmBooking]]),
  })
}
