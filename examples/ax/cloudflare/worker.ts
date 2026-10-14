import { createAxWorker } from '@swirls/looms/ax'
import {
  LoomsDurableObject,
  routeToDurableObject,
  type LoomsDurableObjectConfig,
} from '@swirls/looms/cloudflare'
import { bearerAuth } from '@swirls/looms/runtime'

import { modules } from '../definition'

interface Env {
  LOOMS_RUN: DurableObjectNamespace<LoomsRun>
  AX_HOST_TOKEN: string
  LOOMS_READ_TOKEN: string
  LOOMS_WRITE_TOKEN: string
  LOOMS_WORKER_TOKEN: string
}

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(env: Env): LoomsDurableObjectConfig {
    return {
      modules,
      worker: createAxWorker({
        endpoint: 'http://127.0.0.1:18789',
        allowInsecureHttp: true,
        token: env.AX_HOST_TOKEN,
        scope: 'ax-example',
        callbackTarget: 'ax-example',
        routes: { 'repository.analyze.v1': { profile: 'repository-analyzer-v1' } },
      }),
      authorize: bearerAuth({
        read: env.LOOMS_READ_TOKEN,
        write: env.LOOMS_WRITE_TOKEN,
        worker: env.LOOMS_WORKER_TOKEN,
        operations: env.LOOMS_WRITE_TOKEN,
      }),
    }
  }
}

export default {
  fetch: (request, env) =>
    routeToDurableObject(env.LOOMS_RUN, request).then(
      (response) => response ?? new Response('Not Found', { status: 404 }),
    ),
} satisfies ExportedHandler<Env>
