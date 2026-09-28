# AX integration validation

The implementation was exercised against a real local K3s cluster on September 24 and 28, 2026. AX created Substrate/gVisor sandboxes that ran the packaged Bun fixture, and their outcomes advanced Looms workflows. This is integration coverage for a trusted fixture, not production isolation certification.

## Environment

| Component           | Qualified version/configuration                                  |
| ------------------- | ---------------------------------------------------------------- |
| Docker              | OrbStack daemon, ARM64                                           |
| Kubernetes          | k3d cluster `looms-ax`, K3s `v1.35.6+k3s1`, one node             |
| AX                  | `f009cc81c9a571073bc1dd58cd2ed934bf2d5b1c`                       |
| Substrate           | `672533541dbfcd29084e4de2475267088bda3651`                       |
| Application runtime | Bun `1.3.14`; TypeScript bridge with Effect and grpc-js `1.14.3` |
| Bridge persistence  | PostgreSQL `17.4`, PVC                                           |
| AX persistence      | Redis `7.4.2`, AOF with `appendfsync always`, PVC                |
| Looms persistence   | SQLite, PVC, deadline recovery at boot                           |
| Images              | ARM64, resolved to immutable registry digests before deployment  |
| Cloudflare          | Local workerd through Wrangler `4.131.2`, SQLite Durable Object  |

Native OrbStack Kubernetes was inspected but **not qualified**: its certificate API discovery lacked ClusterTrustBundle and PodCertificateRequest, and its documented customization did not expose the needed API-server feature gates. K3s on the Docker daemon provided those features. The native `orbstack` cluster and unrelated Docker workloads were not modified.

The K3s fixture enables the required certificate features and uses a dedicated gVisor volume to avoid nested-overlay failures. Upstream local RustFS provides snapshot storage. The Substrate overlay changes only `kind-registry:5000` to `looms-ax-registry:5000`; there is no Go source fork. Upstream binaries report a dirty checkout because of this manifest adjustment.

## Completed checks

| Scenario                                                                                               | Result                                                                                   |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Real AX provisioning, worker execution, result callback, approval and confirmed cleanup                | Passed                                                                                   |
| Looms pod restart while waiting for approval; approve the same run without repeating analysis          | Passed                                                                                   |
| Local executor performs the same hash verification and Bun test, yielding equivalent domain projection | Passed                                                                                   |
| First worker attempt fails; Looms schedules a second attempt; one domain result                        | Passed                                                                                   |
| AX controller, Redis, PostgreSQL and bridge restart during active execution                            | Passed; heartbeat loss can require a new Looms attempt                                   |
| Running cancellation                                                                                   | Passed; acknowledgment follows absence of both AX Task and Substrate actor               |
| Local Cloudflare Durable Object → Fetch adapter → real K3s AX job → approval                           | Passed                                                                                   |
| Lost accepted submission and lost committed callback responses                                         | Passed in deterministic bridge/runtime tests                                             |
| Duplicate and conflicting terminal results, restricted event types, restarted worker instance          | Passed in bridge/runtime tests                                                           |
| Cancellation before submission and unconfirmed teardown                                                | Passed in bridge/runtime tests                                                           |
| Stored result racing cancellation, including an unavailable cancellation callback                      | Passed in regression test; acknowledgment remains pending until delivered                |
| Retry admission while a prior sandbox remains alive; use of a prior attempt's capability               | Passed in bridge/runtime tests                                                           |
| Concurrent PostgreSQL acceptance and claims, persistence, batch fairness and reconciler ownership      | Passed against PostgreSQL 17.4; included in CI                                           |
| Worker heartbeat rejection and uncertain admission                                                     | Passed; handler aborts or remains unstarted without submitting a success                 |
| Real gRPC unary and streaming messages, unary deadline, stream cancellation                            | Passed in transport test                                                                 |
| Bridge → Substrate TLS, projected trust bundle and service-account token                               | Passed during live sandbox execution and cleanup                                         |
| Destination egress allowlist                                                                           | **Failed**: the sandbox reached an unlisted local service; isolation remains unqualified |
| Repeatable `ax:local:up` rebuild and deployment                                                        | Passed on the owned cluster                                                              |
| Protobuf generation                                                                                    | Reproducible, 172 generated files match pinned descriptors                               |
| Repository build, types, tests, lint and formatting                                                    | `bun run verify` passed under Bun 1.3.14                                                 |
| Packed npm artifact, optional entrypoints and clean consumer application                               | `bun run check:package` and `bun run test:e2e:npm` passed                                |

