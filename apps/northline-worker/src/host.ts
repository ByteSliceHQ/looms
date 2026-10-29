import {
  bookRecovery,
  MORNING_SWEEP_RUN_ID,
  morningSweep,
  northlineModules,
} from '@looms/northline'
import {
  cloudflareQueueWorker,
  durableObjectLauncher,
  durableObjectScheduleHost,
  LoomsDurableObject,
  type LoomsDurableObjectConfig,
  type QueueProducer,
} from '@swirls/looms/cloudflare'
import { bearerAuth } from '@swirls/looms/runtime'
import { ensureSchedule } from '@swirls/looms/schedule'

import { resolveEvaluator, resolveLlm, type Env } from './env'
import { deskStatusProjector } from './status'

let cached: ReturnType<typeof northlineModules> | undefined
let cachedKey = ''

export function modulesFor(env: Env) {
  const key = [
    env.OPENROUTER_API_KEY ?? '',
    env.LOOMS_MODEL ?? '',
    env.TYPESAFE_AI_API_KEY ?? '',
    env.LOOMS_EVALUATOR_MODEL ?? '',
  ].join('|')

  if (cached && cachedKey === key) {
    return cached
  }

  const llm = resolveLlm(env)
  const evaluator = resolveEvaluator(env)
  cachedKey = key
  cached = evaluator ? northlineModules({ llm, evaluator }) : northlineModules({ llm })
  return cached
}

function recoveryQueue(queue: Queue): QueueProducer {
  return {
    send: (message) => queue.send(message, { contentType: 'json' }).then(() => undefined),
  }
}

let armed: Promise<void> | undefined

/** One schedule run, reconciled on the first request and again from cron. */
export function armMorningSweep(env: Env): Promise<void> {
  if (armed) {
    return armed
  }

  armed = ensureSchedule(
    durableObjectScheduleHost(env.LOOMS_RUN),
    morningSweep,
    MORNING_SWEEP_RUN_ID,
  ).then(
    () => undefined,
    (cause) => {
      armed = undefined

      if (cause instanceof Error) {
        throw cause
      }

      throw new Error('Could not arm the morning sweep')
    },
  )

  return armed
}

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(env: Env): LoomsDurableObjectConfig {
    return {
      modules: modulesFor(env),
      launcher: durableObjectLauncher(env.LOOMS_RUN),
      projectors: [deskStatusProjector(env.DESK)],
      authorize: bearerAuth({ worker: env.LOOMS_WORKER_TOKEN }),
      worker: cloudflareQueueWorker({
        routes: [{ effects: [bookRecovery], queue: recoveryQueue(env.RECOVERY_QUEUE) }],
      }),
    }
  }
}
