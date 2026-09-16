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
    <main id="main-content" className="mx-auto max-w-[68rem] px-5 py-14 md:px-8 md:py-20">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div className="min-w-0">
          <h1 className="text-foreground mb-6 text-[clamp(2rem,3.5vw,2.8rem)] leading-[1.12] font-semibold tracking-[-0.035em]">
            Durable execution for agents, workflows, and whatever you build next.
          </h1>
          <p className="text-[1.1rem] leading-[1.65]">
            Agents and workflows are built-in thread types. Define your own, nest them together, and
            follow every step through one durable history.
          </p>
          <div className="my-7 flex flex-wrap items-center gap-5">
            <Link
              className="bg-foreground text-background cursor-pointer rounded-[5px] px-4 py-[0.65rem] text-[0.9rem] font-medium no-underline"
              to="/docs/quickstart"
            >
              Get started →
            </Link>
            <Link to="/docs/when-to-use">Is Looms a fit?</Link>
          </div>
          <CodeBlock lang="bash">{'npm install @swirls/looms'}</CodeBlock>
        </div>
        <GuidedRun />
      </div>

      <section className="mt-28 max-[640px]:mt-18">
        <h2 className="text-foreground mb-4 text-[1.8rem] leading-[1.25] font-medium tracking-[-0.025em]">
          Define your own thread types.
        </h2>
        <p className="mb-4 max-w-[44rem] leading-[1.75]">
          An agent loop and a workflow DAG are two ways of running work. Looms lets you define
          another: an auction, a review policy, a device controller. Compose them in one run, with
          one shared history.
        </p>
        <div
          className="mt-8 mb-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-4 max-[640px]:grid-cols-1"
          aria-label="Example of custom thread composition"
        >
          <div className="border-line bg-background-subtle rounded-md border p-5">
            <small className="text-muted mb-[0.6rem] block font-mono">agent</small>
            <strong className="text-foreground block">Procurement assistant</strong>
            <p className="mt-2 mb-0 text-[0.9rem]">Finds suppliers and starts a purchase.</p>
          </div>
          <span
            className="self-center max-[640px]:rotate-90 max-[640px]:justify-self-center"
            aria-hidden="true"
          >
            →
          </span>
          <div className="border-line bg-background-subtle rounded-md border p-5">
            <small className="text-muted mb-[0.6rem] block font-mono">workflow</small>
            <strong className="text-foreground block">Purchase process</strong>
            <p className="mt-2 mb-0 text-[0.9rem]">Coordinates bidding, review, and fulfillment.</p>
          </div>
          <span
            className="self-center max-[640px]:rotate-90 max-[640px]:justify-self-center"
            aria-hidden="true"
          >
            →
          </span>
          <div className="border-line bg-background-subtle rounded-md border p-5">
            <small className="text-muted mb-[0.6rem] block font-mono">your custom kind</small>
            <strong className="text-foreground block">Auction</strong>
            <p className="mt-2 mb-0 text-[0.9rem]">
              Accepts bids until a deadline and returns a winner.
            </p>
          </div>
        </div>
        <Link to="/docs/concepts/runs-and-threads" className="text-[0.9rem]">
          Build a custom thread →
        </Link>
      </section>

      <section className="mt-28 grid gap-10 max-[640px]:mt-18 md:grid-cols-3">
        <div className="min-w-0">
          <Illustration name="log" className="block h-auto w-full" />
          <h2 className="text-foreground mb-4 text-[1.15rem] leading-[1.25] font-medium tracking-[-0.025em]">
            Recover recorded progress
          </h2>
          <p className="mb-4">
            Load durable history after a restart. Historical replay rebuilds state without
            dispatching effects; external actions interrupted by a crash need safe retries.
          </p>
          <Link to="/docs/reliability" className="text-[0.9rem]">
            Understand the guarantees →
          </Link>
        </div>
        <div className="min-w-0">
          <Illustration name="wait" className="block h-auto w-full" />
          <h2 className="text-foreground mb-4 text-[1.15rem] leading-[1.25] font-medium tracking-[-0.025em]">
            Wait for the world
          </h2>
          <p className="mb-4">
            Pause for a human, webhook, timer, or child thread. Keep decisions in the log and resume
            when the matching event arrives.
          </p>
          <Link to="/docs/approvals" className="text-[0.9rem]">
            Add a human decision →
          </Link>
        </div>
        <div className="min-w-0">
          <Illustration name="projections" className="block h-auto w-full" />
          <h2 className="text-foreground mb-4 text-[1.15rem] leading-[1.25] font-medium tracking-[-0.025em]">
            Show what happened
          </h2>
          <p className="mb-4">
            Use the same events to render conversations, approval queues, and debugging views. Build
            shared indexes for work across runs.
          </p>
          <Link to="/docs/projectors" className="text-[0.9rem]">
            Connect your UI →
          </Link>
        </div>
      </section>

      <section className="mt-28 grid items-start gap-10 max-[640px]:mt-18 md:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-foreground mb-4 text-[1.8rem] leading-[1.25] font-medium tracking-[-0.025em]">
            Add your own modules.
          </h2>
          <p className="mb-4">
            Define events, effects, thread kinds, and projections in a module. Built-in modules use
            the same extension model as yours.
          </p>
          <Link to="/docs/modules" className="text-[0.9rem]">
            Write a module →
          </Link>
        </div>
        <CodeBlock lang="ts" className="my-0!">{`import { createLooms } from '@swirls/looms/runtime'
import { agent } from '@swirls/looms/agent'
import { workflow } from '@swirls/looms/workflow'
import { approval } from '@swirls/looms/approval'
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

      <section className="mt-28 grid items-start gap-10 max-[640px]:mt-18 md:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-foreground mb-4 text-[1.8rem] leading-[1.25] font-medium tracking-[-0.025em]">
            One timeline across every thread.
          </h2>
          <p className="mb-4 max-w-[44rem] leading-[1.75]">
            Follow delegation, tool results, and decisions in one place. Select a thread or event in
            this recorded run to see how the work unfolded.
          </p>
          <Link to="/docs/operations" className="text-[0.9rem]">
            Inspect your runs →
          </Link>
        </div>
        <ClientOnly fallback={<LandingDebuggerFallback />}>
          <LandingDebugger />
        </ClientOnly>
      </section>

      <section className="mt-28 max-[640px]:mt-18">
        <h2 className="text-foreground mb-4 text-[1.8rem] leading-[1.25] font-medium tracking-[-0.025em]">
          Start with a run.
        </h2>
        <p className="mb-4 max-w-[44rem] leading-[1.75]">
          Run locally with Bun and SQLite, then take the same definitions to Cloudflare Durable
          Objects.
        </p>
        <div className="my-7 flex flex-wrap items-center gap-5">
          <Link
            className="bg-foreground text-background cursor-pointer rounded-[5px] px-4 py-[0.65rem] text-[0.9rem] font-medium no-underline"
            to="/docs/quickstart"
          >
            Run the durable example →
          </Link>
          <Link to="/docs/hosting-and-storage" className="text-[0.9rem]">
            Deployment guide
          </Link>
          <a href="https://github.com/ByteSliceHQ/looms" className="text-[0.9rem]">
            Source on GitHub
          </a>
        </div>
        <footer className="text-muted mt-20 flex flex-wrap gap-6 text-[0.85rem]">
          <span className="mr-auto">Looms by ByteSlice</span>
          <Link to="/docs/api">API reference</Link>
          <Link to="/docs/security">Security</Link>
          <Link to="/docs/math">Execution model</Link>
        </footer>
      </section>
    </main>
  )
}
