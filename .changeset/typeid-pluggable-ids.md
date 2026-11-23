---
'@swirls/looms': minor
---

Ids are TypeIDs by default, and a host can supply its own id format.

Every run, thread, event, and wait id is now a [TypeID](https://github.com/jetify-com/typeid): `run_`, `thr_`, `evt_`, or `wait_` followed by 26 characters. Ids Looms draws carry a UUIDv7 and sort by creation time within a process. Ids a reducer derives for a child carry a UUIDv8 whose bits are SHA-256 over the parts.

Pass `ids` to use another format, for example UUIDs that match the tables run data is replicated into. A format is a `LoomsIds` object: `create(kind)` draws an id and `derive(kind, parts)` names a child. The option is accepted by `createLooms`, `createRuntime`, `createActorCell`, `createLocalActorHost`, the Durable Object config, `routeToDurableObject`, the queue consumer, `createLoomsClient`, `LoomsProvider`, `createLoomsStore`, `preloadRunStore`, and `DebuggerShell`. Reducers and effect handlers read the configured format as `ctx.ids`. An id must be a non-empty string with no `:`; a format that breaks either rule throws `InvalidIdFormatError`. `derive` must be a pure function of its arguments.

Breaking changes:

- Every id Looms draws or derives has a new shape. Derived thread ids were bare UUID-shaped strings and now start with `thr_`. Derived ids come from SHA-256 instead of FNV-1a, so every derived child has a new name: a run in flight across the upgrade will not replay. Let in-flight runs finish, or cancel them, before upgrading.
- `ThreadContext`, `StartContext`, `LocalEffectContext`, `WorkerEffectContext`, and `AgentToolResolutionContext` have a required `ids` field. Code that builds one by hand must add it.
- A workflow's `pendingCancels` state holds `{ target, execution }` records instead of id strings. The workflow no longer reads a child's kind from a `run_` prefix.
- `deterministicThreadId` and `deterministicRunId` hash their parts as JSON, so `('a:b', 'c')` and `('a', 'b:c')` no longer collide, and `1` and `'1'` differ.
- `gate`, `evaluate`, `post`, `createTask`, and `boardTools` draw their call ids as `wait_<26 characters>` without the `approval`, `evaluator`, or `swarm` label.
