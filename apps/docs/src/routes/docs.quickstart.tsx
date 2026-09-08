import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/quickstart')({
  component: Quickstart,
})

function Quickstart() {
  return (
    <>
      <h1>Quickstart</h1>
      <p>
        Two paths: run the included demo to see a debugger and chat, or host Looms
        inside your own app.
      </p>

      <h2>Try the demo</h2>
      <pre>
        <code>{`bun install
bun run demo
# http://127.0.0.1:8787`}</code>
      </pre>
      <p>Start a run from the panel, or:</p>
      <pre>
        <code>{`curl -s -X POST http://127.0.0.1:8787/runs \\
  -H 'content-type: application/json' \\
  -d '{"kind":"agent","definitionName":"echo","input":{"text":"hi"}}'`}</code>
      </pre>

      <h2>Host it in your app</h2>
      <p>
        Define agents and workflows, choose modules, and call{' '}
        <code>createLooms</code>. The default store is in-memory; pass S2 when you
        want a durable log.
      </p>
      <pre>
        <code>{`import { createLooms } from '@looms/runtime'
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
  // store: s2(s2ConfigFromEnv(process.env)),
})

const { runId } = await looms.start(echo, { text: 'hi' })
const state = await looms.getRun(runId)`}</code>
      </pre>
      <p>
        <code>start</code> takes any definition — an agent, a workflow, or a kind from
        your own module — and types the input from its schema. Configure modules (for
        example <code>agent({'{ llm }'})</code>) and add your own when the app needs
        them — see <Link to="/docs/modules">Modules</Link>.
        Serve HTTP with <code>looms.fetch</code> / <code>looms.serve()</code>, then
        subscribe from a client in <Link to="/docs/examples">Examples</Link>.
      </p>
    </>
  )
}
