import { asAgentTool, defineAgent, defineTool, defineWorkflow, type JsonValue } from '@looms/core'
import { z } from 'zod'

/** Deterministic echo agent. */
export const echo = defineAgent({
  name: 'echo',
  instructions: 'Echo the user message.',
  input: z.object({ text: z.string() }),
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: input.text },
    done: true,
    output: { text: input.text },
  }),
})

/** Child agent used via agent-tool. */
export const specialist = defineAgent({
  name: 'specialist',
  instructions: 'Specialize on a short task.',
  input: z.object({ task: z.string() }),
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: `done:${input.task}` },
    done: true,
    output: { result: `done:${input.task}` },
  }),
})

function findLastToolMessage(messages: readonly { role: string; content: string }[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg?.role === 'tool') return msg
  }
  return undefined
}

const SpecialistInputSchema = z.object({ task: z.string().optional() })

/** Parent agent that spawns a child via agent-tool. */
export const orchestrator = defineAgent({
  name: 'orchestrator',
  instructions: 'Delegate work to the specialist tool.',
  input: z.object({ task: z.string().optional().default('default') }),
  tools: [
    asAgentTool({
      name: 'specialist',
      description: 'Run the specialist child agent',
      agent: specialist,
      mapInput: (input) => {
        const parsed = SpecialistInputSchema.safeParse(input)
        return { task: parsed.success && parsed.data.task ? parsed.data.task : 'default' }
      },
    }),
  ],
  runTurn: ({ turn, messages, input }) => {
    if (turn === 1) {
      const task = input.task ?? 'default'
      return {
        message: {
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'tc_spec', name: 'specialist', arguments: { task } }],
        },
        toolCalls: [{ id: 'tc_spec', name: 'specialist', arguments: { task } }],
      }
    }
    const toolMsg = findLastToolMessage(messages)
    let output: JsonValue = null
    if (toolMsg) {
      try {
        // SAFETY: JSON.parse output is JsonValue when parsing structured JSON
        output = JSON.parse(toolMsg.content) as JsonValue
      } catch {
        output = toolMsg.content
      }
    }
    const strParsed = z.string().safeParse(output)
    const content = strParsed.success ? strParsed.data : JSON.stringify(output)
    return {
      message: { role: 'assistant', content },
      done: true,
      output,
    }
  },
})

export const greeter = defineAgent({
  name: 'greeter',
  instructions: 'Greet using the greet tool.',
  input: z.object({ name: z.string().optional().default('world') }),
  tools: [
    defineTool({
      name: 'greet',
      description: 'Return a greeting',
      input: z.object({ name: z.string().optional().default('world') }),
      handler: ({ name }) => ({ greeting: `Hello, ${name}!` }),
    }),
  ],
  runTurn: ({ turn, messages, input }) => {
    if (turn === 1) {
      const name = input.name ?? 'world'
      return {
        message: {
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'tc_greet', name: 'greet', arguments: { name } }],
        },
        toolCalls: [{ id: 'tc_greet', name: 'greet', arguments: { name } }],
      }
    }
    const toolMsg = findLastToolMessage(messages)
    let output: JsonValue = null
    if (toolMsg) {
      try {
        // SAFETY: JSON.parse output is JsonValue when parsing structured JSON
        output = JSON.parse(toolMsg.content) as JsonValue
      } catch {
        output = toolMsg.content
      }
    }
    return {
      message: { role: 'assistant', content: toolMsg?.content ?? 'done' },
      done: true,
      output,
    }
  },
})

/** HITL workflow that parks on review then completes. */
export const hitl = defineWorkflow({
  name: 'hitl',
  description: 'Human-in-the-loop approval gate',
  input: z.object({ doc: z.string().optional().default('draft') }),
  nodes: [
    {
      id: 'prepare',
      run: (ctx) => ({ draft: ctx.input.doc }),
    },
    {
      id: 'review',
      deps: ['prepare'],
      run: (ctx) =>
        ctx.requestReview({
          title: 'Approve draft?',
          description: JSON.stringify(ctx.results.prepare ?? null),
        }),
    },
    {
      id: 'finalize',
      deps: ['review'],
      run: (ctx) => ({ approved: true, review: ctx.results.review ?? null }),
    },
  ],
  output: ({ results }) => results,
})

/** Nested workflow-as-tool style pipeline. */
export const pipeline = defineWorkflow({
  name: 'pipeline',
  input: z.object({ n: z.number().default(21) }),
  nodes: [
    {
      id: 'double',
      run: (ctx) => ctx.input.n * 2,
    },
    {
      id: 'spawn',
      deps: ['double'],
      run: (ctx) =>
        ctx.spawnAgent(echo, {
          text: `n=${JSON.stringify(ctx.results.double ?? null)}`,
        }),
    },
    {
      id: 'format',
      deps: ['spawn'],
      run: (ctx) => ({
        doubled: ctx.results.double ?? null,
        child: ctx.results.spawn ?? null,
      }),
    },
  ],
  output: ({ results }) => results,
})

const greet = defineTool({
  name: 'greet',
  description: 'Return a greeting for a person by name',
  input: z.object({ name: z.string() }),
  handler: ({ name }) => ({ greeting: `Hello, ${name}!` }),
})

/** Conversational assistant that can call tools, agents, and workflows. */
export const assistant = defineAgent({
  name: 'assistant',
  conversational: true,
  input: z.string(),
  instructions: [
    'You are the Looms demo assistant.',
    'You can greet people, delegate a short task to the specialist agent,',
    'run the hitl approval workflow, or run the numeric pipeline workflow.',
    'Use tools when they help; otherwise answer directly.',
    'When you use hitl, tell the user a review will appear on the right.',
  ].join(' '),
  tools: [greet, specialist, hitl, pipeline],
})

export const definitions = [echo, greeter, specialist, orchestrator, hitl, pipeline, assistant] as const
