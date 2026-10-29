import { routeToDurableObject } from '@swirls/looms/cloudflare'

import { consumeRecovery } from './consumer'
import { DeskBoard } from './desk'
import type { Env } from './env'
import { armMorningSweep, LoomsRun, modulesFor } from './host'

export { DeskBoard, LoomsRun }

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      return armMorningSweep(env).then(() => env.DESK.getByName('board').fetch(request))
    }

    return routeToDurableObject(env.LOOMS_RUN, request, {
      modules: () => modulesFor(env),
    }).then((response) => response ?? new Response('Not Found', { status: 404 }))
  },

  queue(batch: MessageBatch, env: Env): Promise<void> {
    return consumeRecovery(env)(batch)
  },

  scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    return armMorningSweep(env)
  },
}
