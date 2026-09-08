import { defineAgent, defineTool, defineWorkflow } from '@looms/core'
import { createLooms } from '@looms/runtime'
import { Predicate, Schema } from 'effect'

const NameInputSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
})

const NumberInputSchema = Schema.Struct({
  n: Schema.optional(Schema.Number),
})

const echo = defineAgent({
  name: 'echo',
  instructions: 'Echo the user message.',
  runTurn: ({ messages, input }) => {
    const last = [...messages].reverse().find((m) => m.role === 'user')
    const text =
      last?.content ??
      (Predicate.isString(input) ? input : JSON.stringify(input ?? null))
    return {
      message: { role: 'assistant', content: text },
      done: true,
      output: { text },
    }
  },
})

const greeter = defineAgent({
  name: 'greeter',
  instructions: 'Greet using the greet tool when helpful.',
  tools: [
    defineTool({
      name: 'greet',
      description: 'Return a greeting',
      handler: (input) => {
        const parsed = Schema.decodeUnknownSync(NameInputSchema)(input ?? {})
        const name = parsed.name ?? 'world'
        return { greeting: `Hello, ${name}!` }
      },
    }),
  ],
  runTurn: ({ turn, messages }) => {
    if (turn === 1) {
      const last = [...messages].reverse().find((m) => m.role === 'user')
      let name = 'world'
      try {
        const parsed = Schema.decodeUnknownSync(NameInputSchema)(
          JSON.parse(last?.content ?? '{}'),
        )
        name = parsed.name ?? name
      } catch {
        name = last?.content || 'world'
      }
      return {
        message: {
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'tc_greet', name: 'greet', arguments: { name } }],
        },
        toolCalls: [{ id: 'tc_greet', name: 'greet', arguments: { name } }],
      }
    }
    const toolMsg = [...messages].reverse().find((m) => m.role === 'tool')
    return {
      message: { role: 'assistant', content: toolMsg?.content ?? 'done' },
      done: true,
      output: toolMsg ? JSON.parse(toolMsg.content) : null,
    }
  },
})

const pipeline = defineWorkflow({
  name: 'pipeline',
  nodes: [
    {
      id: 'double',
      run: (ctx) => {
        const parsed = Schema.decodeUnknownSync(NumberInputSchema)(ctx.input ?? {})
        return (parsed.n ?? 0) * 2
      },
    },
    {
      id: 'format',
      deps: ['double'],
      run: (ctx) => ({ result: ctx.results.double ?? null }),
    },
  ],
  output: ({ results }) => results,
})

const port = Number(process.env.PORT ?? 8787)

const looms = createLooms({
  definitions: [echo, greeter, pipeline],
})
const server = looms.serve({ port })

console.log(`Looms runtime listening on http://127.0.0.1:${server.port}`)
console.log('Registered: echo, greeter, pipeline')
