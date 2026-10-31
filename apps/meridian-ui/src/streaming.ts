import { isJsonNumber, isJsonObject, isJsonString, type JsonValue } from '@swirls/looms/core'
import { defineLiveFold } from '@swirls/looms/react'

export interface ToolCard {
  readonly id: string
  readonly name: string
  readonly detail: string
}

const initialState = {
  lastMessageSeq: -1,
  committed: new Array<string>(),
  live: new Array<string>(),
  tools: new Array<ToolCard>(),
}

function brief(value: JsonValue): string {
  if (isJsonString(value)) {
    return value
  }

  if (isJsonNumber(value)) {
    return String(value)
  }

  if (isJsonObject(value) && isJsonNumber(value.bid) && isJsonNumber(value.ask)) {
    return `${value.bid} / ${value.ask}`
  }

  const text = JSON.stringify(value)

  return text.length > 160 ? `${text.slice(0, 157)}...` : text
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
          tools: state.tools,
        }
      }

      return { ...state, lastMessageSeq: event.seq, live: [] }
    }

    if (event.type === 'agent.tool_call.requested' && isJsonObject(event.payload)) {
      const call = event.payload.toolCall

      if (isJsonObject(call) && isJsonString(call.id) && isJsonString(call.name)) {
        const detail = call.arguments === undefined ? '' : brief(call.arguments)

        return { ...state, tools: state.tools.concat({ id: call.id, name: call.name, detail }) }
      }
    }

    if (
      event.type === 'agent.tool.result' &&
      isJsonObject(event.payload) &&
      isJsonString(event.payload.toolCallId)
    ) {
      const toolCallId = event.payload.toolCallId
      const detail = event.payload.result === undefined ? '' : brief(event.payload.result)

      return {
        ...state,
        tools: state.tools.map((tool) => (tool.id === toolCallId ? { ...tool, detail } : tool)),
      }
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
