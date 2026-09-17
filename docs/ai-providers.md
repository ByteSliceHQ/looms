# AI providers

Pass an `LlmAdapter` to the agent module: `agent({ llm })`. Looms calls the model once per turn, writes the assistant message (and any tool calls) to the run log, then executes tools and resumes. That is what makes a crash-safe, approvable agent possible — the model never owns the loop.

Without `llm`, the agent module uses a stub suitable for tests and scripted `runTurn` agents.

## Vercel AI SDK

Any AI SDK `LanguageModel` works (OpenAI, Anthropic, OpenRouter, Gateway):

```ts
import { agent } from '@swirls/looms/agent'
import { vercelLlm } from '@swirls/looms/ai-vercel'
import { approval } from '@swirls/looms/approval'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createLooms } from '@swirls/looms/runtime'
import { workflow } from '@swirls/looms/workflow'
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
import { defineAgent, hasToolCall, stepCountIs } from '@swirls/looms/agent'

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
- Tools can be functions, other agents, workflows, Jev evaluators, or `gate()` approvals.

## TypeSafe Jev

Jev is not a chat model. Use `defineJev` with your own `questions` and pass `vercelJev()` into the jev module. The evaluation lands on the run log like any other effect, so a workflow can branch on `route` and `reason` after a crash.

```ts
import { vercelJev } from '@swirls/looms/ai-vercel'
import { defineJev, jev } from '@swirls/looms/jev'
import { createLooms } from '@swirls/looms/runtime'

const scoreRefund = defineJev({
  name: 'score-refund',
  questions: {
    needsReview: {
      type: 'boolean',
      instructions: 'Should this refund be reviewed before it ships?',
    },
  },
  route: ({ answers }) => {
    const probability =
      answers.needsReview?.type === 'boolean' ? answers.needsReview.probability : null

    return {
      route: probability !== null && probability < 0.1 ? 'auto' : 'review',
      reason:
        probability !== null && (probability < 0.1 || probability >= 0.9) ? 'model' : 'uncertain',
    }
  },
})

const looms = createLooms({
  modules: [
    jev({
      definitions: [scoreRefund],
      evaluator: vercelJev(),
    }),
  ],
})
```

`vercelJev` needs the Vercel AI SDK `experimental_evaluate` API (`ai` 7.0.105+) and `AI_GATEWAY_API_KEY`. It calls `typesafe-ai/jev` with a 2s timeout and zero-data-retention, then maps boolean/choice/score answers onto `jev.evaluated`. Without an adapter, the jev module uses a deterministic stub suitable for tests and examples.

## Custom adapter

Implement `complete` for one model call: map Looms messages and tool specs into your SDK, return an assistant message plus optional `{ id, name, arguments }` tool calls. Do not execute tools in the adapter — Looms does that so results are on the log.

If `onTextDelta` is present, forward tokens. The agent module appends ephemeral `agent.turn.text_delta` events via `ctx.emit` so a chat UI can render tokens as they arrive.
