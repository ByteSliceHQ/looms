export type OrchestrationSourceFile = {
  name: string
  language: string
  source: string
}

export const orchestrationSourceFiles: readonly OrchestrationSourceFile[] = [
  {
    name: 'actors.ts',
    language: 'tsx',
    source: `import { asAgentTool, defineAgent } from '@swirls/looms/agent'
import { z } from 'zod'

import { lookupPolicy, queryMetrics, requestApproval, searchWeb } from './tools'

export const researcher = defineAgent({
  name: 'researcher',
  instructions: 'Find the root cause in product and release data.',
  input: z.object({ question: z.string() }),
  tools: [searchWeb],
})

export const dataAnalyst = defineAgent({
  name: 'data-analyst',
  instructions: 'Quantify the incident and identify affected segments.',
  input: z.object({ metric: z.string() }),
  tools: [queryMetrics],
})

export const riskReviewer = defineAgent({
  name: 'risk-reviewer',
  instructions: 'Check the rollout against payment risk policy.',
  tools: [lookupPolicy],
})

export const rolloutPlanner = defineAgent({
  name: 'rollout-planner',
  instructions: 'Create a guarded rollout and request approval.',
  tools: [
    asAgentTool({
      agent: riskReviewer,
      description: 'Review a proposed payment change',
    }),
    requestApproval,
  ],
})

export const incidentCommander = defineAgent({
  name: 'incident-commander',
  instructions: 'Investigate in parallel, then synthesize a safe plan.',
  tools: [
    asAgentTool({ agent: researcher }),
    asAgentTool({ agent: dataAnalyst }),
    asAgentTool({ agent: rolloutPlanner }),
  ],
})`,
  },
  {
    name: 'events.ts',
    language: 'tsx',
    source: `import { payload, defineEventCatalog } from '@swirls/looms/core'

export const incidentEvents = defineEventCatalog('incident', {
  detected: payload<{
    metric: string
    delta: number
  }>(),
  'root-cause.found': payload<{
    cause: string
    confidence: number
  }>(),
  'rollout.proposed': payload<{
    planId: string
    stages: number[]
    guardrails: string[]
  }>(),
})

// Looms also records runtime, agent, tool, wait, and
// approval events automatically in the same durable log.`,
  },
  {
    name: 'run.ts',
    language: 'tsx',
    source: `import { agent } from '@swirls/looms/agent'
import { createLooms } from '@swirls/looms/runtime'

import { incidentCommander } from './actors'

const looms = createLooms({
  modules: [agent({ definitions: [incidentCommander] })],
})

const run = await looms.start(incidentCommander, {
  task: 'Investigate the checkout conversion drop and propose a safe rollout',
})

const events = await looms.getEvents(run.runId)

console.log(events)`,
  },
]
