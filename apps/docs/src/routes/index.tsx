import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { GuidedRun } from '../components/guided-run'
import { LandingDebugger, LandingDebuggerFallback } from '../components/landing-debugger'
import { Illustration } from '../illustrations/illustration'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Looms · Durable execution you can extend' },
      {
        name: 'description',
        content:
          'Durable execution for agents, workflows, and whatever you build next. Define custom thread kinds, compose them in one run, and build live views from recorded history.',
      },
      { property: 'og:title', content: 'Looms · Durable execution you can extend' },
      {
        property: 'og:description',
        content: 'Agents, workflows, and your own thread types. One durable runtime.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://looms.sh/' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: 'https://looms.sh/' }],
  }),
  component: Landing,
})

function Landing() {
  return (
    <main id="main-content" className="landing mx-auto max-w-[68rem] px-5 py-14 md:px-8 md:py-20">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <h1 className="hero-title">
            Durable execution for agents, workflows, and whatever you build next.
          </h1>
          <p className="hero-description">
            Agents and workflows are built-in thread types. Define your own, nest them together, and
            follow every step through one durable history.
          </p>
          <div className="landing-actions">
            <Link className="primary-action" to="/docs/quickstart">
              Get started →
            </Link>
            <Link to="/docs/when-to-use">Is Looms a fit?</Link>
          </div>
          <CodeBlock lang="bash">
            {'npm install @looms/runtime @looms/agent @looms/workflow'}
          </CodeBlock>
        </div>
        <GuidedRun />
      </div>

      <section className="landing-section">
        <h2>Define your own thread types.</h2>
        <p className="section-intro">
          An agent loop and a workflow DAG are two ways of running work. Looms lets you define
          another: an auction, a review policy, a device controller. Compose them in one run, with
          one shared history.
        </p>
        <div className="thread-composition" aria-label="Example of custom thread composition">
          <div>
            <small>agent</small>
            <strong>Procurement assistant</strong>
            <p>Finds suppliers and starts a purchase.</p>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <small>workflow</small>
            <strong>Purchase process</strong>
            <p>Coordinates bidding, review, and fulfillment.</p>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <small>your custom kind</small>
            <strong>Auction</strong>
            <p>Accepts bids until a deadline and returns a winner.</p>
          </div>
        </div>
        <Link to="/docs/concepts/runs-and-threads">Build a custom thread →</Link>
      </section>

      <section className="landing-section grid gap-10 md:grid-cols-3">
        <div>
          <Illustration name="log" />
          <h2 className="feature-title">Recover recorded progress</h2>
          <p>
            Load durable history after a restart. Historical replay rebuilds state without
            dispatching effects; external actions interrupted by a crash need safe retries.
          </p>
          <Link to="/docs/reliability">Understand the guarantees →</Link>
        </div>
        <div>
          <Illustration name="wait" />
          <h2 className="feature-title">Wait for the world</h2>
          <p>
            Pause for a human, webhook, timer, or child thread. Keep decisions in the log and resume
            when the matching event arrives.
          </p>
          <Link to="/docs/approvals">Add a human decision →</Link>
        </div>
        <div>
          <Illustration name="projections" />
          <h2 className="feature-title">Show what happened</h2>
          <p>
            Use the same events to render conversations, approval queues, and debugging views. Build
            shared indexes for work across runs.
          </p>
          <Link to="/docs/projectors">Connect your UI →</Link>
        </div>
      </section>

      <section className="landing-section grid items-start gap-10 md:grid-cols-2">
        <div>
          <h2>Add your own modules.</h2>
          <p>
            Define events, effects, thread kinds, and projections in a module. Built-in modules use
            the same extension model as yours.
          </p>
          <Link to="/docs/modules">Write a module →</Link>
        </div>
        <CodeBlock lang="ts">{`import { createLooms } from '@looms/runtime'
import { agent } from '@looms/agent'
import { workflow } from '@looms/workflow'
import { approval } from '@looms/approval'
import { auction } from './auction'
import { buyer, purchase, llm } from './definitions'

const looms = createLooms({
  modules: [
    agent({ definitions: [buyer], llm }),
    workflow({ definitions: [purchase] }),
    approval(),
    auction,
  ],
})

await looms.start(buyer, 'Find a supplier')`}</CodeBlock>
      </section>

      <section className="landing-section grid items-start gap-10 md:grid-cols-2">
        <div>
          <h2>One timeline across every thread.</h2>
          <p className="section-intro">
            Follow delegation, tool results, and decisions in one place. Select a thread or event in
            this recorded run to see how the work unfolded.
          </p>
          <Link to="/docs/operations">Inspect your runs →</Link>
        </div>
        <ClientOnly fallback={<LandingDebuggerFallback />}>
          <LandingDebugger />
        </ClientOnly>
      </section>

      <section className="landing-section">
        <h2>Start with a run.</h2>
        <p className="section-intro">
          Run locally with Bun and SQLite, then take the same definitions to Cloudflare Durable
          Objects.
        </p>
        <div className="landing-actions">
          <Link className="primary-action" to="/docs/quickstart">
            Run the durable example →
          </Link>
          <Link to="/docs/hosting-and-storage">Deployment guide</Link>
          <a href="https://github.com/ByteSliceHQ/looms">Source on GitHub</a>
        </div>
        <footer className="landing-footer">
          <span>Looms by ByteSlice</span>
          <Link to="/docs/api">API reference</Link>
          <Link to="/docs/security">Security</Link>
          <Link to="/docs/math">Execution model</Link>
        </footer>
      </section>
    </main>
  )
}
