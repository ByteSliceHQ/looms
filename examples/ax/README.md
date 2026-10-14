# Looms with an AX effect runtime

This example keeps the workflow in Looms and runs one repository-analysis effect inside a real Google AX/Substrate sandbox. Both executors verify an immutable two-file fixture and run its Bun test. Looms then waits for human approval and completes the same workflow. No model API key or hosted platform is needed.

**Experimental; trusted workloads only.** The pinned upstream does not enforce destination allowlists or propagate task resource limits. See [isolation qualification](#isolation-qualification) before running other workloads.

```text
Looms + SQLite → Fetch adapter → TypeScript bridge + PostgreSQL → AX → Substrate/gVisor
       ↑                         ↑                                  │
       └── worker callback ──────┴──── begin / heartbeat / result ────┘
```

## Run locally

The qualified target is **ARM64 K3s 1.35.6 in k3d on the OrbStack Docker daemon**. Native OrbStack Kubernetes does not expose the certificate APIs required by this Substrate revision. The fixture uses a separately named `looms-ax` cluster and never changes the `orbstack` context or default kubeconfig.

Prerequisites: Docker daemon, k3d, kubectl, Git, Go with automatic toolchain downloads, Bun **1.3.14**, network access for pinned upstream source/images, and about 16 GiB available Docker memory. The first installation builds Substrate and downloads gVisor; it can take several minutes.

From the Looms repository root:

```sh
bun install --frozen-lockfile
bun run build --filter=@swirls/looms...
bun run --cwd examples ax:local:up
bun run --cwd examples ax:local:doctor
bun run --cwd examples ax:local:smoke
bun run --cwd examples ax:local:test
bun run --cwd examples ax:local:collect
```

`up` pins AX and Substrate commits, creates the cluster only if absent, builds ARM64 images, pushes them to the local registry, deploys images by digest, and configures the fixture gateway. Existing clusters require the recorded Kubernetes namespace UID in `.ax-local/cluster-uid`. Scripts use an explicit context and check that UID before mutation. The host kubeconfig is `.ax-local/kubeconfig`; `AX_KUBECONFIG` can override its location.

The K3s node uses a named Docker volume for `/var/lib/ateom-gvisor`; gVisor cannot create its writable overlay on the node container's own overlay filesystem. Required certificate feature gates and proxy ARP are enabled only inside the new test node. Snapshot storage is the upstream local RustFS/S3 deployment, not a cloud bucket. The only upstream manifest adjustment changes the registry hostname; no Go source fork is needed.

`smoke` runs AX, waits for an approval, restarts Looms, approves the same run, verifies one domain result, compares a real local execution, and checks confirmed cleanup. `test` additionally injects a first-attempt failure, restarts the AX controller/Redis/PostgreSQL/bridge during execution, and cancels a running task. A lost heartbeat may cause a Looms-owned recovery attempt. The old sandbox must stop before its replacement begins.

Local credentials, source clones, runner binary, image digests, and sanitized evidence live in ignored `.ax-local/`. The test driver opens temporary loopback-only port forwards and closes them afterward.

To release resources while retaining data:

```sh
bun run --cwd examples ax:local:down
# Restart with ax:local:up.
```

To deliberately delete the owned test cluster and its Kubernetes PVCs:

```sh
bun run --cwd examples ax:local:down --destroy
# Also delete the dedicated gVisor volume:
# bun run --cwd examples ax:local:down --destroy --purge-data
```

Evidence and credentials remain on disk. No deletion command targets the native OrbStack cluster or other k3d clusters. Do not run `--destroy` while you want to retain the cluster's event history.

## Isolation qualification

`bun run --cwd examples ax:local:qualify` runs the functional suite plus a real sandbox egress probe. **It currently exits nonzero:** the pinned Substrate gateway authenticates actor identity but does not enforce destination allowlists. The sandbox can reach the unlisted local health endpoint. The failed scenario is saved in the evidence report, and resource limits are also unqualified. Use this deployment only for trusted fixtures; see [VALIDATION.md](VALIDATION.md).

The local development profile is rebuilt in place. Finish all outstanding attempts before rerunning `up`. Production deployments must use new immutable profile IDs and retain old profiles/images for pending attempts.

## Local Cloudflare host

After the main suite finishes, run `bun run --cwd examples ax:cloudflare:test`. This starts local workerd on port 8791, uses the same real AX cluster, and checks a Durable Object workflow through approval. It requires an idle bridge, temporarily switches the callback target to `host.docker.internal:18791`, then restores the original target and closes its local processes. Do not run it concurrently with the Bun fault suite. A bearer-authenticated callback relay listens on port 18791 for K3s; workerd and its development tools stay on loopback port 8791. This is local emulation, not deployed Cloudflare validation.

## Use the adapter

```ts
import { createAxWorker } from '@swirls/looms/ax'
import { createLooms } from '@swirls/looms/runtime'

const worker = createAxWorker({
  endpoint: 'https://your-private-bridge.example',
  token: bridgeToken,
  scope: 'your-app',
  callbackTarget: 'your-app',
  routes: { 'repository.analyze.v1': { profile: 'repository-analyzer-v1' } },
})

const looms = createLooms({ modules, store, worker, authorize })
```

Only registered effect types use AX. Imports and normal local effects require no AX infrastructure. Actor hosts and `LoomsDurableObject.configure()` also accept the same optional `worker`. The Fetch adapter has no gRPC or PostgreSQL dependency; those belong to the private bridge application. Looms does not need a new plugin system for this integration.

The effect definition must supply finite schedule-to-start, start-to-close, heartbeat, and cancellation deadlines. This example uses 300 s / 900 s / 60 s / 60 s, with worker heartbeats every 15 s. The bridge's separate 20-minute expiry bounds orphan cleanup. Persistent Looms hosts must recover deadlines on restart. Use the stable logical idempotency key supplied to `runAxHandler` for any external side effects; this protocol does not promise exactly-once writes to outside systems.

`server.ts` wraps the standard Looms API and adds one authenticated fixture-only cancellation route: `POST /demo/runs/:runId/cancel`. Its operation token is generated with the other local secrets. The worker receives only its job capability, never that operator token.

## Inspect and repair

```sh
kubectl --kubeconfig=.ax-local/kubeconfig --context=k3d-looms-ax get pods -A
kubectl --kubeconfig=.ax-local/kubeconfig --context=k3d-looms-ax -n looms-ax-test port-forward service/looms 8790:8790 --address=127.0.0.1
```

Read tokens from `.ax-local/credentials.json` locally; do not paste them into logs or reports. `GET /v1/jobs/:jobId` on the authenticated bridge shows delivery, cleanup, and the latest reconciliation error. If PostgreSQL, Redis, or Substrate becomes unavailable, restore it and restart the single bridge replica; its durable rows drive repair. Do not delete a pending job row to unblock a retry. Confirm both the AX task and Substrate actor are absent before manual repair.

Retain old image digests, profiles, and Looms events until outstanding attempts and outbox deliveries settle. The prototype reads retained history for callback receipts; event-log trimming during reconciliation is unsupported. AX/Substrate logs may contain worker environment capabilities, so `collect` intentionally captures selected status and receipts rather than raw upstream request logs.

See [VALIDATION.md](VALIDATION.md) for measured results and remaining qualification limits, and [the bridge reference](../../apps/ax-bridge/README.md) for the wire contract.
