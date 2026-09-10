import { createFileRoute, Link } from '@tanstack/react-router'

import { docsNav } from '../nav'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <div className="mx-auto max-w-[42rem] px-5 py-14 pb-12 md:px-8 md:pt-24 md:pb-20">
      <p className="text-foreground mt-0 mb-5 text-[2.4rem] leading-none font-semibold tracking-tighter md:text-5xl">
        Looms
      </p>
      <h2 className="text-body mt-0 mb-4 text-[1.35rem] leading-snug font-normal">
        Durable agents, workflows, and human approvals — composed like packages.
      </h2>
      <p className="text-muted mb-6 leading-relaxed">
        Each run is an event log you can replay, subscribe to, and extend with your own domain.
      </p>

      <div className="text-muted [&_b]:text-muted-light [&_span]:text-foreground my-6 flex flex-wrap items-center gap-2.5 font-mono text-[0.82rem] leading-normal [&_b]:px-0.5 [&_b]:font-normal [&_span]:font-medium">
        <span>Event</span>
        <b>&rarr;</b>
        <span>Reducer</span>
        <b>&rarr;</b>
        <span>State + Effects</span>
        <b>&rarr;</b>
        <span>World</span>
        <b>&rarr;</b>
        <span>Event</span>
      </div>

      <p className="text-muted mb-6 leading-relaxed">
        Under the hood, a <strong>Run</strong> is an append-only event log. Universal{' '}
        <strong>Threads</strong> (agents, workflows, human approvals) process incoming events
        through deterministic reducers and request effects. <strong>Projections</strong> fold this
        stream into real-time reactive UI state and indexes.
      </p>

      <div className="my-6">
        <Link
          to="/docs/quickstart"
          className="bg-foreground text-background inline-block rounded-[5px] px-[1.1rem] py-[0.55rem] text-sm font-medium no-underline transition-colors hover:bg-neutral-700 hover:no-underline dark:hover:bg-slate-300"
        >
          Get started
        </Link>
      </div>

      <ul className="mt-12 mb-0 flex list-none flex-wrap gap-x-7 gap-y-5 p-0">
        {docsNav.map((item) => (
          <li key={item.to} className="m-0">
            <Link to={item.to} className="text-muted hover:text-foreground text-sm no-underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
