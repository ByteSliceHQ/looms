import { describe, expect, test } from 'bun:test'
import { LOOMS_EVENT_NAMES } from './event-names'
import { events, LIVE_STORE_EVENT_KEYS } from './livestore-schema'

describe('LiveStore events coverage', () => {
  test('events object covers every LOOMS_EVENT_NAMES entry', () => {
    for (const name of LOOMS_EVENT_NAMES) {
      const key = LIVE_STORE_EVENT_KEYS[name]
      expect(key).toBeDefined()
      expect(events[key]).toBeDefined()
      expect(events[key].name).toBe(name)
    }
  })

  test('LIVE_STORE_EVENT_KEYS has no extras beyond LOOMS_EVENT_NAMES', () => {
    const names = new Set<string>(LOOMS_EVENT_NAMES)
    for (const name of Object.keys(LIVE_STORE_EVENT_KEYS)) {
      expect(names.has(name)).toBe(true)
    }
  })
})
