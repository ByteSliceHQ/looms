# AI providers

Pass an `LlmAdapter` to the agent module: `agent({ llm })`. Looms calls the model once per turn, writes the assistant message (and any tool calls) to the run log, then executes tools and resumes. That is what makes a crash-safe, approvable agent possible — the model never owns the loop.

Without `llm`, the agent module uses a stub suitable for tests and scripted `runTurn` agents.

## Vercel AI SDK

Any AI SDK `LanguageModel` works (OpenAI, Anthropic, OpenRouter, Gateway):

```ts
import { agent } from '@looms/agent'
import { vercelLlm } from '@looms/ai-vercel'
import { approval } from '@looms/approval'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createLooms } from '@looms/runtime'
import { workflow } from '@looms/workflow'
import { assistant, checkout } from './definitions'

const llm = vercelLlm({
  model: createOpenRouter({ apiKey }).chat('openai/gpt-4o-mini'),
  stream: true,
})

const looms = createLooms({
  modules: [
    agent({ definitions: [assistant], llm }),
    workflow({ definitions: [checkout] }),
    approval(),
  ],
})
```

Streaming tokens land on the run so a chat UI can render them as they arrive.

## Conversational agents and stopping

```ts
import { defineAgent, hasToolCall, stepCountIs } from '@looms/agent'

defineAgent({
  name: 'researcher',
  conversational: true,
  instructions: 'Research, then call answer.',
  maxTurns: 20,
  stopWhen: (ctx) => hasToolCall('answer')(ctx) || stepCountIs(8)(ctx),
  tools: [search, answer, checkout],
})
```

- `conversational: true` keeps the run open so the next user message starts another turn.
- `maxTurns` is a hard cap.
- `stopWhen` completes the run gracefully (for example after an `answer` tool).
- Tools can be functions, other agents, workflows, or `gate()` approvals.

## Custom adapter

Implement `complete` for one model call: map Looms messages and tool specs into your SDK, return an assistant message plus optional `{ id, name, arguments }` tool calls. Do not execute tools in the adapter — Looms does that so results are on the log.

If `onTextDelta` is present, forward tokens. The agent module appends ephemeral `agent.turn.text_delta` events via `ctx.emit` so a chat UI can render tokens as they arrive.
