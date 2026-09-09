# LiveStore

Subscribe to a run from the browser. `useRunStore` follows the event log; `useProjection` folds it with the same reducer the host uses — chat, approvals, and your ledger stay consistent with the run.

```ts
import { LoomsLiveStoreProvider, useRunStore, useProjection } from '@looms/livestore/react'
import { conversation, userMessage } from '@looms/agent'
import { decision, pendingApprovals } from '@looms/approval'

const store = useRunStore(runId)
const convo = useProjection(store, conversation)
const approvals = useProjection(store, pendingApprovals)

await store.commit(userMessage('Also greet Maya'))
await store.commit(decision(approvalId, 'approve'))
```

`convo.lines` is the transcript. `approvals.items` is the gate list. `commit` writes an event and the run resumes; `userMessage` and `decision` build the module's events so you never hand-write payloads.

Without React:

```ts
import { createLoomsStore } from '@looms/livestore'

const store = createLoomsStore({
  storeId: runId,
  endpoint: 'http://127.0.0.1:8787',
})
store.subscribe(() => {
  console.log(store.events().map((event) => event.type))
})
```

The host exposes `/api/livestore`. `useRunStore` opens one SSE connection (`?live=true`) per run and shares it across React subscribers. Catch-up is `GET /api/livestore?storeId=&cursor=`; `GET /runs/:id/events` remains available for one-shot reads.
