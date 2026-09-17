import {
  LoomsDurableObject,
  routeToDurableObject,
  type LoomsDurableObjectConfig,
} from '@swirls/looms/cloudflare'

import { modules } from '../review-definition'

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(): LoomsDurableObjectConfig {
    return { modules }
  }
}

// Private service: put authentication and per-run authorization in the calling app.
// The accompanying config disables public workers.dev and preview URLs.
export default {
  fetch: (request, env): Promise<Response> =>
    routeToDurableObject(env.LOOMS_RUN, request).then(
      (response) => response ?? new Response('Not Found', { status: 404 }),
    ),
} satisfies ExportedHandler<Env>
