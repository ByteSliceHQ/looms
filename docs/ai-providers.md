# AI providers

Looms is provider-agnostic. The host owns the durable agent loop; an `LlmAdapter` performs **one model call** and returns an assistant message plus optional tool calls. It does not execute tools and does not loop.

## Why Looms owns the loop

The AI SDK / TanStack / Effect AI step loops (`maxSteps`, `stopWhen`, `chat()` with `maxIterations`) run inside a single process. That is invisible to the event log: no crash recovery mid-loop, no HITL park, no child actors, nothing for the demo timeline to show.

Looms maps that loop onto events:

1. `agent.turn` owed work → `LlmAdapter.complete({ messages, toolSpecs })`
2. `agent.message` + `agent.tool_call.requested` (or `actor.completed` / idle)
3. Function tools run inline (`tool.result`). Agent/workflow tools `child.spawned` and resume via `tool.result` + `child.completed`
4. Reducer schedules the next `agent.turn` until the model returns no tool calls, `maxTurns` is hit, or `stopWhen` fires

## The adapter contract

```ts
interface LlmAdapter {
  complete(args: {
    model?: string
    instructions: string
    messages: Message[]
    tools: ToolLike[]
    toolSpecs?: LlmToolSpec[] // { name, description, inputJsonSchema }
    onTextDelta?: (delta: string) => void | Promise<void>
    signal?: AbortSignal
  }): Promise<AgentTurnResult>
}
```

Wire it with `createLooms({ llm })`. Tests use `makeStubLlm` / `StubLlmLive`.

### Writing an adapter

1. Convert Looms `Message[]` to the SDK prompt (skip `role: 'system'` — pass `instructions` separately if the SDK wants that).
2. Convert `toolSpecs` to SDK tools **without `execute` / handlers**.
3. Call the SDK once (`generateText` / `streamText` / `LanguageModel.generateText` / `chat({ agentLoopStrategy: maxIterations(1) })`).
4. Map returned tool calls to `{ id, name, arguments }`.
5. If `onTextDelta` is present, forward text deltas so the runtime can append ephemeral `agent.turn.text_delta` events.

## Vercel AI SDK (`@looms/ai-vercel`)

```ts
import { vercelLlm } from '@looms/ai-vercel'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createLooms } from '@looms/runtime'

const looms = createLooms({
  definitions,
  llm: vercelLlm({
    model: createOpenRouter({ apiKey }).chat('openai/gpt-4o-mini'),
    stream: true,
  }),
})
```

`vercelLlm` uses `generateText` / `streamText` with `jsonSchema(spec.inputJsonSchema)` tools and no `execute`. Any AI SDK `LanguageModel` works (OpenAI, Anthropic, OpenRouter, Gateway).

## Effect AI (sketch)

`effect/unstable/ai` already ships inside Effect 4. A future `@looms/ai-effect` would wrap `LanguageModel`:

```ts
const result = yield* LanguageModel.generateText({
  prompt: messages,
  toolkit,
  disableToolCallResolution: true,
})
```

Provide it as `Layer<LlmTag, never, LanguageModel>`.

## TanStack AI (sketch)

```ts
chat({
  adapter: openaiText('gpt-5.2'),
  messages,
  tools: specs.map((spec) => toolDefinition({ name: spec.name, ... })),
  agentLoopStrategy: maxIterations(1),
})
```

Do not attach `.server()` executors — Looms executes tools.

## Workflows and agents as tools

`defineAgent({ tools: [hitl, pipeline, specialist] })` is enough. `normalizeTools` wraps definitions with `asWorkflowTool` / `asAgentTool`, defaulting `name` / `description` from the definition. JSON Schema for the model comes from:

1. explicit `inputSchema`
2. Standard JSON Schema (`~standard.jsonSchema`)
3. Effect `Schema.toStandardJSONSchemaV1`
4. `{ type: 'object' }`

HITL composes: the assistant calls `hitl` → child workflow parks on `review.requested` → the UI decides → `tool.result` returns to the parent → next turn.

## Agent loop (`maxSteps` / `stopWhen`)

| AI SDK | Looms |
|---|---|
| `maxSteps` / `stepCountIs(n)` | `maxTurns` (hard fail) and `stopWhen: stepCountIs(n)` (graceful complete) |
| no tool calls → stop | no tool calls → `actor.completed` (or idle if `conversational`) |
| tool calls → continue | reducer schedules the next `agent.turn` after all `tool.result`s |
| `hasToolCall('answer')` | `stopWhen: hasToolCall('answer')` |
| `stopWhen` predicates | `AgentDefinition.stopWhen` |

```ts
import { defineAgent, hasToolCall, stepCountIs } from '@looms/core'

defineAgent({
  name: 'researcher',
  instructions: '…',
  maxTurns: 20,
  stopWhen: (ctx) => hasToolCall('answer')(ctx) || stepCountIs(8)(ctx),
})
```

`conversational: true` skips `actor.completed` so a chat actor stays running and the next `agent.message.received` starts another turn.
