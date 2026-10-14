import { Schema } from 'effect'

import { isJsonObject, isJsonString } from '@looms/core'
import { defineLiveFold } from '@looms/react'

const StreamingTextSchema = Schema.Struct({
  lastMessageSeq: Schema.Finite,
  turnStarted: Schema.Boolean,
  parts: Schema.Array(Schema.String),
})

/** Text the active turn has streamed since the last durable agent message. */
export const streamingText = defineLiveFold({
  name: 'agentStreamingText',
  shape: StreamingTextSchema,
  initialState: { lastMessageSeq: -1, turnStarted: false, parts: [] },
  reduce(state, event) {
    if (
      event.type === 'agent.message' ||
      event.type === 'agent.turn.stopped' ||
      event.type === 'runtime.thread.cancelled'
    ) {
      return { lastMessageSeq: event.seq, turnStarted: false, parts: [] }
    }

    if (event.seq <= state.lastMessageSeq) {
      return state
    }

    if (event.type === 'agent.turn.started') {
      return { ...state, turnStarted: true }
    }

    if (
      event.type === 'agent.turn.text_delta' &&
      isJsonObject(event.payload) &&
      isJsonString(event.payload.delta)
    ) {
      return { ...state, turnStarted: true, parts: state.parts.concat(event.payload.delta) }
    }

    return state
  },
})
