import { z } from 'zod'

import {
  complete,
  defineEventCatalog,
  defineModule,
  wait,
  type DefinitionRef,
} from '@looms/core'
import { createLooms } from '@looms/runtime'

// Custom thread: define your own state machine / actor kind using defineModule.
// Neither @looms/agent nor @looms/workflow is required.
// bun run --filter @looms/examples custom-thread

const AuctionInput = z.object({
  item: z.string(),
  reservePrice: z.number(),
})

const BidPayload = z.object({
  bidder: z.string(),
  amount: z.number(),
})

const ClosePayload = z.object({
  reason: z.string().optional(),
})

const WrappedEventSchema = z.object({
  type: z.string(),
  payload: z.unknown().optional(),
})

export interface AuctionDefinition extends DefinitionRef {
  readonly kind: 'auction'
  readonly name: string
  readonly input: typeof AuctionInput
}

function defineAuction(name: string): AuctionDefinition {
  return {
    kind: 'auction',
    name,
    input: AuctionInput,
  }
}

// 1. Declare domain events for the thread to observe
const auctionCatalog = defineEventCatalog('auction', {
  bid: BidPayload,
  close: ClosePayload,
})

const vintageWatch = defineAuction('vintage-watch')

interface AuctionState {
  readonly item: string
  readonly reservePrice: number
  readonly highestBid: number
  readonly highestBidder: string
  readonly bidCount: number
  readonly status: 'open' | 'closed'
}

function applyBid(state: AuctionState, bid: z.infer<typeof BidPayload>): AuctionState {
  if (state.status !== 'open') {
    return state
  }

  if (bid.amount > state.highestBid) {
    return {
      ...state,
      highestBid: bid.amount,
      highestBidder: bid.bidder,
      bidCount: state.bidCount + 1,
    }
  }

  return { ...state, bidCount: state.bidCount + 1 }
}

// 2. Define the module that implements the 'auction' thread kind
const auctionModule = defineModule(
  {
    namespace: 'auction',
    protocolVersion: '1.0.0',
    events: auctionCatalog,
  },
  (m) => ({
    // Modules carry the definitions they implement
    definitions: [vintageWatch],
    threads: {
      auction: m.thread({
        kind: 'auction',
        input: AuctionInput,
        initialState: (ctx): AuctionState => ({
          item: ctx.input.item,
          reservePrice: ctx.input.reservePrice,
          highestBid: 0,
          highestBidder: 'nobody',
          bidCount: 0,
          status: 'open',
        }),
        step: (state, event): AuctionState => {
          switch (event.type) {
            case 'auction.bid':
              return applyBid(state, event.payload)

            case 'auction.close':
              return { ...state, status: 'closed' }

            // Protocol events deliver matched domain events that satisfied a wait
            case 'runtime.wait.satisfied': {
              const parsedWrapper = WrappedEventSchema.safeParse(event.payload.event)

              if (!parsedWrapper.success) {
                return state
              }

              const inner = parsedWrapper.data

              if (inner.type === 'auction.bid') {
                const parsed = BidPayload.safeParse(inner.payload)

                return parsed.success ? applyBid(state, parsed.data) : state
              }

              if (inner.type === 'auction.close') {
                return { ...state, status: 'closed' }
              }

              return state
            }

            default:
              return state
          }
        },
        effects: (state) => {
          if (state.status === 'closed') {
            const metReserve = state.highestBid >= state.reservePrice

            return [
              complete({
                item: state.item,
                winner: metReserve ? state.highestBidder : null,
                winningBid: metReserve ? state.highestBid : 0,
                reserveMet: metReserve,
                totalBids: state.bidCount,
              }),
            ]
          }

          // While open, park the thread until a bid or close event arrives
          return [
            wait({
              waitId: `bid_wait_${state.bidCount}`,
              on: { type: ['auction.bid', 'auction.close'] },
            }),
          ]
        },
      }),
    },
    projections: {
      bids: m.projection({
        name: 'bids',
        shape: z.object({
          history: z.array(BidPayload),
        }),
        initialState: { history: [] },
        reduce(state, event) {
          if (event.type === 'auction.bid') {
            return { history: [...state.history, event.payload] }
          }

          return state
        },
      }),
    },
  }),
)

// 3. Stand up a runtime with only the custom auction module
const looms = createLooms({
  modules: [auctionModule],
})

// Start the auction run
const { runId, state: initialState } = await looms.start(vintageWatch, {
  item: '1968 Chronograph',
  reservePrice: 250,
})

console.log('started auction run:', runId, 'status:', initialState.status)

// Send signals (bids) into the running auction
await looms.signal(runId, [
  auctionCatalog.input('bid', { bidder: 'Alice', amount: 200 }),
])

console.log('placed bid from Alice ($200)')

await looms.signal(runId, [
  auctionCatalog.input('bid', { bidder: 'Bob', amount: 320 }),
])

console.log('placed bid from Bob ($320)')

// Close the auction
const finalState = await looms.signal(runId, [
  auctionCatalog.input('close', { reason: 'Going once, going twice, sold!' }),
])

console.log('final run status:', finalState.status)

const rootThread = finalState.threads[finalState.rootThreadId!]

console.log('auction outcome:', rootThread?.output)

// Query the projection for the full bid history
const history = await looms.project(runId, auctionModule.projections.bids)

console.log('bid history projection:', history.history)

await looms.stop()
