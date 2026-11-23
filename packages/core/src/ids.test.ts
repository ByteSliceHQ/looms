import { describe, expect, test } from 'bun:test'

import {
  createEventId,
  createRunId,
  createThreadId,
  createWaitId,
  deterministicRunId,
  deterministicThreadId,
  encodeTypeIdSuffix,
  InvalidIdFormatError,
  parseEffectId,
  resolveIds,
  typeId,
  typeIds,
  uuidV7,
  type LoomsIds,
} from './ids'

function uuidBytes(uuid: string): Uint8Array {
  const hex = uuid.replaceAll('-', '')
  return Uint8Array.from({ length: 16 }, (_, index) =>
    Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16),
  )
}

const SUFFIX = '[0-7][0-9a-hjkmnp-tv-z]{25}'

describe('TypeID encoding', () => {
  // From the TypeID 0.3 spec's valid.yml.
  const vectors = [
    ['', '00000000-0000-0000-0000-000000000000', '00000000000000000000000000'],
    ['', '00000000-0000-0000-0000-000000000001', '00000000000000000000000001'],
    ['', '00000000-0000-0000-0000-00000000000a', '0000000000000000000000000a'],
    ['', '00000000-0000-0000-0000-000000000010', '0000000000000000000000000g'],
    ['', '00000000-0000-0000-0000-000000000020', '00000000000000000000000010'],
    ['', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '7zzzzzzzzzzzzzzzzzzzzzzzzz'],
    ['prefix', '0110c853-1d09-52d8-d73e-1194e95b5f19', 'prefix_0123456789abcdefghjkmnpqrs'],
    ['prefix', '01890a5d-ac96-774b-bcce-b302099a8057', 'prefix_01h455vb4pex5vsknk084sn02q'],
  ] as const

  test.each(vectors)('prefix %p, uuid %s encodes to %s', (prefix, uuid, expected) => {
    const bytes = uuidBytes(uuid)

    expect(prefix === '' ? encodeTypeIdSuffix(bytes) : typeId(prefix, bytes)).toBe(expected)
  })

  test('rejects anything but 16 bytes', () => {
    expect(() => encodeTypeIdSuffix(new Uint8Array(15))).toThrow(RangeError)
  })
})

describe('typeIds', () => {
  test('draws each kind with its prefix and a 26-character suffix', () => {
    expect(typeIds.create('event')).toMatch(new RegExp(`^evt_${SUFFIX}$`))
    expect(typeIds.create('run')).toMatch(new RegExp(`^run_${SUFFIX}$`))
    expect(typeIds.create('thread')).toMatch(new RegExp(`^thr_${SUFFIX}$`))
    expect(typeIds.create('wait')).toMatch(new RegExp(`^wait_${SUFFIX}$`))
  })

  test('the standalone factories draw from the default format', () => {
    expect(createEventId()).toMatch(new RegExp(`^evt_${SUFFIX}$`))
    expect(createRunId()).toMatch(new RegExp(`^run_${SUFFIX}$`))
    expect(createThreadId()).toMatch(new RegExp(`^thr_${SUFFIX}$`))
    expect(createWaitId()).toMatch(new RegExp(`^wait_${SUFFIX}$`))
    expect(createWaitId('scope')).toMatch(new RegExp(`^wait_scope_${SUFFIX}$`))
    expect(createWaitId('scope', 'tag')).toBe('wait_scope_tag')
  })

  test('drawn ids carry a UUIDv7', () => {
    const before = Date.now()
    const bytes = uuidV7()
    const after = Date.now()

    const timestamp = bytes.slice(0, 6).reduce((total, byte) => total * 256 + byte, 0)

    expect(timestamp).toBeGreaterThanOrEqual(before)
    expect(timestamp).toBeLessThanOrEqual(after)
    expect(bytes[6]! >> 4).toBe(7)
    expect(bytes[8]! >> 6).toBe(0b10)
  })

  test('drawn ids are unique and strictly increasing within a process', () => {
    const ids = Array.from({ length: 20_000 }, () => typeIds.create('event'))

    expect(new Set(ids).size).toBe(ids.length)

    for (let index = 1; index < ids.length; index++) {
      expect(ids[index]! > ids[index - 1]!).toBe(true)
    }
  })

  test('derived ids are stable for the same parts and distinct for different parts', () => {
    expect(typeIds.derive('thread', ['parent', 'turn', 'm1'])).toBe(
      typeIds.derive('thread', ['parent', 'turn', 'm1']),
    )

    expect(typeIds.derive('thread', ['parent', 'turn', 'm1'])).not.toBe(
      typeIds.derive('thread', ['parent', 'turn', 'm2']),
    )

    expect(typeIds.derive('thread', ['a:b', 'c'])).not.toBe(typeIds.derive('thread', ['a', 'b:c']))
    expect(typeIds.derive('thread', ['a', 1])).not.toBe(typeIds.derive('thread', ['a', '1']))
  })

  test('derived ids do not change between releases', () => {
    expect(typeIds.derive('thread', ['parent', 'turn', 'm1'])).toBe(
      deterministicThreadId('parent', 'turn', 'm1'),
    )

    expect(typeIds.derive('run', ['run_1', 'child'])).toBe(deterministicRunId('run_1', 'child'))

    expect(deterministicThreadId('parent', 'turn', 'm1')).toMatchInlineSnapshot(
      `"thr_5jaxh3gq97gegtmm79cv8bkzb5"`,
    )

    expect(deterministicRunId('run_1', 'child')).toMatchInlineSnapshot(
      `"run_08f3zr1zheg44b169ef08f783w"`,
    )
  })

  test('derived ids are TypeIDs with the kind prefix', () => {
    const thread = deterministicThreadId('session:1', 'turn', 'message:with:colons')
    const run = deterministicRunId('session:1', 'turn', 'message:with:colons')

    expect(thread).toMatch(new RegExp(`^thr_${SUFFIX}$`))
    expect(run).toMatch(new RegExp(`^run_${SUFFIX}$`))
    expect(run.slice(4)).not.toBe(thread.slice(4))
  })

  test('a derived id never splits an effect id', () => {
    const id = deterministicThreadId('session:1', 'turn', 'message:with:colons')

    expect(parseEffectId(`${id}:tag`)).toEqual({ threadId: id, tag: 'tag' })
  })
})

