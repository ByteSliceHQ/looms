import { createFileRoute, Link } from '@tanstack/react-router'

import jevExample from '../../../../examples/jev.ts?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/jev')({
  head: () => pageHead('/docs/jev'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Jev evaluations</h1>
      <p>
        <code>defineJev</code> is the Jev kind builder: <code>defineKind('jev', …)</code> with typed
        questions and a <code>route</code> function. Jev is not a chat model. It answers boolean
        (with a probability), choice, or score questions, writes <code>jev.evaluated</code> on the
        run log, and lets a durable workflow branch on that result.
      </p>
      <h2 id="score-then-branch">
        Score, then branch
        <a className="heading-anchor" href="#score-then-branch" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Pass your own <code>questions</code>. Use <code>skipModel</code> when the input should not
        call the model, and <code>route</code> to turn answers into an application string such as{' '}
        <code>auto</code> or <code>review</code>. The <code>reason</code> is <code>model</code>,{' '}
        <code>uncertain</code>, <code>skipped</code>, or <code>unavailable</code>: confidence as
        control flow. The example scores a refund, skips large amounts, auto-pays a routine case,
        and spawns a stub agent when review is needed. It uses the built-in stub, so it needs no API
        key.
      </p>
      <CodeBlock lang="ts" code={jevExample} />
      <h2 id="compose-with-workflows">
        Compose with workflows and agents
        <a
          className="heading-anchor"
          href="#compose-with-workflows"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Spawn the definition from a workflow node with <code>ctx.spawn(scoreRefund, input)</code>,
        pass it to an agent as <code>asJevTool</code>, or call{' '}
        <code>evaluate(scoreRefund, input)</code> like <code>gate()</code> when you want an inline
        wait instead of a child thread. Register the definition on{' '}
        <code>{'jev({ definitions: [scoreRefund] })'}</code>.
      </p>
      <p>
        Branch on <code>route</code> in deterministic workflow code. Treat <code>uncertain</code>{' '}
        and <code>unavailable</code> the same way you treat a review path unless you have a cheaper
        fallback. After a crash, the answers and decision are still on <code>jev.evaluated</code>.
      </p>
      <h2 id="connect-jev">
        Connect the hosted model
        <a className="heading-anchor" href="#connect-jev" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="ts">{`import { vercelJev } from '@swirls/looms/ai-vercel'
import { defineJev, jev } from '@swirls/looms/jev'

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
        probability !== null && (probability < 0.1 || probability >= 0.9)
          ? 'model'
          : 'uncertain',
    }
  },
})

jev({
  definitions: [scoreRefund],
  evaluator: vercelJev(),
})`}</CodeBlock>
      <p>
        <code>vercelJev</code> uses the Vercel AI SDK <code>experimental_evaluate</code> API and the{' '}
        <code>typesafe-ai/jev</code> model. Keep <code>AI_GATEWAY_API_KEY</code> on the server.
        Without an adapter, the jev module uses a deterministic stub. See{' '}
        <Link to="/docs/agents">agents and model providers</Link> for chat adapters, and{' '}
        <Link to="/docs/examples">examples</Link> for the stubbed script.{' '}
        <code>defineLogTriage</code> is an optional sample rubric, not the module API.
      </p>
    </>
  )
}
