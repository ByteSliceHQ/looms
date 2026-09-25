import { createFileRoute, Link } from '@tanstack/react-router'

import evaluatorExample from '../../../../examples/evaluator.ts?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/evaluator')({
  head: () => pageHead('/docs/evaluator'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Evaluations</h1>
      <p>
        <code>defineEvaluator</code> is an evaluator kind: <code>defineKind('evaluator', …)</code>{' '}
        with typed questions and a <code>route</code> function. An evaluator is not a chat model. It
        answers boolean (with a probability), choice, or score questions, writes{' '}
        <code>evaluator.evaluated</code> on the run log, and lets a durable workflow branch on that
        result. TypeSafe Jev is one model that speaks this API. Later models plug in through the
        same definition and a different adapter.
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
      <CodeBlock lang="ts" code={evaluatorExample} />
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
        pass it to an agent as <code>asEvaluatorTool</code>, or call{' '}
        <code>evaluate(scoreRefund, input)</code> like <code>gate()</code> when you want an inline
        wait instead of a child thread. Register the definition on{' '}
        <code>{'evaluator({ definitions: [scoreRefund] })'}</code>.
      </p>
      <p>
        Branch on <code>route</code> in deterministic workflow code. Treat <code>uncertain</code>{' '}
        and <code>unavailable</code> the same way you treat a review path unless you have a cheaper
        fallback. After a crash, the answers and decision are still on{' '}
        <code>evaluator.evaluated</code>.
      </p>
      <h2 id="connect-a-model">
        Connect a model
        <a className="heading-anchor" href="#connect-a-model" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="ts">{`import { vercelEvaluator } from '@swirls/looms/ai-vercel'
import { defineEvaluator, evaluator } from '@swirls/looms/evaluator'

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
        probability !== null && (probability < 0.1 || probability >= 0.9)
          ? 'model'
          : 'uncertain',
    }
  },
})

evaluator({
  definitions: [scoreRefund],
  evaluator: vercelEvaluator({ model: 'typesafe-ai/jev' }),
})`}</CodeBlock>
      <p>
        <code>vercelEvaluator</code> uses the Vercel AI SDK <code>experimental_evaluate</code> API.
        Pass <code>typesafe-ai/jev</code> today. A later model that answers the same boolean,
        choice, and score questions uses the same definition with a different <code>model</code> id.
        Keep <code>AI_GATEWAY_API_KEY</code> on the server. Without an adapter, the evaluator module
        uses a deterministic stub. See <Link to="/docs/agents">agents and model providers</Link> for
        chat adapters, and <Link to="/docs/examples">examples</Link> for the stubbed script.
      </p>
      <h2 id="bring-your-own-key">
        Use your own TypeSafe key
        <a className="heading-anchor" href="#bring-your-own-key" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        To call TypeSafe directly instead of through the AI Gateway, pass a provider. It resolves
        the adapter&apos;s <code>model</code> and any <code>model</code> set on a definition, so
        omit <code>model</code> from the definition or use a TypeSafe id such as{' '}
        <code>jev-latest</code>.
      </p>
      <CodeBlock lang="ts">{`import { createTypeSafeAi } from '@ai-sdk/typesafe-ai'
import { vercelEvaluator } from '@swirls/looms/ai-vercel'
import { evaluator } from '@swirls/looms/evaluator'

evaluator({
  definitions: [scoreRefund],
  evaluator: vercelEvaluator({
    provider: createTypeSafeAi({ apiKey: process.env.TYPESAFE_AI_API_KEY }),
    model: 'jev-latest',
  }),
})`}</CodeBlock>
      <p>
        Any AI SDK provider with an <code>evaluationModel(id)</code> factory works the same way. The
        demo host reads <code>TYPESAFE_AI_API_KEY</code> this way and uses the stub without it.
      </p>
    </>
  )
}
