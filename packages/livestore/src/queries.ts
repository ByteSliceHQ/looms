import { queryDb, type Queryable } from '@livestore/livestore'
import { tables } from './livestore-schema'

export const actorsQuery = queryDb(tables.actors.select())

export const messagesQuery = queryDb(tables.messages.select().orderBy('seq', 'asc'))

export const nodesQuery = queryDb(tables.nodes.select())

export const reviewsQuery = queryDb(tables.reviews.select())

export const childrenQuery = queryDb(tables.children.select())

export const eventsQuery = queryDb(tables.eventsLog.select().orderBy('seq', 'asc'))

export const queries = {
  actors: actorsQuery,
  messages: messagesQuery,
  nodes: nodesQuery,
  reviews: reviewsQuery,
  children: childrenQuery,
  events: eventsQuery,
} as const

/** Result type of a Looms LiveStore query (`store.useQuery(queries.actors)` → `ActorRow[]`). */
export type LoomsQueryResult<Q extends (typeof queries)[keyof typeof queries]> = Queryable.Result<Q>