function custom(overrides: Partial<LoomsIds> = {}): LoomsIds {
  let next = 0

  return {
    create: (kind) => `${kind}-${++next}`,
    derive: (kind, parts) => `${kind}-${parts.join('.')}`,
    ...overrides,
  }
}

function brokenRule(ids: LoomsIds) {
  try {
    resolveIds(ids)
  } catch (error) {
    return error instanceof InvalidIdFormatError ? error.rule : error
  }

  return undefined
}

describe('resolveIds', () => {
  test('defaults to typeIds', () => {
    expect(resolveIds()).toBe(typeIds)
    expect(resolveIds(typeIds)).toBe(typeIds)
  })

  test('passes a valid custom format through and resolves it once', () => {
    const ids = resolveIds(custom())

    expect(ids.derive('thread', ['a', 1])).toBe('thread-a.1')
    expect(ids.create('run')).toMatch(/^run-\d+$/)
    expect(resolveIds(ids)).toBe(ids)
  })

  test('rejects a format that returns an empty id', () => {
    expect(() => resolveIds(custom({ create: () => '' }))).toThrow(InvalidIdFormatError)
    expect(() => resolveIds(custom({ create: () => '' }))).toThrow(/non-empty string/)
    expect(() => resolveIds(custom({ derive: () => '' }))).toThrow(/ids\.derive\('run', parts\)/)
  })

  test('rejects a format whose ids contain a colon', () => {
    expect(() => resolveIds(custom({ create: (kind) => `${kind}:1` }))).toThrow(
      /ids\.create\('event'\) returned "event:1", which contains ":"/,
    )

    expect(() => resolveIds(custom({ derive: (kind) => `urn:${kind}` }))).toThrow(
      InvalidIdFormatError,
    )
  })

  test('names the broken rule on the error', () => {
    expect(brokenRule(custom({ create: () => '' }))).toBe('non-empty')
    expect(brokenRule(custom({ create: () => 'a:b' }))).toBe('no-colon')
  })

  test('checks ids drawn after the option was accepted', () => {
    let calls = 0

    const ids = resolveIds(
      custom({ create: (kind) => (++calls > 4 ? 'late:colon' : `${kind}-ok`) }),
    )

    expect(() => ids.create('run')).toThrow(/contains ":"/)
  })
})
