import { Effect, Predicate } from 'effect'
import { z } from 'zod'

import { asJson, type JsonValue } from '@swirls/looms/core'

import { liveCredentials } from '../bindings'
import { quoteAt, round, type Quote } from '../market'
import type { Broker, BrokerFill, BrokerOrder, BrokerResult, BrokerStatus } from './types'

const BASE = 'https://trading.robinhood.com'

const ED25519_PKCS8_PREFIX = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
])

const ORDER_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'

export interface TokenBucket {
  take(): Promise<void>
}

export function createTokenBucket(options: {
  readonly capacity: number
  readonly perMinute: number
  readonly now?: () => number
  readonly sleep?: (ms: number) => Promise<void>
}): TokenBucket {
  let tokens = options.capacity
  let updated = (options.now ?? Date.now)()
  const now = options.now ?? Date.now
  const sleep = options.sleep ?? ((ms: number) => Effect.runPromise(Effect.sleep(ms)))

  const refill = () => {
    const current = now()
    const gained = ((current - updated) / 60_000) * options.perMinute
    tokens = Math.min(options.capacity, tokens + gained)
    updated = current
  }

  const take = async (): Promise<void> => {
    for (;;) {
      refill()

      if (tokens >= 1) {
        tokens -= 1
        return
      }

      await sleep(Math.max(1, Math.ceil(60_000 / options.perMinute)))
    }
  }

  return { take }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function bytesOf(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copy).set(bytes)
  return copy
}

function pkcs8FromSeed(seed: Uint8Array): Uint8Array {
  const key = new Uint8Array(ED25519_PKCS8_PREFIX.length + seed.length)
  key.set(ED25519_PKCS8_PREFIX)
  key.set(seed, ED25519_PKCS8_PREFIX.length)
  return key
}

export async function signRequest(input: {
  readonly apiKey: string
  readonly privateKey: string
  readonly timestamp: string
  readonly path: string
  readonly method: string
  readonly body: string
}): Promise<string> {
  const seed = base64ToBytes(input.privateKey)

  const key = await crypto.subtle.importKey(
    'pkcs8',
    bytesOf(pkcs8FromSeed(seed)),
    { name: 'Ed25519' },
    false,
    ['sign'],
  )

  const message = new TextEncoder().encode(
    `${input.apiKey}${input.timestamp}${input.path}${input.method}${input.body}`,
  )

  const signature = await crypto.subtle.sign({ name: 'Ed25519' }, key, message)
  return bytesToBase64(new Uint8Array(signature))
}

function uuidBytes(value: string): Uint8Array {
  const hex = value.replace(/-/g, '')
  const bytes = new Uint8Array(16)

  for (let index = 0; index < 16; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }

  return bytes
}

