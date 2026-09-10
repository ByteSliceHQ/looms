import { z } from 'zod'

import { asAgentTool, asEffectsTool, defineAgent, defineTool } from '@looms/agent'
import { gate } from '@looms/approval'
import { createWaitId, invoke, isJsonObject, isJsonString, wait, type JsonValue } from '@looms/core'
import { defineWorkflow } from '@looms/workflow'

function findLastToolMessage(messages: readonly { role: string; content: string }[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]

    if (msg?.role === 'tool') {
      return msg
    }
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

export const calculate = defineTool({
  name: 'calculate',
  description:
    'Perform a mathematical or statistical calculation on numbers (sum, multiply, average, percentage)',
  input: z.object({
    operation: z.enum(['multiply', 'add', 'average', 'percentage']),
    values: z.array(z.number()),
  }),
  handler: (args) => {
    const { operation, values } = args

    if (values.length === 0) {
      return { result: 0 }
    }

    switch (operation) {
      case 'multiply':
        return { result: values.reduce((acc, v) => acc * v, 1) }
      case 'add':
        return { result: values.reduce((acc, v) => acc + v, 0) }
      case 'average':
        return { result: values.reduce((acc, v) => acc + v, 0) / values.length }

      case 'percentage': {
        const first = values[0]
        const second = values[1]
        return {
          result:
            first !== undefined && second !== undefined && second !== 0
              ? (first / second) * 100
              : 0,
        }
      }

      default: {
        const exhaustiveCheck: never = operation
        return exhaustiveCheck
      }
    }
  },
})

export const queryKb = defineTool({
  name: 'query_kb',
  description: 'Look up knowledge base articles, benchmarks, and operational telemetry for a topic',
  input: z.object({ topic: z.string().default('general') }),
  handler: (args) => {
    const topic = isJsonObject(args) && isJsonString(args.topic) ? args.topic : 'general'
    return {
      topic,
      entries: [
        { key: 'cache_hit_rate', value: '94.2%', status: 'nominal' },
        { key: 'p99_latency_ms', value: '12.4ms', status: 'nominal' },
        { key: 'active_replicas', value: '3', status: 'nominal' },
      ],
      summary: `Found 3 verified telemetry records for topic: "${topic}".`,
    }
  },
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

export const researcher = defineAgent({
  name: 'researcher',
  instructions: [
    'You are a specialized researcher agent.',
    'Your goal is to gather facts, search telemetry knowledge bases, or trigger the data pipeline workflow.',
    'You have tools:',
    '- `query_kb`: look up domain knowledge, telemetry, and operational benchmark data for a topic.',
    '- `pipeline`: workflow tool that runs data computation and spawns echo subagents.',
    'Synthesize your findings and return a concise, factual summary.',
  ].join(' '),
  input: z.object({
    topic: z
      .string()
      .describe('The research topic, telemetry metric, or domain to investigate')
      .default('general'),
  }),
  tools: [queryKb, pipeline],
})

const ResearcherInputSchema = z.object({
  topic: z.string().describe('The research topic or telemetry query to investigate'),
})

export const SpecialistInputSchema = z.object({
  task: z
    .string()
    .describe('The specific topic, question, or research task to investigate and analyze'),
})

export const specialist = defineAgent({
  name: 'specialist',
  instructions: [
    'You are the Specialist agent.',
    'You handle in-depth domain problems by coordinating sub-specialists, analytical calculations, and workflows.',
    'You have the following tools available:',
    '- `researcher`: delegate deep investigation, telemetry lookups, or pipeline tasks to the researcher sub-agent.',
    '- `pipeline`: run the data calculation and verification workflow directly.',
    '- `calculate`: compute numerical expressions or metrics.',
    'Analyze the task, invoke your tools to gather facts or compute results, and provide a clear final summary.',
  ].join(' '),
  input: z.object({
    task: z
      .string()
      .describe('The specific topic, question, or research task to investigate and analyze')
      .default('general'),
  }),
  tools: [
    asAgentTool({
      name: 'researcher',
      description: 'Delegate deep investigation and fact gathering to the researcher sub-agent',
      agent: researcher,
      input: ResearcherInputSchema,
      mapInput: (input) => {
        const parsed = ResearcherInputSchema.safeParse(input)
        return { topic: parsed.success && parsed.data.topic ? parsed.data.topic : 'general' }
      },
    }),
    pipeline,
    calculate,
  ],
})

export const orchestrator = defineAgent({
  name: 'orchestrator',
  instructions: 'Delegate work to the specialist tool.',
  input: z.object({ task: z.string().optional().default('default') }),
  tools: [
    asAgentTool({
      name: 'specialist',
      description: 'Run the specialist child agent',
      agent: specialist,
      input: SpecialistInputSchema,
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

    const resultText =
      isJsonObject(output) && isJsonString(output.result)
        ? output.result
        : isJsonObject(output) && isJsonString(output.text)
          ? output.text
          : content

    return {
      message: { role: 'assistant', content },
      done: true,
      output: { result: resultText, details: output },
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
  description:
    'Run an approval gate (above $100) then charge. Blocks until the human decides in the Approvals panel; do not ask the user to approve in chat — the gate handles that. When the tool returns, report the gate outcome and charge result.',
  input: z.object({
    amount: z.number().default(150),
    currency: z.string().default('USD'),
  }),
  nodes: [
    {
      id: 'gate',
      run: (ctx) => {
        if (ctx.input.amount < 100) {
          return { skipped: true, reason: 'below-threshold' }
        }

        return ctx.effects(
          gate({ title: `Approve charge of ${ctx.input.amount} ${ctx.input.currency}?` }),
        )
      },
    },
    {
      id: 'charge',
      deps: ['gate'],
      run: (ctx) => {
        if (isRejected(ctx.results.gate ?? null)) {
          return { charged: false, reason: 'rejected' }
        }

        return ctx.effects([
          invoke(
            'payments.charge',
            {
              amount: ctx.input.amount,
              currency: ctx.input.currency,
            },
            `charge_${ctx.nodeId}`,
          ),
          wait({
            waitId: createWaitId(ctx.nodeId, 'charge'),
            on: { type: ['payments.charge.authorized', 'payments.charge.declined'] },
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
  output: ({ results }) => ({
    status: isRejected(results.gate ?? null) ? 'rejected' : 'approved',
    summary: isRejected(results.gate ?? null)
      ? 'Checkout was rejected by human approval.'
      : 'Checkout was approved and charge was authorized.',
    gate: results.gate ?? null,
    charge: results.charge ?? null,
    notify: results.notify ?? null,
  }),
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
  input: z.object({
    title: z.string().describe('The question or title for the approval request'),
  }),
  effects: (input) => {
    const title =
      isJsonObject(input) && isJsonString(input.title) ? input.title : 'Approve this request?'

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
    'You can greet people, delegate complex tasks to the specialist agent,',
    'run checkout (approval + payments), or ask for a standalone approval.',
    'When a user asks to investigate, research, analyze, or run specialist tasks, call the specialist tool.',
    'The checkout tool already includes its own human approval gate and payment charge.',
    'After a tool returns, report the actual outcome from the tool result.',
    'Never ask the user to approve or reject again after checkout (or ask_approval) has already returned a decision.',
    'Use tools when they help; otherwise answer directly.',
  ].join(' '),
  tools: [
    greet,
    asAgentTool({
      name: 'specialist',
      description:
        'Delegate technical tasks, deep investigations, or calculations to the specialist agent',
      agent: specialist,
      input: SpecialistInputSchema,
      mapInput: (input) => {
        const parsed = SpecialistInputSchema.safeParse(input)

        if (parsed.success && parsed.data.task) {
          return { task: parsed.data.task }
        }

        if (isJsonString(input)) {
          return { task: input }
        }

        return { task: 'analyze' }
      },
    }),
    checkout,
    askApproval,
  ],
})

export const definitions = [
  echo,
  greeter,
  specialist,
  researcher,
  orchestrator,
  checkout,
  pipeline,
  assistant,
] as const
