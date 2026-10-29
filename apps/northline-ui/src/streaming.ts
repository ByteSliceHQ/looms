import { isJsonObject, isJsonString } from '@swirls/looms/core'
import { defineLiveFold } from '@swirls/looms/react'

const initialState = {
  lastMessageSeq: -1,
  turnStarted: false,
  parts: new Array<string>(),
}

/** Text the dispatcher has streamed since the last durable message. */
export const streamingText = defineLiveFold({
  name: 'northlineStreamingText',
  initialState,
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