function formatUuid(bytes: Uint8Array): string {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Stable UUID for an effect id, so a redelivered order keeps the same client id. */
export async function clientOrderId(effectId: string): Promise<string> {
  const prefix = uuidBytes(ORDER_NAMESPACE)
  const name = new TextEncoder().encode(effectId)
  const data = new Uint8Array(prefix.length + name.length)
  data.set(prefix)
  data.set(name, prefix.length)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', bytesOf(data)))
  const bytes = digest.slice(0, 16)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  return formatUuid(bytes)
}

interface RobinhoodClientOptions {
  readonly apiKey: string
  readonly privateKey: string
  readonly fetch?: typeof fetch
  readonly bucket?: TokenBucket
  readonly now?: () => number
}

const NumberLike = z.union([z.number(), z.string()])

const OrderBody = z.object({
  id: z.string().optional(),
  state: z.string().optional(),
  symbol: z.string().optional(),
  account_number: z.string().optional(),
  average_price: NumberLike.optional(),
  filled_asset_quantity: NumberLike.optional(),
  price: NumberLike.optional(),
  bid_inclusive_of_sell_spread: NumberLike.optional(),
  ask_inclusive_of_buy_spread: NumberLike.optional(),
  executions: z
    .array(
      z.object({
        effective_price: z.string().optional(),
        quantity: z.string().optional(),
      }),
    )
    .optional(),
})

type OrderBody = z.infer<typeof OrderBody>

const OrderPage = z.object({
  results: z.array(OrderBody).optional(),
})

function numberOf(value: number | string | undefined): number {
  if (Predicate.isNumber(value)) {
    return Number.isFinite(value) ? value : 0
  }

  if (Predicate.isString(value)) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function readOrder(value: JsonValue | undefined): OrderBody {
  const parsed = OrderBody.safeParse(value)
  return parsed.success ? parsed.data : {}
}

function readPage(value: JsonValue | undefined): OrderBody[] {
  const parsed = OrderPage.safeParse(value)
  return parsed.success ? (parsed.data.results ?? []) : []
}

function mapState(state: string | undefined, filled: number, requested: number): BrokerStatus {
  switch (state) {
    case 'filled':
      return filled > 0 && filled + 1e-8 < requested ? 'partial' : 'filled'
    case 'canceled':
    case 'failed':
      return filled > 0 ? 'partial' : 'rejected'
    case 'open':
    case 'pending':
    case undefined:
      return 'working'
    default:
      return 'working'
  }
}

function fillsOf(order: OrderBody, fallbackPrice: number): BrokerFill[] {
  const executions = order.executions ?? []

  if (executions.length > 0) {
    return executions.map((execution) => ({
      price: numberOf(execution.effective_price) || fallbackPrice,
      qty: numberOf(execution.quantity),
    }))
  }

  const qty = numberOf(order.filled_asset_quantity)

  if (qty > 0) {
    return [{ price: numberOf(order.average_price) || fallbackPrice, qty }]
  }

  return []
}

function resultOf(order: OrderBody, requested: BrokerOrder, orderId: string): BrokerResult {
  const fills = fillsOf(order, requested.arrivalPrice)
  const filledQty = fills.reduce((sum, fill) => sum + fill.qty, 0)
  const notional = fills.reduce((sum, fill) => sum + fill.price * fill.qty, 0)
  const vwap = filledQty > 0 ? notional / filledQty : 0
  const status = mapState(order.state, filledQty, requested.qty)

  const slip =
    vwap > 0 && requested.arrivalPrice > 0
      ? requested.side === 'buy'
        ? ((vwap - requested.arrivalPrice) / requested.arrivalPrice) * 10_000
        : ((requested.arrivalPrice - vwap) / requested.arrivalPrice) * 10_000
      : 0

  return {
    orderId: order.id ?? orderId,
    status,
    reason: order.state ?? status,
    fills,
    vwap: round(vwap),
    slippageBps: round(slip, 2),
  }
}

export function robinhoodBroker(options: RobinhoodClientOptions): Broker {
  const fetchImpl = options.fetch ?? fetch

  const bucket =
    options.bucket ?? createTokenBucket({ capacity: 100, perMinute: 100, now: options.now })

  let accountNumber: string | undefined

  const request = async (
    method: string,
    path: string,
    body = '',
  ): Promise<JsonValue | undefined> => {
    await bucket.take()
    const timestamp = String(Math.floor((options.now ?? Date.now)() / 1000))

    const signature = await signRequest({
      apiKey: options.apiKey,
      privateKey: options.privateKey,
      timestamp,
      path,
      method,
      body,
    })

    const response = await fetchImpl(`${BASE}${path}`, {
      method,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-api-key': options.apiKey,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: body === '' ? undefined : body,
    })

    const text = await response.text()

    if (!response.ok) {
      throw new Error(`Robinhood ${method} ${path} failed (${response.status})`)
    }

    if (!text) {
      return undefined
    }

    try {
      return asJson(JSON.parse(text))
    } catch {
      return undefined
    }
  }

  const account = async (): Promise<string> => {
    if (accountNumber) {
      return accountNumber
    }

    const body = await request('GET', '/api/v2/crypto/trading/accounts/')
    const number = readPage(body)[0]?.account_number ?? ''

    if (!number) {
      throw new Error('Robinhood did not return a crypto account')
    }

    accountNumber = number
    return number
  }

  const quote = async (symbol: string, tick: number): Promise<Quote> => {
    const path = `/api/v2/crypto/marketdata/best_bid_ask/?symbol=${encodeURIComponent(symbol)}`
    const body = await request('GET', path)
    const parsed = readPage(body).find((item) => item.symbol === symbol)
    const bid = numberOf(parsed?.bid_inclusive_of_sell_spread)
    const ask = numberOf(parsed?.ask_inclusive_of_buy_spread)
    const last = numberOf(parsed?.price) || (bid + ask) / 2

    if (!(bid > 0) || !(ask > 0)) {
      throw new Error(`Robinhood has no quote for ${symbol}`)
    }

    const simulated = quoteAt(symbol, tick, 'robinhood')
    return {
      symbol,
      tick,
      bid,
      ask,
      last,
      spread: round(ask - bid),
      depth: simulated?.depth ?? [],
      venue: 'robinhood',
    }
  }

  return {
    quote,
    async submit(order, clientId) {
      const accountId = await account()
      const path = `/api/v2/crypto/trading/orders/?account_number=${encodeURIComponent(accountId)}`

      const body = JSON.stringify({
        client_order_id: clientId,
        side: order.side,
        type: 'market',
        symbol: order.symbol,
        market_order_config: { asset_quantity: String(order.qty) },
      })

      const placed = await request('POST', path, body)
      return resultOf(readOrder(placed), order, clientId)
    },
    async status(orderId) {
      const accountId = await account()
      const path = `/api/v2/crypto/trading/orders/${encodeURIComponent(orderId)}/?account_number=${encodeURIComponent(accountId)}`
      const body = await request('GET', path)
      return resultOf(
        readOrder(body),
        {
          symbol: '',
          side: 'buy',
          qty: 0,
          tick: 0,
          arrivalPrice: 0,
        },
        orderId,
      )
    },
    async cancel(orderId) {
      await request('POST', `/api/v2/crypto/trading/orders/${encodeURIComponent(orderId)}/cancel/`)
    },
  }
}

export function liveQuote(symbol: string, tick: number): Promise<Quote> {
  const credentials = liveCredentials()

  if (!credentials) {
    return Promise.reject(new Error('Robinhood is not configured'))
  }

  return robinhoodBroker(credentials).quote(symbol, tick)
}
