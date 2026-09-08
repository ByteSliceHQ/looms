import { asAgentTool, asEffectsTool, defineAgent, defineTool } from '@looms/agent'
import { gate } from '@looms/approval'
import { createWaitId, invoke, isJsonObject, isJsonString, wait, type JsonValue } from '@looms/core'
import { defineWorkflow } from '@looms/workflow'
import { z } from 'zod'

function findLastToolMessage(messages: readonly { role: string; content: string }[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg?.role === 'tool') return msg
  }
  return undefined
}

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

const SpecialistInputSchema = z.object({ task: z.string().optional() })

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
      handler: (args) => {
        const name = isJsonObject(args) && isJsonString(args.name) ? args.name : 'world'
        return { greeting: `Hello, ${name}!` }
      },
    }),
  ],
  runTurn: ({ turn, messages, input }) => {
    if (turn === 1) {
      const name = isJsonObject(input) && isJsonString(input.name) ? input.name : 'world'
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

function isRejected(result: JsonValue | null): boolean {
  return isJsonObject(result) && result.outcome === 'reject'
}

export const checkout = defineWorkflow({
  name: 'checkout',
  description: 'Approval gate above threshold, then a payments charge',
  input: z.object({
    amount: z.number().default(150),
    currency: z.string().default('USD'),
  }),
  nodes: [
    {
      id: 'gate',
      run: (ctx) => {
        if (ctx.input.amount < 100) return { skipped: true, reason: 'below-threshold' }
        return ctx.effects(gate({ title: `Approve charge of ${ctx.input.amount} ${ctx.input.currency}?` }))
      },
    },
    {
      id: 'charge',
      deps: ['gate'],
      run: (ctx) => {
        if (isRejected(ctx.results.gate ?? null)) return { charged: false, reason: 'rejected' }
        return ctx.effects([
          invoke('payments.charge', {
            amount: ctx.input.amount,
            currency: ctx.input.currency,
          }),
          wait({
            waitId: createWaitId(),
            on: { type: 'payments.charge.authorized' },
          }),
          wait({
            waitId: createWaitId(),
            on: { type: 'payments.charge.declined' },
          }),
        ])
      },
    },
    {
      id: 'notify',
      deps: ['charge'],
      run: (ctx) => ({
        notified: true,
        gate: ctx.results.gate ?? null,
        charge: ctx.results.charge ?? null,
      }),
    },
  ],
  output: ({ results }) => results,
})

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
        ctx.spawn(echo, {
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
  handler: (args) => {
    const name = isJsonObject(args) && isJsonString(args.name) ? args.name : 'person'
    return { greeting: `Hello, ${name}!` }
  },
})

const askApproval = asEffectsTool({
  name: 'ask_approval',
  description: 'Ask a human to approve or reject a request',
  effects: (input) => {
    const title = isJsonObject(input) && isJsonString(input.title) ? input.title : 'Approve this request?'
    return gate({ title })
  },
  waitOn: { type: 'approval.decided' },
})

export const assistant = defineAgent({
  name: 'assistant',
  conversational: true,
  input: z.string(),
  instructions: [
    'You are the Looms demo assistant.',
    'You can greet people, delegate a short task to the specialist agent,',
    'run checkout (approval + payments), or ask for a standalone approval.',
    'Use tools when they help; otherwise answer directly.',
  ].join(' '),
  tools: [greet, specialist, checkout, askApproval],
})

export const definitions = [echo, greeter, specialist, orchestrator, checkout, pipeline, assistant] as const
