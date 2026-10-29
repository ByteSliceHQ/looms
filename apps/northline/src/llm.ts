import { Option, Predicate, Schema } from 'effect'

import type { LlmAdapter, LlmCompleteArgs, AgentTurnResult } from '@swirls/looms/agent'
import { isJsonObject, isJsonString, type JsonValue } from '@swirls/looms/core'

import { findShipment, type Shipment } from './catalog'

const decodeJsonValue = Schema.decodeOption(Schema.fromJsonString(Schema.Json))

function parseJsonValue(content: string): JsonValue {
  return Option.getOrElse(decodeJsonValue(content), () => content)
}

function latestUserText(messages: LlmCompleteArgs['messages']): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]

    if (message?.role === 'user' && message.content) {
      return message.content
    }
  }

  return ''
}

function latestTool(messages: LlmCompleteArgs['messages']) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]

    if (message?.role === 'tool') {
      return message
    }
  }

  return undefined
}

const PRO_NUMBER = /\b\d{7}\b/
const SHIPMENT_ID = /\bnl_\d+\b/i

interface Mention {
  readonly shipment: Shipment | undefined
  readonly token: string | undefined
}

function mentioned(text: string): Mention {
  const id = text.match(SHIPMENT_ID)?.[0]?.toLowerCase()

  if (id) {
    return { shipment: findShipment(id), token: id }
  }

  const pro = text.match(PRO_NUMBER)?.[0]

  if (pro) {
    return { shipment: findShipment(pro), token: pro }
  }

  return { shipment: undefined, token: undefined }
}

type DeskIntent = 'recover' | 'classify' | 'lookup' | 'help'

function intentOf(text: string, known: boolean): DeskIntent {
  const lower = text.toLowerCase()

  if (/\b(recover|recovery|book)\b/.test(lower)) {
    return 'recover'
  }

  if (/\b(classify|score|risk|evaluat)/.test(lower)) {
    return 'classify'
  }

  if (known || PRO_NUMBER.test(text) || SHIPMENT_ID.test(text)) {
    return 'lookup'
  }

  return 'help'
}

function helpText(): string {
  return [
    'I can look up a PRO, classify whether it can recover on its own, or open a recovery.',
    'On the board: 1841933 Hart & Birch, 2208144 Mesa Clay, 5510662 Red Hen Produce.',
  ].join(' ')
}

function summarize(content: string): string {
  const output = parseJsonValue(content)

  if (!isJsonObject(output)) {
    return content
  }

  if (isJsonString(output.error)) {
    return output.error
  }

  if (output.found === true && isJsonString(output.consignee) && isJsonString(output.pro)) {
    const origin = isJsonString(output.origin) ? output.origin : ''
    const destination = isJsonString(output.destination) ? output.destination : ''
    const hours = Predicate.isNumber(output.hoursLate) ? `${output.hoursLate}h late` : ''
    return `${output.consignee}, PRO ${output.pro}, ${origin} to ${destination}. ${hours}`.trim()
  }

  if (output.held === true && isJsonString(output.pro)) {
    return `Held PRO ${output.pro}. A service lead declined the booking, so nothing was sent to the linehaul partner.`
  }

  if (isJsonString(output.partner) && isJsonString(output.pro)) {
    const window = isJsonString(output.window) ? ` Window: ${output.window}.` : ''
    return `Booked PRO ${output.pro} with ${output.partner}.${window}`
  }

  if (output.route === 'auto') {
    return 'This can recover without a service lead.'
  }

  if (output.route === 'review' && output.reason === 'skipped') {
    return 'Policy sends this to a service lead before anyone books it.'
  }

  if (output.route === 'review') {
    return 'The evaluator wants a service lead to see this before it is booked.'
  }

  return content
}

function toolCall(
  args: LlmCompleteArgs,
  name: string,
  content: string,
  arguments_: JsonValue,
): Promise<AgentTurnResult> {
  const id = `call_${name}_${args.messages.length}`

  return Promise.resolve(args.onTextDelta?.(content)).then(() => ({
    message: {
      role: 'assistant',
      content,
      toolCalls: [{ id, name, arguments: arguments_ }],
    },
    toolCalls: [{ id, name, arguments: arguments_ }],
  }))
}

function reply(args: LlmCompleteArgs, content: string): Promise<AgentTurnResult> {
  return Promise.resolve(args.onTextDelta?.(content)).then(() => ({
    message: { role: 'assistant', content },
    done: true,
  }))
}

/**
 * Deterministic stand-in for the desk model. The host swaps in `vercelLlm` when
 * `OPENROUTER_API_KEY` is set. The tool loop is the real agent loop either way.
 */
export const deskLlm: LlmAdapter = {
  complete(args) {
    const tool = latestTool(args.messages)

    if (tool) {
      return reply(args, summarize(tool.content))
    }

    const text = latestUserText(args.messages)
    const { shipment, token } = mentioned(text)
    const intent = intentOf(text, shipment !== undefined)

    if (intent === 'help' || !token) {
      return reply(args, helpText())
    }

    if (!shipment && intent !== 'lookup') {
      return reply(args, `PRO ${token} is not on today's board. ${helpText()}`)
    }

    if (intent === 'lookup' || !shipment) {
      return toolCall(
        args,
        'lookup_shipment',
        shipment ? `Looking up PRO ${shipment.pro}.` : `Looking up ${token}.`,
        { shipmentId: shipment?.shipmentId ?? token },
      )
    }

    if (intent === 'classify') {
      return toolCall(args, 'classify_exception', `Classifying PRO ${shipment.pro}.`, {
        shipmentId: shipment.shipmentId,
        kind: shipment.kind,
        hoursLate: shipment.hoursLate,
        valueUsd: shipment.valueUsd,
        note: shipment.note,
      })
    }

    return toolCall(args, 'recover_shipment', `Opening a recovery for PRO ${shipment.pro}.`, {
      shipmentId: shipment.shipmentId,
      openedBy: 'desk',
    })
  },
}
