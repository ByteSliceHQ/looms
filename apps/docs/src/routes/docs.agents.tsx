import { createFileRoute, Link } from '@tanstack/react-router'

import modelAgent from '../../../../examples/model-agent.ts?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/agents')({
  head: () => pageHead('/docs/agents'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Agents and model providers</h1>

      <p>
        An agent is a built-in thread kind. It can call function tools or spawn workflow, agent, and
        custom-thread children. Looms runs agent turns; model providers return messages and tool
        requests.
      </p>
      <h2 id="connect-a-model">
        Connect a model
        <a className="heading-anchor" href="#connect-a-model" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="bash">{`npm install @swirls/looms @openrouter/ai-sdk-provider zod
export OPENROUTER_API_KEY=your-key
export LOOMS_MODEL=your-provider-model-id`}</CodeBlock>
      <p>
        Save the following as <code>agent.ts</code> and run <code>bun agent.ts</code>. Choose a
        model ID supported by your provider. This example uses memory, so exiting discards its
        history; use the quickstart storage configuration to persist it. Keep provider secrets on
        the server.
      </p>
      <CodeBlock lang="ts" code={modelAgent} />
      <h2 id="streaming-and-conversation-history">
        Streaming and conversation history
        <a
          className="heading-anchor"
          href="#streaming-and-conversation-history"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        <code>vercelLlm</code> enables streaming by default when the turn supplies a text-delta
        callback. Subscribe through <code>@swirls/looms/client</code> or React projections while
        work executes. An awaited start result arrives after its wake cycle; use a streaming start
        or subscribe to a known run ID if you need events before it returns.
      </p>
      <p>
        Set <code>conversational: true</code> for an agent that should accept later user messages.
        Use <code>userMessage(text)</code> with signal. For long conversations, decide how much
        history to send to the model and when to summarize it.
      </p>
      <h2 id="agent-sessions">
        Agent sessions
        <a className="heading-anchor" href="#agent-sessions" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Use <code>defineAgentSession</code> when messages need a durable mailbox. A session admits
        one turn at a time, deduplicates message IDs, and keeps queued messages across restarts.
        Submit messages with <code>submitAgentMessage</code>.
      </p>
      <p>
        Delivery can be <code>followUp</code>, <code>steer</code>, or <code>nextTurn</code>. A
        follow-up starts its own turn in FIFO order. A steer targets the active turn and falls back
        to a follow-up if it arrives too late. A next-turn message becomes context without starting
        a turn.
      </p>
      <CodeBlock lang="ts">{`const session = defineAgentSession({
  name: 'support-session',
  agent: supportAgent,
  idleTimeoutMs: 30 * 60_000,
})

const { runId } = await looms.start(session, {})
await looms.signal(runId, [
  submitAgentMessage('message-1042', 'Where is my order?', {
    delivery: 'followUp',
  }),
])`}</CodeBlock>
      <p>
        Register the session and its pinned agent definition in the agent module. Use stable message
        IDs when retrying ingress. Cancelling the active turn leaves queued messages in the mailbox.
      </p>
      <h2 id="tools-and-child-threads">
        Tools and child threads
        <a
          className="heading-anchor"
          href="#tools-and-child-threads"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A function tool returns JSON. Use <code>asAgentTool</code>, <code>asWorkflowTool</code>, or{' '}
        <code>asThreadTool</code> to delegate to a child. Register that child's definition in its
        owning module. Child execution appears in the same run log.
      </p>
      <p>
        Validate tool inputs and check permissions in your application. A model's request to perform
        an operation is not authorization. Keep approval checks in deterministic workflow code.
      </p>
      <h2 id="limits-failures-and-cancellation">
        Limits, failures, and cancellation
        <a
          className="heading-anchor"
          href="#limits-failures-and-cancellation"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Set <code>maxTurns</code> and, when needed, <code>stopWhen</code> using{' '}
        <code>stepCountIs</code> or a custom predicate. Turn limits are not token or spending
        limits. Enforce provider quotas and application budgets separately; current adapter usage
        should not be treated as a billing ledger.
      </p>
      <p>
        Use <code>looms.cancel(runId, threadId?)</code> to request cancellation. External operations
        already accepted by another system cannot be undone by cancellation. Tool handlers receive
        an abort signal where available; forward it to cancellable I/O. Inspect failure events and
        test your recovery policy.
      </p>
      <h2 id="structured-output-and-custom-models">
        Structured output and custom models
        <a
          className="heading-anchor"
          href="#structured-output-and-custom-models"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Input schemas validate inputs; they do not automatically guarantee model output shape.
        Validate structured output in a tool or custom turn and return a JSON-compatible result.
        Implement <code>LlmAdapter</code> for another model API or use <code>runTurn</code> for a
        fully controlled turn. Without either, the built-in agent uses a deterministic stub; it does
        not contact an LLM.
      </p>
      <p>
        Continue with <Link to="/docs/approvals">human approvals</Link> and{' '}
        <Link to="/docs/reliability">interrupted model calls</Link>.
      </p>
    </>
  )
}
