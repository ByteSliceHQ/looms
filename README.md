# Looms

**Durable agents, workflows, and human approvals, composed like packages.**

Looms is a TypeScript SDK for long-running work in your application. Each run has an event log you can replay, recover from with persistent storage, and subscribe to from a UI. Agents, DAG workflows, approvals, and your own domain modules compose: a workflow can wait for an approval before charging a card, and an agent can start that workflow as a tool.

[Website](https://looms.sh) · [Documentation](https://looms.sh/docs) · [Quickstart](https://looms.sh/docs/quickstart) · [Contributing](./CONTRIBUTING.md)

Built and maintained by the team at [Swirls](https://swirls.ai).

## Why Looms

- **Recoverable execution.** With persistent storage, a run can survive a host restart and resume unfinished work.
- **Composable modules.** Use agents, workflows, approvals, and domain modules together. Ship the pieces your application needs.
- **One stream, many views.** The same events can power a chat transcript, a debugger, a ledger, and pending-approval badges.
- **Human decisions.** A run can wait for a decision and continue when your application submits it.
- **A choice of hosts.** Use Bun with SQLite locally or Cloudflare Durable Objects for a production actor host. Preserve one writer per run; add projectors for cross-run views and analytics.

Read [when to use Looms](https://looms.sh/docs/when-to-use) for use cases and tradeoffs.

## Get started

Follow the [quickstart](https://looms.sh/docs/quickstart) to build an agent and workflow that pause for human review, exit, and resume in a new process.

To try the same example from this repository, install [Bun](https://bun.sh) first. The repository pins Bun 1.3.14 in `package.json`.

```bash
git clone https://github.com/ByteSliceHQ/looms.git
cd looms
bun install --frozen-lockfile
bunx turbo run build --filter=@swirls/looms...
bun examples/durable-review.ts start
```

The command prints a `runId` and exits. Replace `YOUR_RUN_ID` below with that ID, then run each command separately from the repository root:

```bash
bun examples/durable-review.ts inspect YOUR_RUN_ID
bun examples/durable-review.ts approve YOUR_RUN_ID
bun examples/durable-review.ts inspect YOUR_RUN_ID
```

The pending review survives between commands in `.looms/review.sqlite`. After approval, the example reports `status: "completed"` and `published: true`. Publishing is simulated: the example makes no network calls and needs no model API key. You can use `reject` instead of `approve` on a pending run to see the rejection path.

See the [example source](./examples/durable-review.ts), its [definitions](./examples/review-definition.ts), and the [smaller examples](./examples/README.md).

## Embed Looms in your application

Definitions describe the work; modules register them with a runtime. This small agent echoes its input:

```bash
bun add @swirls/looms zod
```

```ts
import { agent, defineAgent } from '@swirls/looms/agent'
import { createLooms } from '@swirls/looms'
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
  modules: [agent({ definitions: [echo] })],
})

try {
  const { runId } = await looms.start(echo, { text: 'hi' })
  console.log(runId)
} finally {
  await looms.stop()
}
```

This example uses the default **in-memory store**, which loses history when the process exits. Use persistent storage for restart recovery, as in the quickstart. The [hosting and storage guide](https://looms.sh/docs/hosting-and-storage) explains storage, actor ownership, and wake scheduling.

Runs share a small set of operations: start a definition, signal events into it, and read projections out. Modules supply typed helpers such as `userMessage` and `decision`. The [integration guide](https://looms.sh/docs/integration) covers HTTP and React clients.

## Before deploying

Looms is under active development. Review the [API documentation](https://looms.sh/docs/api) and [versioning guide](https://looms.sh/docs/versioning) before changing code that must resume existing runs.

Your application supplies authentication, per-run authorization, and tenant ownership. Keep the execution host behind that boundary, authorize reads and event streams as well as writes, and keep credentials out of event logs. See [authentication and tenancy](https://looms.sh/docs/security).

Recovery may repeat an external action if its outcome was not recorded before a crash. Use provider-supported idempotency and reconciliation where needed. The [reliability guide](https://looms.sh/docs/reliability) explains recovery, retries, snapshots, and retention.

## Package modules

Looms publishes as one package. Explicit subpaths keep browser, server, provider, and storage boundaries clear. Migrate an old import by changing `@looms/<module>` to `@swirls/looms/<module>`; install only `@swirls/looms`.

| Module                            | Use it for                                                     |
| --------------------------------- | -------------------------------------------------------------- |
| `@swirls/looms/runtime`           | `createLooms`, processing, and the HTTP host                   |
| `@swirls/looms/actor`             | Local actor cells and one writer per run                       |
| `@swirls/looms/cloudflare`        | Cloudflare Durable Object hosting                              |
| `@swirls/looms/agent`             | Agent definitions, tools, and conversation projections         |
| `@swirls/looms/agent/debugger`    | Agent chat, token usage, and agent event summaries             |
| `@swirls/looms/workflow`          | DAG workflow definitions                                       |
| `@swirls/looms/workflow/debugger` | Workflow node view and workflow event summaries                |
| `@swirls/looms/approval`          | Human approval gates and decisions                             |
| `@swirls/looms/approval/debugger` | Approval decisions and approval event summaries                |
| `@swirls/looms/core`              | Custom modules, events, effects, and projections               |
| `@swirls/looms/client`            | HTTP client                                                    |
| `@swirls/looms/react`             | React hooks and live run stores                                |
| `@swirls/looms/debugger`          | Debugger kit. Modules add views from their `/debugger` subpath |
| `@swirls/looms/evaluator`         | Typed evaluations that branch agents and workflows             |
| `@swirls/looms/s2`                | S2 event storage, snapshots, and projection support            |
| `@swirls/looms/ai-vercel`         | Vercel AI SDK model adapters                                   |
| `@swirls/looms/projectors`        | Cross-run indexes                                              |
| `@swirls/looms/testing`           | Runtime and replay helpers for module authors                  |
| `@swirls/looms/cli`               | Inspecting and approving runs from a terminal                  |

## Explore locally

```bash
bun run examples        # small, in-memory examples
bun run demo            # demo at http://127.0.0.1:8787
bun run docs            # docs at http://127.0.0.1:8788
bun run dev             # demo and docs together
```

`bun run demo` starts a Bun host at http://127.0.0.1:8787 and the debugger at http://127.0.0.1:8787/debugger. The same command starts the debugger's Vite server at http://127.0.0.1:5173, which proxies API calls to that host. The Bun demo uses local SQLite and can start `s2-lite` for projections when the S2 CLI is available. See [contributor setup](./CONTRIBUTING.md#local-development) for optional tooling.

The published documentation lives at [looms.sh/docs](https://looms.sh/docs). Markdown in [`docs/`](./docs) contains supplementary architecture and protocol notes.

## Help and contributions

Use [GitHub issues](https://github.com/ByteSliceHQ/looms/issues) for bugs, feature proposals, and usage questions. Include a small reproduction when reporting a bug, and remove credentials and private run data from anything you share.

Code, documentation, examples, reproductions, and thoughtful reviews are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started and our [code of conduct](./CODE_OF_CONDUCT.md) for community expectations.

Report suspected vulnerabilities privately to [security@swirls.ai](mailto:security@swirls.ai), following [SECURITY.md](./SECURITY.md).

## License

Looms is licensed under [Apache-2.0](./LICENSE). See [NOTICE](./NOTICE) for attribution.
