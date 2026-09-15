import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'

export const Route = createFileRoute('/docs/quickstart')({
  component: Quickstart,
})

function Quickstart() {
  return (
    <>
      <h1>Quickstart</h1>
      <p>
        Three paths: run the Bun demo (local SQLite actors), run the Cloudflare Durable Object demo,
        or embed Looms in-process for scripts and tests. All share the same loop — start a
        definition, signal events, read projections.
      </p>

      <h2>Try the demo (local actors)</h2>
      <p>
        Default demo: <code>createLocalActorHost</code> with one Bun SQLite file per run under{' '}
        <code>.looms/runs/</code>.
      </p>
      <CodeBlock lang="bash">{`bun install
bun run demo
# http://127.0.0.1:8787`}</CodeBlock>

      <p>Start a run from the panel, or:</p>
      <CodeBlock lang="bash">{`curl -s -X POST http://127.0.0.1:8787/runs \\
  -H 'content-type: application/json' \\
  -d '{"kind":"agent","definitionName":"echo","input":{"text":"hi"}}'`}</CodeBlock>

      <h2>Try the Durable Object demo</h2>
      <p>
        Recommended production shape: each run is a Cloudflare Durable Object cell with embedded
        SQLite. The demo UI proxies to the worker:
      </p>
      <CodeBlock lang="bash">{`bun run dev:cloudflare
# UI :8787 → worker/DOs :8788`}</CodeBlock>
      <p>
        The same Workers bundle can run on <Link to="/docs/durability">celld</Link> for self-hosted
        virtual actors. Full hosting guide:{' '}
        <Link to="/docs/durability">Durability &amp; Hosting</Link>.
      </p>

      <h2>Embed in-process</h2>
      <p>
        For scripts, unit tests, and quick experiments, <code>createLooms</code> provides an
        in-process runtime with an in-memory event store. For production deployments with per-run
        isolation and durable alarms, deploy virtual actor cells on Cloudflare Durable Objects or
        Bun (see <Link to="/docs/durability">Durability &amp; Hosting</Link>).
      </p>
      <CodeBlock lang="ts">{`import { createLooms } from '@looms/runtime'
import { defineAgent } from '@looms/agent'
import { z } from 'zod'

const echo = defineAgent({
  name: 'echo',
  instructions: 'Echo the user.',
  input: z.object({ text: z.string() }),
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: input.text },
    done: true,
    output: { text: input.text },
  }),
})

const looms = createLooms({
  definitions: [echo],
})

const { runId } = await looms.start(echo, { text: 'hi' })
const state = await looms.getRun(runId)`}</CodeBlock>
      <p>
        <code>start</code> takes any definition — an agent, a workflow, or a kind from your own
        module — and types the input from its schema. Configure modules (for example{' '}
        <code>agent({'{ llm }'})</code>) and add your own when the app needs them — see{' '}
        <Link to="/docs/modules">Modules</Link>. Serve HTTP with <code>looms.fetch</code> /{' '}
        <code>looms.serve()</code>, then subscribe from a client in{' '}
        <Link to="/docs/examples">Examples</Link>.
      </p>
    </>
  )
}
