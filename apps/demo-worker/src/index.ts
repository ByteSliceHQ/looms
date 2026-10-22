import {
  resolveDemoEvaluator,
  resolveDemoLlm,
  resolveDemoProjectors,
} from '@looms/demo/demo-config'
import { demoModules } from '@looms/demo/runtime'
import {
  durableObjectLauncher,
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

function modulesFor(env: Env) {
  return demoModules({ llm: resolveDemoLlm(env), evaluator: resolveDemoEvaluator(env) })
}

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(env: Env): LoomsDurableObjectConfig {
    return {
      modules: modulesFor(env),
      launcher: durableObjectLauncher(env.LOOMS_RUN),
      projectors: resolveDemoProjectors(env),
    }
  }
}

export default {
  fetch: (req: Request, env: Env): Promise<Response> =>
    routeToDurableObject(env.LOOMS_RUN, req, { modules: () => modulesFor(env) }).then(
      (response) => response ?? new Response('Not Found', { status: 404 }),
    ),
}
