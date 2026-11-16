---
'@swirls/looms': minor
---

`store.commit` in `@swirls/looms/react` can show its events before the host confirms them. Pass `{ optimistic: true }`, or set `optimistic` on `createLoomsStore`: the events are folded into projections and live folds at once, after every confirmed event, replaced by the host's copies when those arrive, and removed if the commit fails, in which case `commit` rejects. `store.pending()` lists the events still waiting and `isPendingEvent` identifies one. `commit` also takes an `idempotencyKey` and a `send` function for writes that go through a route of your own. Events decoded from the wire now keep their `idempotencyKey`, which is how a pending event is matched to its confirmed one.

The store also reports when it has caught up: `store.synced()` and `useRunSummary(store).synced` are false until it holds everything the log had when it connected. `LoomsProvider` and `useRunStore` take `retainMs`, how long a store stays connected after its last component unmounts, and `useRunStore` and `createLoomsStore` take `fromSeq` to follow a run from a later point in its log.
