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
- Tools can be functions, other agents, workflows, evaluators, or `gate()` approvals.

## Structured output, compaction, and turn hooks

### Structured output

Set `output` to a schema and the model gets a `submit_output` tool that takes that schema. An invalid submission returns the validation error to the model so it can correct the fields and call the tool again. Once a submission passes, it becomes the thread output when the agent finishes, in place of `{ text }`.

### Context compaction

When the model call fails because the prompt exceeded the context window, Looms runs `compact` (or `defaultAgentCompactor`), records `agent.context.compacted` with the shorter conversation, and retries the turn once. The default keeps the first message and the most recent ones, and never keeps a tool result without the assistant message that requested it.

### Tools resolved per turn

`resolveTools({ threadId, turn, input })` adds tools beside the static `tools`, such as integrations configured for one tenant. Looms calls it before each model turn and again when a tool runs, so it must return the same tools for the same input and turn.

### Gates and usage

Product-specific gates such as credit checks belong in **effect middleware**. Use `onEffect(callLlmEffect, …)` with `failEffect({ error, nonRetryable: true })` before the model call runs; see [Modules](./modules.md#effect-middleware).

Every model call that reports usage records `agent.turn.usage`. Fold that event, or use the built-in `tokenUsage` projection, for durable billing.

### Team member depth

An agent that spawns another agent through a thread tool (`asAgentTool`) sends it an `agent.lineage` event with its depth, so the limit survives input schemas that strip unknown keys. A spawn beyond `TEAM_MEMBER_MAX_DEPTH` (3) returns a tool error to the calling agent. A workflow or other thread between two agents starts the count again.

## Evaluation models

An evaluator is not a chat model. Use `defineEvaluator` with your own `questions` and pass `vercelEvaluator()` into the evaluator module. Set `model` to `typesafe-ai/jev` today. A later model that answers the same boolean, choice, and score questions uses the same definition with a different `model` id. The evaluation lands on the run log like any other effect, so a workflow can branch on `route` and `reason` after a crash.

```ts
import { vercelEvaluator } from '@swirls/looms/ai-vercel'
import { defineEvaluator, evaluator } from '@swirls/looms/evaluator'
import { createLooms } from '@swirls/looms/runtime'

const scoreRefund = defineEvaluator({
  name: 'score-refund',
  model: 'typesafe-ai/jev',
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
    evaluator({
      definitions: [scoreRefund],
      evaluator: vercelEvaluator({ model: 'typesafe-ai/jev' }),
    }),
  ],
})
```

`vercelEvaluator` needs the Vercel AI SDK `experimental_evaluate` API (`ai` 7.0.105+) and `AI_GATEWAY_API_KEY`. If you omit `model`, it calls `typesafe-ai/jev`, with a 2s timeout and zero-data-retention, then maps boolean/choice/score answers onto `evaluator.evaluated`. Without an adapter, the evaluator module uses a deterministic stub suitable for tests and examples.

To use your own TypeSafe key instead of the AI Gateway, pass a provider. It resolves the adapter's `model` and any `model` on a definition, so omit `model` from the definition or use a TypeSafe id such as `jev-latest`:

```ts
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai'

vercelEvaluator({
  provider: createTypeSafeAi({ apiKey: process.env.TYPESAFE_AI_API_KEY }),
  model: 'jev-latest',
})
```

## Custom adapter

Implement `complete` for one model call: map Looms messages and tool specs into your SDK, return an assistant message plus optional `{ id, name, arguments }` tool calls. Do not execute tools in the adapter — Looms does that so results are on the log.

If `onTextDelta` is present, forward tokens. The agent module appends ephemeral `agent.turn.text_delta` events via `ctx.emit` so a chat UI can render tokens as they arrive.
