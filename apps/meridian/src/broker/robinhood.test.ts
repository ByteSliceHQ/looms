import { describe, expect, test } from 'bun:test'

import {
  base64ToBytes,
  bytesToBase64,
  clientOrderId,
  createTokenBucket,
  robinhoodBroker,
  signRequest,
} from './robinhood'

const PREFIX = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
])

describe('Robinhood crypto broker', () => {
  test('a signature verifies and an effect id keeps one client order id', async () => {
    const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))
    const seed = pkcs8.slice(PREFIX.length)
    const body = '{"symbol":"BTC-USD"}'

    const signature = await signRequest({
      apiKey: 'key',
      privateKey: bytesToBase64(seed),
      timestamp: '1700000000',
      path: '/api/v2/crypto/trading/orders/',
      method: 'POST',
      body,
    })

    const message = new TextEncoder().encode(
      `key1700000000/api/v2/crypto/trading/orders/POST${body}`,
    )

    const signatureBytes = base64ToBytes(signature)
    const signatureBuffer = new ArrayBuffer(signatureBytes.byteLength)
    new Uint8Array(signatureBuffer).set(signatureBytes)

    const verified = await crypto.subtle.verify(
      { name: 'Ed25519' },
      pair.publicKey,
      signatureBuffer,
      message,
    )

    expect(verified).toBe(true)

    const first = await clientOrderId('eff_order')
    const second = await clientOrderId('eff_order')
    const other = await clientOrderId('eff_other')
    expect(first).toBe(second)
    expect(first).not.toBe(other)
    expect(first).toHaveLength(36)
  })

  test('the token bucket waits once the burst is spent', async () => {
    let now = 0
    const slept: number[] = []

    const bucket = createTokenBucket({
      capacity: 1,
      perMinute: 60,
      now: () => now,
      sleep: (ms) => {
        slept.push(ms)
        now += ms
        return Promise.resolve()
      },
    })

    await bucket.take()
    await bucket.take()
    expect(slept.length).toBeGreaterThan(0)
  })

  test('order polling maps filled, working, and rejected states', async () => {
    const fetchImpl = Object.assign(
      (input: RequestInfo | URL): Promise<Response> => {
        const url = input instanceof URL ? input.href : input instanceof Request ? input.url : input

        if (url.includes('/accounts/')) {
          return Promise.resolve(
            Response.json({ results: [{ account_number: 'acct', state: 'open' }] }),
          )
        }

        if (url.includes('/orders/filled')) {
          return Promise.resolve(
            Response.json({
              id: 'filled',
              state: 'filled',
              executions: [{ effective_price: '100', quantity: '1' }],
            }),
          )
        }

        if (url.includes('/orders/open-order')) {
          return Promise.resolve(Response.json({ id: 'open-order', state: 'open' }))
        }

        return Promise.resolve(
          Response.json({
            id: 'dead',
            state: 'canceled',
            executions: [{ effective_price: '100', quantity: '0.4' }],
          }),
        )
      },
      { preconnect: fetch.preconnect },
    )

    const broker = robinhoodBroker({
      apiKey: 'key',
      privateKey: bytesToBase64(new Uint8Array(32)),
      fetch: fetchImpl,
      bucket: { take: () => Promise.resolve() },
      now: () => 1_700_000_000_000,
    })

    expect((await broker.status('filled')).status).toBe('filled')
    expect((await broker.status('open-order')).status).toBe('working')
    expect((await broker.status('dead')).status).toBe('partial')
  })
})
