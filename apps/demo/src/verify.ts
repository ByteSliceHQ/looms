import { createLooms } from '@looms/runtime'
import { z } from 'zod'
import { assistant, definitions, echo, hitl, orchestrator, pipeline } from './definitions'

const EchoOutputSchema = z.object({ text: z.string() })

const PipelineOutputSchema = z.object({
  double: z.number().optional(),
  format: z
    .object({
      doubled: z.number().optional(),
    })
    .optional(),
})

const OrchestratorOutputSchema = z.object({
  result: z.string().optional(),
})

/**
 * Programmatic verify: agent + workflow + HITL approve + subagent spawn.
 * Does not require HTTP.
 */
export async function verifyDemo(): Promise<void> {
  const looms = createLooms({ definitions })

  // 1) Echo agent
  {
    const { state } = await looms.startAgent(echo, { text: 'hello' })
    if (state.status !== 'completed') throw new Error(`echo expected completed, got ${state.status}`)
    const parsed = EchoOutputSchema.safeParse(state.output)
    if (!parsed.success || parsed.data.text !== 'hello') {
      throw new Error(`echo bad output: ${JSON.stringify(state.output)}`)
    }
  }

  // 2) Pipeline workflow with nested spawn_agent
  {
    const { state } = await looms.startWorkflow(pipeline, { n: 21 })
    if (state.status !== 'completed') {
      throw new Error(`pipeline expected completed, got ${state.status}: ${state.error}`)
    }
    const parsed = PipelineOutputSchema.safeParse(state.output)
    if (!parsed.success || parsed.data.double !== 42) throw new Error('pipeline double expected 42')
    if (parsed.data.format?.doubled !== 42) {
      throw new Error(`pipeline format.doubled expected 42, got ${JSON.stringify(parsed.data.format)}`)
    }
  }

  // 3) HITL review → approve
  {
    const { actorId, state } = await looms.startWorkflow(hitl, { doc: 'draft' })
    if (state.status !== 'waiting_review') {
      throw new Error(`hitl expected waiting_review, got ${state.status}`)
    }
    const reviewId = Object.keys(state.reviews)[0]
    if (!reviewId) throw new Error('hitl missing reviewId')
    const next = await looms.decideReview(actorId, reviewId, { actionId: 'approve', outcome: 'approve' })
    if (next.status !== 'completed') {
      throw new Error(`hitl after approve expected completed, got ${next.status}: ${next.error}`)
    }
  }

  // 4) Orchestrator agent-tool → child specialist
  {
    const { state } = await looms.startAgent(orchestrator, { task: 'summarize' })
    if (state.status !== 'completed') {
      throw new Error(`orchestrator expected completed, got ${state.status}: ${state.error}`)
    }
    const children = Object.values(state.children)
    if (children.length < 1) throw new Error('orchestrator expected a child actor')
    if (children.some((c) => c.status !== 'completed')) {
      throw new Error(`orchestrator child not completed: ${JSON.stringify(children)}`)
    }
    const parsed = OrchestratorOutputSchema.safeParse(state.output)
    if (!parsed.success || !parsed.data.result?.includes('summarize')) {
      throw new Error(`orchestrator bad output: ${JSON.stringify(state.output)}`)
    }
  }

  // 5) Conversational assistant stays running after a stub reply
  {
    const { state } = await looms.startAgent(assistant, 'hello')
    if (state.status !== 'running') {
      throw new Error(`assistant expected running, got ${state.status}: ${state.error}`)
    }
    if (state.kind !== 'agent' || !state.messages.some((m) => m.role === 'assistant')) {
      throw new Error('assistant expected an assistant message')
    }
  }
}

if (import.meta.main) {
  try {
    await verifyDemo()
    console.log('demo verify: ok')
  } catch (err) {
    console.error('demo verify: failed')
    console.error(err)
    process.exit(1)
  }
}
