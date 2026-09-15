import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'

export const Route = createFileRoute('/docs/examples')({
  component: Examples,
})

function Examples() {
  return (
    <>
      <h1>Examples</h1>
      <p>
        Practical patterns for common application architectures: delegating tools to sub-agents,
        orchestrating DAG workflows with human review gates, subscribing to reactive projections in
        React, and interacting over HTTP or the CLI.
      </p>
      <p>
        The included demo app combines these patterns into a complete system. Run it locally with
        Bun actors (<code>bun run demo</code>) or deploy it to Cloudflare Durable Objects (
        <code>bun run dev:cloudflare</code>).
      </p>

      <h2>Agent with tools</h2>
      <CodeBlock lang="ts">{`import { asAgentTool, asEffectsTool, defineAgent, defineTool } from '@looms/agent'
import { gate } from '@looms/approval'
import { z } from 'zod'

const greet = defineTool({
  name: 'greet',
  description: 'Return a greeting',
  input: z.object({ name: z.string() }),
  handler: ({ name }) => ({ greeting: \`Hello, \${name}!\` }),
})

const specialist = defineAgent({
  name: 'specialist',
  instructions: 'Do a short task and return the result.',
  input: z.object({ task: z.string() }),
})

const askApproval = asEffectsTool({
  name: 'ask_approval',
  description: 'Ask a human to approve or reject',
  effects: (input) =>
    gate({ title: typeof input.title === 'string' ? input.title : 'Approve?' }),
  waitOn: { type: 'approval.decided' },
})

export const assistant = defineAgent({
  name: 'assistant',
  conversational: true,
  instructions: 'Greet people, delegate work, or ask for approval.',
  input: z.string(),
  tools: [greet, asAgentTool({ agent: specialist }), askApproval, checkout],
})`}</CodeBlock>
      <p>
        A tool can be a function, another agent, a workflow, or a human gate. The parent run waits
        until the child or approval finishes.
      </p>

      <h2>Workflow with approval and a domain module</h2>
      <CodeBlock lang="ts">{`import { gate } from '@looms/approval'
import { createWaitId, invoke, wait } from '@looms/core'
import { defineWorkflow } from '@looms/workflow'
import { z } from 'zod'
import { chargeCardEffect } from './modules/payments'

export const checkout = defineWorkflow({
  name: 'checkout',
  input: z.object({
    amount: z.number().default(150),
    currency: z.string().default('USD'),
  }),
  nodes: [
    {
      id: 'gate',
      run: (ctx) => {
        if (ctx.input.amount < 100) return { skipped: true }
        return ctx.effects(gate({ title: \`Approve \${ctx.input.amount}?\` }))
      },
    },
    {
      id: 'charge',
      deps: ['gate'],
      run: (ctx) =>
        ctx.effects([
          // Typed invoke statically verifies arguments against chargeCardEffect's input schema:
          invoke(chargeCardEffect, {
            amount: ctx.input.amount,
            currency: ctx.input.currency,
          }),
          wait({ waitId: createWaitId(), on: { type: 'payments.charge.authorized' } }),
          wait({ waitId: createWaitId(), on: { type: 'payments.charge.declined' } }),
        ]),
    },
  ],
})`}</CodeBlock>
      <p>
        Nodes run after their <code>deps</code>. <code>ctx.effects</code> parks the node until
        matching events land. Author the payments module in <Link to="/docs/modules">Modules</Link>.
      </p>

      <h2>React: chat and approvals</h2>
      <CodeBlock lang="tsx">{`import {
  LoomsProvider,
  useRunStore,
  useProjection,
} from '@looms/react'
import { conversation, userMessage } from '@looms/agent'
import { decision, pendingApprovals } from '@looms/approval'
import { ledger } from './modules/payments'

function RunView({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const convo = useProjection(store, conversation)
  const approvals = useProjection(store, pendingApprovals)
  const charges = useProjection(store, ledger)

  const send = (text: string) => store.commit(userMessage(text))
  const approve = (approvalId: string) => store.commit(decision(approvalId, 'approve'))

  return (
    <>
      {convo.lines.map((m, i) => (
        <p key={i}>{m.role}: {m.content}</p>
      ))}
      {approvals.items.filter((a) => a.status === 'pending').map((a) => (
        <button key={a.approvalId} onClick={() => approve(a.approvalId)}>
          {a.title}
        </button>
      ))}
      <input onKeyDown={(e) => e.key === 'Enter' && send(e.currentTarget.value)} />
    </>
  )
}`}</CodeBlock>
      <p>
        The same projection reducers run on the host and in the browser, so the UI cannot drift from
        the log.
      </p>

      <h2>HTTP client</h2>
      <CodeBlock lang="ts">{`import { userMessage } from '@looms/agent'
import { decision } from '@looms/approval'
import { createLoomsClient } from '@looms/client'
import { assistant, checkout } from './definitions'

const client = createLoomsClient({ baseUrl: 'https://runs.example.com' })

const { runId } = await client.start(checkout, { amount: 150, currency: 'USD' })
await client.signal(runId, [decision(approvalId, 'approve')])

const { runId: chatId } = await client.start(assistant, 'Charge $40')
await client.signal(chatId, [userMessage('Also greet Maya')])
client.subscribeEvents(chatId, (event) => console.log(event.type))`}</CodeBlock>
      <p>
        The client has two verbs for input — <code>start</code> a definition and <code>signal</code>{' '}
        events — and modules provide the event builders. When you only have names (no definition
        object), use <code>startRun({'{ kind, definitionName, input }'})</code>.
      </p>

      <h2>CLI</h2>
      <CodeBlock lang="bash">{`export LOOMS_URL=http://127.0.0.1:8787
bun run --filter @looms/cli looms -- start agent echo '{"text":"hi"}'
bun run --filter @looms/cli looms -- events <runId>
bun run --filter @looms/cli looms -- approve <runId> <approvalId> --approve
bun run --filter @looms/cli looms -- replay <runId> 4`}</CodeBlock>
    </>
  )
}
