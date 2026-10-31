import { isJsonObject, isJsonString } from '@swirls/looms/core'
import { defineLiveFold } from '@swirls/looms/react'

const initialState = {
  lastMessageSeq: -1,
  committed: new Array<string>(),
  live: new Array<string>(),
}

/** Finished analyst messages, plus the deltas of the turn still in flight. */
export const streamingText = defineLiveFold({
  name: 'meridianStreamingText',
  initialState,
  reduce(state, event) {
    if (event.type === 'agent.message' && isJsonObject(event.payload)) {
      const message = event.payload.message

      if (
        isJsonObject(message) &&
        message.role === 'assistant' &&
        isJsonString(message.content) &&
        message.content.length > 0
      ) {
        return {
          lastMessageSeq: event.seq,
          committed: state.committed.concat(message.content),
          live: [],
        }
      }

      return { ...state, lastMessageSeq: event.seq, live: [] }
    }

    if (event.seq <= state.lastMessageSeq) {
      return state
    }

    if (
      event.type === 'agent.turn.text_delta' &&
      isJsonObject(event.payload) &&
      isJsonString(event.payload.delta)
    ) {
      return { ...state, live: state.live.concat(event.payload.delta) }
    }

    return state
  },
})
