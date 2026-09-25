import {
  resolveDemoEvaluator,
  resolveDemoLlm,
  resolveDemoProjectors,
} from '@looms/demo/demo-config'
import { demoModules } from '@looms/demo/runtime'
import {
  LoomsDurableObject,
  routeToDurableObject,
  type LoomsDurableObjectConfig,
} from '@swirls/looms/cloudflare'

export interface Env {
  readonly LOOMS_RUN: DurableObjectNamespace<LoomsRun>
  readonly OPENROUTER_API_KEY?: string
  readonly LOOMS_MODEL?: string
  readonly TYPESAFE_AI_API_KEY?: string
  readonly LOOMS_EVALUATOR_MODEL?: string
  readonly LOOMS_S2_ACCESS_TOKEN?: string
  readonly LOOMS_S2_BASIN?: string
  readonly LOOMS_S2_ENDPOINT?: string
}

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(env: Env): LoomsDurableObjectConfig {
    return {
      modules: demoModules({ llm: resolveDemoLlm(env), evaluator: resolveDemoEvaluator(env) }),

      projectors: resolveDemoProjectors(env),
    }
  }
}

export default {
  fetch: (req: Request, env: Env): Promise<Response> =>
    routeToDurableObject(env.LOOMS_RUN, req).then(
      (response) => response ?? new Response('Not Found', { status: 404 }),
    ),
}