After the September 28 code review fixes, all four functional scenarios passed on rebuilt images: execution/approval/host recovery took 7.3 s, failure/retry 6.2 s, service restart recovery 43.0 s, and cancellation 3.2 s. These are single-machine fixture timings. The earlier egress qualification returned `allowed: true, denied: false`; its upstream enforcement gap remains unresolved.

Local Cloudflare run `run_muldii5n_h_515e4ae457944d2dae68966e2484e119` completed with one `repository.analyzed` event. The test used a bearer-authenticated callback relay with workerd on loopback, drained the delivery outbox, and restored the original bridge callback target. Workerd rejects `redirect: "error"`; the Fetch adapter uses `manual` and rejects 3xx responses explicitly, with a regression test.

The review fixed two recovery defects: a stored outcome could bypass cancellation acknowledgment, and 200 unresolved rows could starve later jobs. It also removed duplicated deployment configuration, restricted each pod's credentials, separated application image contents, and added ten regression tests. The AX unit, transport, and PostgreSQL suites now contain 20 tests. Repository verification, packed-package checks, and the clean npm consumer test passed after those changes.

The live test also exposed a provider-neutral Looms bug: external worker outcome events were committed but did not satisfy registered event waits. The shared callback path now records wait satisfaction in the same commit. Its regression test failed before the fix and passed afterward; AX logic remains outside the runtime.

## Scope and remaining qualification

- **Destination egress enforcement is not implemented in the pinned Substrate gateway milestone.** The real sandbox reached both its allowed bridge endpoint and an unlisted Looms health endpoint. AX reported GatewayReady after creating a policy object, which did not establish enforcement. Substrate's [pinned egress demo notes](https://github.com/agent-substrate/substrate/blob/672533541dbfcd29084e4de2475267088bda3651/demos/egress/README.md#notes--limitations) explicitly describe destination authorization as follow-up work. `ax:local:qualify` preserves this failing check and exits nonzero. Do not expose this deployment to untrusted workloads.
- No hosted Cloudflare deployment, multi-node failover, capacity/load testing, transparent process continuation, or untrusted-code isolation claim.
- The pinned AX controller constructs image-specific actor templates without propagating task resource limits. The bridge does not expose a misleading resource-limit option. Kubernetes limits on control-plane Pods are not per-sandbox limits. Resource exhaustion testing is deferred until those limits can actually be enforced.
- V1 has one bridge replica per database, one application scope/callback target, finite job expiry, polling reconciliation, and retained event-log receipts. Do not trim relevant Looms events or delete job receipts while delivery is pending.
- Profile upgrades require immutable IDs and retention of old profiles/images for pending attempts. There is no general upgrade migration or artifact storage implementation in this fixture.
- The bridge does not promise exactly-once external side effects. Workers receive a stable logical idempotency key; downstream services must honor it.
- Upstream request logs can include worker capabilities. The collector saves selected resource status, image references and job receipts instead of copying raw Substrate request logs.

The final deployment's application image digests are recorded in `.ax-local/images.json` and `.ax-local/evidence/images.txt`. The bridge and worker are separate containers; only the Fetch adapter is shipped through the Looms package.

## Evidence and reproduction

Run the commands in [README.md](README.md). `.ax-local/evidence/live-test.json` contains the latest scenario results, run IDs, job IDs, durations and cluster context; `cloudflare.json` records the local Durable Object round trip. `isolation-qualification.json` preserves the failed destination enforcement check alongside passing functional scenarios. `ax:local:collect` adds node/Pod/storage status, immutable image references, upstream versions, and job-to-attempt receipts without credentials.

Secrets, kubeconfig, source clones, and raw development logs stay in ignored `.ax-local/`. The fixture cluster remains available for inspection. `ax:local:down` stops it while retaining data; deletion requires the explicit `--destroy` option and a matching recorded cluster UID.
