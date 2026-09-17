import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { createKind, defineKind } from './kind'

const AuctionInput = Schema.Struct({
  item: Schema.String,
  reservePrice: Schema.Finite,
})

describe('defineKind', () => {
  test('stamps kind onto the definition fields', () => {
    const vintageWatch = defineKind('auction', {
      name: 'vintage-watch',
      input: AuctionInput,
    })

    expect(vintageWatch.kind).toBe('auction')
    expect(vintageWatch.name).toBe('vintage-watch')
    expect(vintageWatch.input).toBe(AuctionInput)
  })

  test('the bound kind wins if the body also has kind', () => {
    const def = defineKind('auction', {
      kind: 'other',
      name: 'vintage-watch',
    })

    expect(def.kind).toBe('auction')
  })
})

describe('createKind', () => {
  test('binds define to one kind', () => {
    const auction = createKind('auction')

    const vintageWatch = auction.define({
      name: 'vintage-watch',
      input: AuctionInput,
    })

    expect(auction.kind).toBe('auction')

    expect(vintageWatch).toEqual({
      kind: 'auction',
      name: 'vintage-watch',
      input: AuctionInput,
    })
  })
})
