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
        An agent is a built-in thread kind. It can call function tools or spawn workflow, agent,
        evaluator, and custom-thread children. Looms runs agent turns; model providers return
        messages and tool requests.
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
      <h2 id="stop-a-turn">
        Stop a turn
        <a className="heading-anchor" href="#stop-a-turn" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Signal <code>stopAgentTurn()</code> to end the turn in progress without ending the run. The
        agent aborts its in-flight model call or tool, cancels child threads its tool calls started
        along with anything they started, answers open tool calls with a stopped result, records{' '}
        <code>agent.turn.stopped</code>, and waits for the next message. The same signal sent to an
        agent session cancels its active turn and keeps the session open. Use{' '}
        <code>looms.cancel</code> to end the run instead.
      </p>
      <p>
        <code>steer(text)</code> interrupts by default: it ends the turn the same way, then starts a
        new turn with the steering message. Pass <code>{'{ interrupt: false }'}</code> to let the
        turn continue and include the message in its next model call.
      </p>
      <CodeBlock lang="ts">{`import { stopAgentTurn } from '@swirls/looms/agent'

// Targets the root thread; pass { threadId } to stop a different agent thread.
await looms.signal(runId, [stopAgentTurn()])`}</CodeBlock>
      <p>
        The <code>turnActivity</code> projection reports whether the run&apos;s root agent or
        session has a turn in progress. Use it to decide when a chat UI shows a Stop button, and
        send the stop through an application endpoint that authorizes the user.
      </p>
      <CodeBlock lang="tsx">{`import { turnActivity } from '@swirls/looms/agent'
import { useProjection, useRunStore } from '@swirls/looms/react'

function StopButton({ runId, onStop }: { runId: string; onStop: () => void }) {
  const store = useRunStore(runId)
  const { active } = useProjection(store, turnActivity)
  return active ? <button onClick={onStop}>Stop</button> : null
}`}</CodeBlock>
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
        A function tool returns JSON. Use <code>asAgentTool</code>, <code>asWorkflowTool</code>,{' '}
        <code>asEvaluatorTool</code>, or <code>asThreadTool</code> to delegate to a child. Register
        that child's definition in its owning module. Child execution appears in the same run log.
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
        Use <code>looms.cancel(runId, threadId?)</code> to request cancellation. Cancelling a thread
        also cancels every live thread below it, such as tool children. External operations already
        accepted by another system cannot be undone by cancellation. Tool handlers receive an abort
        signal where available; forward it to cancellable I/O. Inspect failure events and test your
        recovery policy.
      </p>
      <p>
        A failed or cancelled run stays finished. To pick it up, fork it with{' '}
        <code>looms.fork(runId)</code>: the new run re-runs the model call or tool that the failure
        or cancel cut off. See{' '}
        <Link to="/docs/operations" hash="continue-a-finished-run">
          continue a finished run
        </Link>
        .
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
