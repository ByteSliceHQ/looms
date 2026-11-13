import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { defineEventCatalog, defineModule, wait, type JsonValue } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import {
  ACTOR_HEADER,
  authAllowed,
  authAllowedAs,
  createLooms,
  describeRoute,
  forwardedActorAuth,
  type Authorize,
  type RouteInfo,
} from '../index'

const Note = Schema.Struct({ text: Schema.String })

const notes = defineModule(
  {
    namespace: 'notes',
    protocolVersion: '1.0.0',
    events: defineEventCatalog('notes', { added: Note }),
  },
  (m) => ({
    signals: {
      add: m.signal({
        description: 'Add a note.',
        input: Note,
        build: (input) => m.input('added', input),
      }),
    },
  }),
)

const flow = defineWorkflow({
  name: 'await-note',
  nodes: [
    {
      id: 'wait',
      run: (ctx) => ctx.effects([wait({ waitId: 'note', on: { type: 'notes.added' } })]),
    },
  ],
})

const decodeEvents = Schema.decodeUnknownSync(
  Schema.Struct({
    events: Schema.Array(
      Schema.Struct({
        type: Schema.String,
        origin: Schema.Struct({ type: Schema.String, actorId: Schema.optional(Schema.String) }),
      }),
    ),
  }),
)

const json = { 'content-type': 'application/json' }

/** A host with one waiting run, and a way to read the origins of the notes it received. */
async function hostWith(authorize: Authorize) {
  const looms = createLooms({ modules: [workflow({ definitions: [flow] }), notes], authorize })

  const started = await looms.fetch(
    new Request('http://looms.test/runs', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ kind: 'workflow', definitionName: 'await-note', runId: 'run_1' }),
    }),
  )

  expect(started?.status).toBe(200)

  const send = (path: string, body: JsonValue, headers: Record<string, string> = {}) =>
    looms.fetch(
      new Request(`http://looms.test/runs/run_1/${path}`, {
        method: 'POST',
        headers: { ...json, ...headers },
        body: JSON.stringify(body),
      }),
    )

  const noteOrigins = async () => {
    const response = await looms.fetch(new Request('http://looms.test/runs/run_1/events'))

    return decodeEvents(await response?.json())
      .events.filter((event) => event.type === 'notes.added')
      .map((event) => event.origin)
  }

  return { looms, send, noteOrigins }
}

describe('who a request acts as', () => {
  test('a named signal is recorded as sent by the actor authorize names', async () => {
    const { looms, send, noteOrigins } = await hostWith(() =>
      Effect.succeed(authAllowedAs('user_1')),
    )

    const sent = await send('signals/notes/add', { input: { text: 'hello' } })

    expect(sent?.status).toBe(200)
    expect(await noteOrigins()).toEqual([{ type: 'external', actorId: 'user_1' }])

    await looms.stop()
  })

  test('a request cannot name a different actor than authorize did', async () => {
    const { looms, send, noteOrigins } = await hostWith(() =>
      Effect.succeed(authAllowedAs('user_1')),
    )

    const sent = await send('events', {
      events: [
        {
          type: 'notes.added',
          payload: { text: 'forged' },
          origin: { type: 'external', actorId: 'someone_else' },
        },
      ],
    })

    expect(sent?.status).toBe(200)
    expect(await noteOrigins()).toEqual([{ type: 'external', actorId: 'user_1' }])

    await looms.stop()
  })

  test('without a named actor, events are external and anonymous as before', async () => {
    const { looms, send, noteOrigins } = await hostWith(() => Effect.succeed(authAllowed))

    await send('signals/notes/add', { input: { text: 'hello' } })

    expect(await noteOrigins()).toEqual([{ type: 'external' }])

    await looms.stop()
  })

  test('forwardedActorAuth takes the actor from the header a trusted front set', async () => {
    const { looms, send, noteOrigins } = await hostWith(forwardedActorAuth())

    await send('signals/notes/add', { input: { text: 'one' } }, { [ACTOR_HEADER]: 'user_2' })

    expect(await noteOrigins()).toEqual([{ type: 'external', actorId: 'user_2' }])

    await looms.stop()
  })

  test('forwardedActorAuth names no one when the front set no header', async () => {
    const { looms, send, noteOrigins } = await hostWith(forwardedActorAuth())

    await send('signals/notes/add', { input: { text: 'one' } })

    expect(await noteOrigins()).toEqual([{ type: 'external' }])

    await looms.stop()
  })

  test('forwardedActorAuth still applies the policy it wraps', async () => {
    const { looms, send, noteOrigins } = await hostWith(
      forwardedActorAuth((_request, route) =>
        Effect.succeed(
          route.name === 'runs.signal'
            ? { allowed: false, status: 403, error: 'Forbidden' }
            : authAllowed,
        ),
      ),
    )

    const raw = await send(
      'events',
      { type: 'notes.added', payload: { text: 'raw' } },
      { [ACTOR_HEADER]: 'user_2' },
    )

    expect(raw?.status).toBe(403)
    expect(await noteOrigins()).toEqual([])

    await looms.stop()
  })
})

describe('route info', () => {
  test('authorize is told which signal a named signal request sends', async () => {
    const seen: RouteInfo[] = []

    const { looms, send } = await hostWith((_request, route) =>
      Effect.sync(() => {
        seen.push(route)
        return authAllowed
      }),
    )

    await send('signals/notes/add', { input: { text: 'hello' } })

    expect(seen.at(-1)).toEqual({
      access: 'write',
      name: 'runs.signal.named',
      runId: 'run_1',
      signal: 'notes/add',
    })

    await looms.stop()
  })

  test('describeRoute names a route without a runtime', () => {
    expect(describeRoute('GET', '/runs/run_1/events')).toEqual({
      access: 'read',
      name: 'runs.events',
      runId: 'run_1',
    })

    expect(describeRoute('POST', '/runs/run_1/signals/notes/add')).toEqual({
      access: 'write',
      name: 'runs.signal.named',
      runId: 'run_1',
      signal: 'notes/add',
    })

    expect(describeRoute('POST', '/runs/run_1/events')).toMatchObject({
      access: 'write',
      name: 'runs.signal',
    })

    expect(describeRoute('POST', '/runs')).toEqual({ access: 'write', name: 'runs.start' })
    expect(describeRoute('POST', '/operations/deadlines/rescan')?.access).toBe('operations')
  })

  test('describeRoute returns null for public routes and paths Looms does not serve', () => {
    expect(describeRoute('GET', '/health')).toBeNull()
    expect(describeRoute('GET', '/not-looms')).toBeNull()
    expect(describeRoute('DELETE', '/runs/run_1')).toBeNull()
  })
})
