import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/examples')({
  component: Examples,
})

function Examples() {
  return (
    <>
      <h1>Examples</h1>
      <h2>React LiveStore</h2>
      <pre>
        <code>{`import {
  LoomsLiveStoreProvider,
  useActorStore,
  queries,
  decideReview,
} from '@looms/livestore/react'

const store = useActorStore(actorId)
const messages = store.useQuery(queries.messages)
decideReview(store, { reviewId, outcome: 'approve' })`}</code>
      </pre>
      <h2>Light store</h2>
      <pre>
        <code>{`import { createLoomsStore } from '@looms/livestore'

const store = createLoomsStore({
  storeId: actorId,
  endpoint: 'http://127.0.0.1:8787',
})
store.subscribe(() => {
  console.log(store.query.messages())
  console.log(store.query.reviews())
})
await store.commit({
  type: 'review.decided',
  payload: { reviewId, actionId: 'approve', outcome: 'approve' },
})`}</code>
      </pre>
      <h2>Projectors</h2>
      <pre>
        <code>{`import { createLooms } from '@looms/runtime'
import type { Projector } from '@looms/projectors'
import { sqlite } from '@looms/projectors/sqlite'

const slack: Projector = {
  name: 'slack-reviews',
  project: async (events) => {
    for (const event of events) {
      if (event.type === 'review.requested') {
        await notifySlack(event.payload.title)
      }
    }
  },
}

const looms = createLooms({
  definitions,
  projectors: [sqlite({ path: './looms.db' }), slack],
})`}</code>
      </pre>
      <h2>HTTP client</h2>
      <pre>
        <code>{`import { createLoomsClient } from '@looms/client'

const client = createLoomsClient()
const { actorId } = await client.startAgent('echo', { text: 'hi' })
await client.decideReview(actorId, reviewId, {
  actionId: 'approve',
  outcome: 'approve',
})`}</code>
      </pre>
      <h2>CLI</h2>
      <pre>
        <code>{`export LOOMS_URL=http://127.0.0.1:8787
bun run --filter @looms/cli looms -- call agent echo '{"text":"hi"}'
bun run --filter @looms/cli looms -- events <actorId>
bun run --filter @looms/cli looms -- review <actorId> <reviewId> --approve`}</code>
      </pre>
    </>
  )
}
