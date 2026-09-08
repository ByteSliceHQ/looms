import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/quickstart')({
  component: Quickstart,
})

function Quickstart() {
  return (
    <>
      <h1>Quickstart</h1>
      <p>Install the workspace and run the demo host + UI:</p>
      <pre>
        <code>{`bun install
bun run demo
# open http://127.0.0.1:8787`}</code>
      </pre>
      <p>Start an actor against the same origin:</p>
      <pre>
        <code>{`curl -s -X POST http://127.0.0.1:8787/actors/agent \\
  -H 'content-type: application/json' \\
  -d '{"definitionName":"echo","input":{"text":"hi"}}'`}</code>
      </pre>
      <p>
        Host wiring with <code>createLooms</code>:
      </p>
      <pre>
        <code>{`import { createLooms } from '@looms/runtime'
import { s2, s2ConfigFromEnv, s2Lite } from '@looms/s2'
import { definitions } from './definitions'

export const looms = createLooms({
  definitions,
  store: process.env.LOOMS_S2_ENDPOINT
    ? s2(s2ConfigFromEnv(process.env))
    : s2Lite({ env: process.env }),
})`}</code>
      </pre>
      <p>
        Optional secondary indexes go on <code>projectors</code> — see{' '}
        <Link to="/docs/projectors">Projectors</Link>.
      </p>
    </>
  )
}
