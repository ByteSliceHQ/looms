import { describe, expect, test } from 'bun:test'
import * as net from 'node:net'

import { Effect, Predicate, Schema } from 'effect'

import { EventStoreConflictError, snapshotStoreOf } from '@looms/core'

import {
  findS2Binary,
  isPortOpen,
  s2,
  s2ConfigFromEnv,
  S2ConfigSchema,
  startS2Lite,
  streamNameForRun,
} from './index'

describe('@looms/s2 config', () => {
  test('streamNameForRun maps to runs/{id}', () => {
    expect(streamNameForRun('run_1')).toBe('runs/run_1')
  })

  test('S2ConfigSchema accepts basin + token', () => {
    const cfg = Schema.decodeSync(S2ConfigSchema)({
      basin: 'looms-dev',
      accessToken: 'tok_test',
    })

    expect(cfg.basin).toBe('looms-dev')
    expect(cfg.accessToken).toBe('tok_test')
  })

  test('S2ConfigSchema accepts endpoint string', () => {
    const cfg = Schema.decodeSync(S2ConfigSchema)({
      basin: 'local',
      accessToken: 'tok',
      endpoint: 'http://127.0.0.1:8080',
    })

    expect(cfg.endpoint).toBe('http://127.0.0.1:8080')
  })

  test('s2ConfigFromEnv reads custom environment variables', () => {
    const cfg = s2ConfigFromEnv({
      LOOMS_S2_BASIN: 'my-basin',
      LOOMS_S2_ACCESS_TOKEN: 'secret-token',
      LOOMS_S2_ENDPOINT: 'http://localhost:9090',
    })

    expect(cfg.basin).toBe('my-basin')
    expect(cfg.accessToken).toBe('secret-token')
    expect(cfg.endpoint).toBe('http://localhost:9090')
  })

  test('s2ConfigFromEnv falls back to port variables', () => {
    const cfg = s2ConfigFromEnv({
      S2_PORT: '8081',
    })

    expect(cfg.basin).toBe('looms-demo')
    expect(cfg.accessToken).toBe('s2_local')
    expect(cfg.endpoint).toBe('http://127.0.0.1:8081')
  })

  test('s2() synchronous constructor returns EventStore without immediate network access', () => {
    const store = s2({
      basin: 'test-basin',
      accessToken: 'tok_test',
      endpoint: 'http://127.0.0.1:8080',
    })

    expect(Predicate.isFunction(store.append)).toBe(true)
    expect(Predicate.isFunction(store.read)).toBe(true)
    expect(Predicate.isFunction(store.tail)).toBe(true)
    expect(Predicate.isFunction(store.subscribe)).toBe(true)
    expect(Effect.isEffect(store.listRuns)).toBe(true)
    expect(snapshotStoreOf(store)).toBeDefined()
  })

  test('isPortOpen returns false for closed port', async () => {
    const open = await isPortOpen(64321)
    expect(open).toBe(false)
  })

  test('findS2Binary returns string or undefined without crashing', () => {
    const binary = findS2Binary({})
    expect(Predicate.isString(binary) || binary === undefined).toBe(true)
  })

  test('startS2Lite reuses running port when already answering', async () => {
    const server = net.createServer((socket) => socket.end())
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const address = server.address()

    if (!address || Predicate.isString(address)) {
      server.close()
      return
    }

    const port = address.port

    try {
      const running = await startS2Lite({ port })
      expect(running.port).toBe(port)
      expect(running.endpoint).toBe(`http://127.0.0.1:${port}`)
      expect(Predicate.isFunction(running.stop)).toBe(true)
      running.stop()
    } finally {
      server.close()
    }
  })

  test('EventStoreConflictError formats actorId and tails', () => {
    const err = new EventStoreConflictError('actor_123', 5, 3)
    expect(err.conflict).toBe(true)
    expect(err.expectedTail).toBe(5)
    expect(err.actualTail).toBe(3)
    expect(err.message).toContain('actor_123')
  })
})
