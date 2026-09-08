import { describe, expect, test } from 'bun:test'
import {
  decodeAppendableLoomsEvent,
  decodeLoomsEvent,
  encodeAppendableLoomsEvent,
  encodeLoomsEvent,
  type AppendableLoomsEvent,
  type LoomsEvent,
} from './index'

describe('livestore-codec', () => {
  const sampleEvent: LoomsEvent = {
    id: 'evt_123',
    actorId: 'agt_test',
    type: 'agent.turn.completed',
    seq: 5,
    ts: 1700000000000,
    ephemeral: false,
    parentActorId: 'wf_parent',
    origin: { clientId: 'client_abc', sessionId: 'sess_123' },
    payload: { turn: 1, message: { role: 'assistant', content: 'hello' } },
  }

  test('round-trips encodeLoomsEvent and decodeLoomsEvent', () => {
    const encoded = encodeLoomsEvent(sampleEvent)
    expect(encoded.name).toBe('agent.turn.completed')
    expect(encoded.seqNum).toBe(5)
    expect(encoded.parentSeqNum).toBe(4)
    expect(encoded.clientId).toBe('client_abc')
    expect(encoded.sessionId).toBe('sess_123')
    expect(encoded.args.id).toBe('evt_123')
    expect(encoded.args.parentActorId).toBe('wf_parent')

    const decoded = decodeLoomsEvent(encoded, 'agt_test')
    expect(decoded).toEqual(sampleEvent)
  })

  test('encodes and decodes appendable events', () => {
    const appendable: AppendableLoomsEvent = {
      id: 'evt_456',
      type: 'agent.message.received',
      ts: 1700000001000,
      payload: { message: { role: 'user', content: 'hey' } },
      origin: { clientId: 'client_xyz', sessionId: 'sess_456' },
    }

    const encoded = encodeAppendableLoomsEvent(appendable, { parentSeqNum: 5 })
    expect(encoded.name).toBe('agent.message.received')
    expect(encoded.parentSeqNum).toBe(5)
    expect(encoded.seqNum).toBe(0)

    const decoded = decodeAppendableLoomsEvent(encoded, 'agt_test')
    expect(decoded).toBeDefined()
    expect(decoded!.type).toBe('agent.message.received')
    expect(decoded!.id).toBe('evt_456')
    expect(decoded!.payload).toEqual(appendable.payload)
  })

  test('decodeLoomsEvent also accepts direct Looms wire event shape', () => {
    const wireEvent = {
      id: 'evt_wire',
      actorId: 'agt_test',
      type: 'agent.message.received',
      seq: 2,
      ts: 1700000002000,
      payload: { message: { role: 'user', content: 'wire' } },
    }

    const decoded = decodeLoomsEvent(wireEvent, 'agt_test')
    expect(decoded.id).toBe('evt_wire')
    expect(decoded.type).toBe('agent.message.received')
    expect(decoded.seq).toBe(2)
  })
})
