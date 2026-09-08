# Snapshots and compaction

Long actor timelines should not force every client to replay the full S2/EventStore history on cold start.

## `snapshot.taken`

The runtime emits `snapshot.taken` when the durable event count since the last snapshot reaches `DEFAULT_SNAPSHOT_EVERY` (200). Payload:

```ts
{
  seq: number        // inclusive covered seq
  stateHash: string  // sha256 prefix of reduced state
  state?: JsonValue  // optional embedded ActorState for fast hydrate
}
```

Helpers in `@looms/core`:

- `shouldTakeSnapshot(events, every?)`
- `buildSnapshotEvent(actorId, events, { includeState? })`
- `reduceFromSnapshots(events)` — prefers latest snapshot when reducing
- `hashActorState(state)`

## Client strategy

1. Pull from cursor / S2 stream as usual.
2. On first load of a long stream, seek the latest `snapshot.taken` and materialize from `payload.state` (or reduce from `payload.seq`).
3. Apply only events with `seq > payload.seq`.
4. Ephemeral token/thinking events are ignored by durable materializers.

## Compaction (host)

Hosts may trim EventStore / S2 retention **before** the latest snapshot seq once all active clients acknowledge a cursor past that point. Looms does not auto-delete history in v0.1 — operators configure S2 retention / s2-lite trimming.

## LiveStore note

LiveStore itself is not ideal for unbounded local SQLite. Prefer:

- short-lived client sessions that pull recent events, or
- snapshot-based hydrate + trailing events, or
- per-actor stores that are disposed when the UI leaves that actor.
