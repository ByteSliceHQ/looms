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

## Attachments

A message can carry files: images, recordings, documents. Store the bytes wherever suits the application (R2, S3, a database) and send a reference with the message. The run log holds only the reference.

```ts
import { steer, userMessage } from '@swirls/looms/agent'

const screenshot = { id: 'uploads/7f3a', mediaType: 'image/png', name: 'checkout.png' }

await looms.signal(runId, [
  userMessage({ content: 'Why does this page overflow?', attachments: [screenshot] }),
])
```

`steer`, agent session messages and thread input shaped `{ text, attachments }` take the same list. Tell the adapter how to read a reference when it builds a model call:

```ts
const llm = vercelLlm({
  model,
  resolveAttachment: async (attachment, run) => {
    // A model can be handed any id, so read only what belongs to the run's tenant.
    if (!attachment.id.startsWith(`${run.attributes.tenant}/`)) {
      return null
    }

    const object = await bucket.get(attachment.id)

    return object ? new Uint8Array(await object.arrayBuffer()) : null
  },
})
```

The second argument is the run the model call is made for: its `runId`, `threadId`, `attributes` and `secrets`. A tool's `handler(input, ctx)` and an agent's `resolveTools(ctx)` receive the same values.

Images are sent as image parts and everything else as file parts. Return `null` for a file the model should not be sent (one that is gone, too large, or of a type the model cannot read): it is sent by its `url` when the reference has one, and otherwise the message text names it so the model knows it exists. A custom adapter can do the same with `resolveAttachments` and `toModelMessages(messages, { attachments })`.

A tool can show the model a file too. When a tool result has an `attachments` list at its top level, the files are sent to the model beside the result. A file the adapter cannot read is left out, and the result's own JSON still names it. Whether a provider accepts files in a tool result depends on the provider and the media type.

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
- `maxTurns` is a hard cap on model turns. A conversational agent counts from its latest user message, so the cap applies to each reply; other agents count every turn of the run.
- `stopWhen` completes the run gracefully (for example after an `answer` tool).
- Tools can be functions, other agents, workflows, evaluators, or `gate()` approvals.

## Structured output, compaction, and turn hooks

### Structured output

Set `output` to a schema and the model gets a `submit_output` tool that takes that schema. An invalid submission returns the validation error to the model so it can correct the fields and call the tool again. Once a submission passes, it becomes the thread output when the agent finishes, in place of `{ text }`.

### Context compaction

When the model call fails because the prompt exceeded the context window, Looms runs `compact` (or `defaultAgentCompactor`), records `agent.context.compacted` with the shorter conversation, and retries the turn once. The default keeps the first message and the most recent ones, and never keeps a tool result without the assistant message that requested it.

### Tools resolved per turn

`resolveTools({ threadId, turn, input })` adds tools beside the static `tools`, such as integrations configured for one tenant. Looms calls it before each model turn and again when a tool runs, so it must return the same tools for the same input and turn.

### Tools from an MCP server

`mcpTools` turns the tools of a Model Context Protocol server into agent tools. It speaks streamable HTTP, one POST per request, so it needs only `fetch`:

```ts
import { defineAgent, mcpTools } from '@swirls/looms/agent'

const records = mcpTools({
  url: 'https://example.test/mcp',
  headers: (run) => ({ authorization: `Bearer ${run.secrets.token}` }),
  bind: (run) => ({ tenantId: run.attributes.tenant ?? '' }),
})

const clerk = defineAgent({ name: 'clerk', instructions, resolveTools: (ctx) => records(ctx) })
```

`bind` supplies arguments the host owns, such as the tenant. Each bound field goes only to the tools whose input schema declares it, and is removed from those tools' schemas, so the model neither sees nor sets it. A tool that does not declare a bound field never receives it, so a server that refuses unknown arguments works too. A field bound to `undefined` has no value for this run: it stays hidden and is not sent, and a tool that _requires_ it is left out of the run's tools, because neither the host nor the model could make a valid call to it. `only` keeps a subset of the server's tools and `prefix` renames them. The tool list is reused for `cacheMs` (one minute by default). A result with `isError` fails the tool call with the server's text, and `structuredContent` is returned in preference to text.

### Gates and usage

Product-specific gates such as credit checks belong in **effect admission** (covers local and worker paths). Use `onAdmit(callLlmEffect, …)` with `failEffect({ error, nonRetryable: true })` before the attempt runs; see [Modules](./modules.md#effect-middleware).

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

## Scripted models in tests

Without an `llm`, the agent module answers with a scripted model: it echoes the last user message, or makes the tool calls `llmPolicy.toolCallsFor` returns. The callback sees the agent's turn and what a real `llm.complete` receives about the call, so a script can tell which agent, run and model it serves without parsing the instructions:

```ts
agent({
  definitions: [triage, fixer],
  llmPolicy: {
    toolCallsFor: (ctx) => {
      // ctx.agent → { name: 'triage', version: '1' }, ctx.model → the agent's model id
      // ctx.run → { runId, threadId, attributes, secrets }, ctx.turn, ctx.input, ctx.messages
      return ctx.agent.name === 'triage' && ctx.turn === 1
        ? [{ id: 'call_1', name: 'board_post', arguments: { channel: 'eng', text: 'fix it' } }]
        : undefined
    },
  },
})
```

## Custom adapter

Implement `complete` for one model call. Besides the messages and tools, it receives `agent` (the agent's name and version), `model` (the agent's model id, when it set one), `turn`, `input`, and `run` (the run id, thread id, attributes and secrets of the call).

Implement `complete` for one model call: map Looms messages and tool specs into your SDK, return an assistant message plus optional `{ id, name, arguments }` tool calls. Do not execute tools in the adapter — Looms does that so results are on the log.

If `onTextDelta` is present, forward tokens. The agent module appends ephemeral `agent.turn.text_delta` events via `ctx.emit` so a chat UI can render tokens as they arrive.
