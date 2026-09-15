import {
  LoomsDurableObject,
  routeToDurableObject,
  type LoomsDurableObjectConfig,
} from '@looms/cloudflare'
import { resolveDemoLlm, resolveDemoProjectors } from '@looms/demo/demo-config'
import { demoModules } from '@looms/demo/runtime'

export interface Env {
  readonly LOOMS_RUN: DurableObjectNamespace<LoomsRun>
  readonly OPENROUTER_API_KEY?: string
  readonly LOOMS_MODEL?: string
  readonly LOOMS_S2_ACCESS_TOKEN?: string
  readonly LOOMS_S2_BASIN?: string
  readonly LOOMS_S2_ENDPOINT?: string
}

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(env: Env): LoomsDurableObjectConfig {
    return {
      modules: demoModules({ llm: resolveDemoLlm(env) }),

      projectors: resolveDemoProjectors(env),
    }
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const res = await routeToDurableObject(env.LOOMS_RUN, req)

    if (res === null) {
      return new Response('Not Found', { status: 404 })
    }

    return res
  },
}
