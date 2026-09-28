# AX bridge (experimental)

A private TypeScript service implementing the Looms AX executor. It uses Bun 1.3.14, Effect, PostgreSQL, and generated `@grpc/grpc-js` clients. It is not bundled into the published Looms SDK.

Looms owns event history, workflow decisions, approvals, retries, and deadlines. The bridge durably accepts an **effect attempt**, provisions an AX Task, admits one worker process, and delivers its terminal result through the existing Looms worker callback API. It does not run the Looms scheduler or interpret domain workflows.

See [the runnable example](../../examples/ax/README.md) and [validation evidence](../../examples/ax/VALIDATION.md).

## Protocol and persistence

- Authenticated `PUT /v1/jobs/:jobId` returns 202 only after PostgreSQL commits. Repeated identical submissions also return 202; a conflicting immutable request returns 409.
- `PUT /v1/jobs/:jobId/cancellation` persists cancellation, including before submission. `GET /v1/jobs/:jobId` returns authorized operational state.
- Job IDs hash protocol, application scope, run, effect, and attempt. The business idempotency key omits the attempt; handlers should use it with downstream systems.
- Worker `begin`, `heartbeat`, and `result` use a separate HMAC capability restricted to that job. Workers never receive Looms callback or database credentials. The first terminal digest wins; identical repeats are accepted and conflicts rejected.
- `begin` checks the current Looms attempt, AX readiness, gateway readiness, and prior-attempt termination. AX golden snapshot preparation also boots the image; its process cannot perform business work before this gate.
- A terminal result is the durable delivery outbox. Cleanup can finish during a callback outage. Delivery is `applied` only after a retained Looms event receipt is found; ignored stale callbacks become `obsolete`, and unconfirmed active delivery stays `uncertain`.
- Cancellation is acknowledged only after both the AX Task and Substrate actor are absent. Delete RPC acceptance alone is insufficient. Transient teardown errors remain pending and are retried.
- One replica per database. A PostgreSQL advisory lock rejects a second reconciler, and a changed database session causes shutdown. This is not a general HA/fencing protocol. Deploy with Recreate, preserve the PVC, and restart after database connection loss.

Keep completed job receipts and the matching Looms event history. V1 does not reconcile callbacks against trimmed event logs. Profile IDs are immutable: retain old profiles until their outstanding attempts settle. Updating a profile in place can intentionally cause a submission conflict. Configure finite execution and cancellation deadlines on every routed Looms effect.

## Configuration

`src/main.ts` requires `DATABASE_URL`, `AX_ENDPOINT`, `AX_ATESPACE`, `AX_WORKER_ENDPOINT`, `SUBSTRATE_ENDPOINT`, `SUBSTRATE_CA_FILE`, `SUBSTRATE_TOKEN_FILE`, `AX_SCOPE`, `AX_HOST_TOKEN`, `AX_CAPABILITY_SECRET`, `AX_PROFILES`, `LOOMS_CALLBACK_TARGET`, `LOOMS_URL`, `LOOMS_READ_TOKEN`, and `LOOMS_WORKER_TOKEN`. `PORT` defaults to 8789. `AX_CA_FILE` enables AX TLS; plaintext AX requires explicit `AX_ALLOW_INSECURE=true` on a private network.

The example generates 256-bit secrets and mounts rotating Substrate audience tokens plus the cluster trust bundle. In production, use authenticated private ingress/TLS, per-application credentials, and a secret manager. V1 supports one configured application scope and one registered callback target per deployment. Never accept a callback URL or executable command from effect input.

Profiles pin an image **digest**, command, gateway, allowed domain event types, and absolute cleanup expiry. Workers cannot emit `runtime.*` or `approval.*` events. The host callback still validates domain schemas. Result bodies are limited to 256 KiB and 100 events; use externally persisted references for larger artifacts. This example does not implement an artifact store.

The bridge polls for repair; it does not depend on AX watch delivery. Provisioning retries preserve the same attempt. Only Looms creates business retries. Worker heartbeat failure interrupts its handler. Admission is one-shot, including when a restored snapshot repeats the same process UUID. An admission response lost after its durable claim consumes that attempt and recovers through Looms timeout/retry. A restarted worker process cannot reclaim an attempt, so recovery uses the Looms timeout/retry policy rather than transparent process continuation.

## Upstream pins and generation

- AX: `google/ax@f009cc81c9a571073bc1dd58cd2ed934bf2d5b1c`.
- Substrate: `agent-substrate/substrate@672533541dbfcd29084e4de2475267088bda3651`.
- `proto/ax.proto` and `proto/ateapi.proto` are vendored from those revisions; the Apache 2.0 license is included as `LICENSE.ax`.
- Regenerate with `bun run --cwd apps/ax-bridge generate`. Generated files are checked in and excluded from formatting/linting. Do not hand-edit them.

Unit tests cover callback response loss, duplicate/conflicting results, cancellation tombstones and uncertain teardown. The transport test runs real gRPC unary/streaming calls, deadline expiry, and stream cancellation. The live fixture also exercises the production Bun container against AX and authenticated Substrate TLS.

`bun run --cwd apps/ax-bridge test:postgres` exercises concurrent submissions, cancellation persistence, worker claims, fair reconciliation batches, and exclusive reconciler ownership against PostgreSQL. Set `AX_TEST_DATABASE_URL` to a local test server; its role needs `CREATEDB`. Each test creates and drops a separate database. CI runs this suite with PostgreSQL 17.4.

AX/Substrate are experimental upstreams. The real egress qualification test failed: this Substrate gateway milestone authenticates actors without enforcing destination allowlists. AX GatewayReady is not proof of isolation. The pinned AX controller does not carry task resource limits into its generated actor template. The included deployment is a trusted local fixture, not a service for arbitrary untrusted code. See the explicit qualification limits in the validation report.
