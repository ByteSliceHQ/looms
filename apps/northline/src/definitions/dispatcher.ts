import { z } from 'zod'

import { asEffectsTool, asEvaluatorTool, asWorkflowTool, defineAgent } from '@swirls/looms/agent'
import { invoke, isJsonObject, isJsonString, type JsonValue } from '@swirls/looms/core'

import { LookupInput, lookupShipment } from '../modules/shipments'
import { ClassifyInput, classifyException } from './classify'
import { RecoverInput, recoverShipment } from './recover'

function shipmentIdOf(input: JsonValue): string {
  const parsed = LookupInput.safeParse(input)

  if (parsed.success) {
    return parsed.data.shipmentId
  }

  if (isJsonObject(input) && isJsonString(input.shipmentId)) {
    return input.shipmentId
  }

  return ''
}

const lookupTool = asEffectsTool({
  name: 'lookup_shipment',
  description: "Read a shipment from today's board by shipment id or PRO.",
  input: LookupInput,
  effects: (input) => {
    const shipmentId = shipmentIdOf(input)
    return [invoke(lookupShipment, { shipmentId }, `lookup_${shipmentId || 'missing'}`)]
  },
  waitOn: { type: 'shipments.lookup.completed' },
})

const classifyTool = asEvaluatorTool({
  name: 'classify_exception',
  description:
    'Score an exception. Returns whether it can recover on its own or needs a service lead. Does not book anything.',
  evaluator: classifyException,
  input: ClassifyInput,
  mapInput: (input) => {
    const parsed = ClassifyInput.safeParse(input)
    return parsed.success ? parsed.data : input
  },
})

const recoverTool = asWorkflowTool({
  name: 'recover_shipment',
  description:
    'Open a recovery for a shipment. Looks it up, classifies it, asks a service lead when required, books the linehaul recovery, and emails the consignee.',
  workflow: recoverShipment,
  input: RecoverInput,
  mapInput: (input) => {
    const parsed = RecoverInput.safeParse(input)

    if (parsed.success) {
      return parsed.data
    }

    return { shipmentId: shipmentIdOf(input), openedBy: 'desk' }
  },
})

export const dispatcher = defineAgent({
  name: 'dispatcher',
  description: 'Exception-desk agent for Northline dispatchers',
  conversational: true,
  maxTurns: 8,
  input: z.string(),
  instructions: [
    'You are the Northline exception desk.',
    "Dispatchers ask about shipments on today's board.",
    'Look a PRO up before you guess.',
    'Call classify_exception when they ask whether a shipment can recover on its own.',
    'Call recover_shipment only when they ask you to open or book a recovery.',
    'After a tool returns, say what happened in plain language: the consignee, the route, and whether a person still has to approve the booking.',
    'Do not invent PROs, appointments, or approvals.',
  ].join(' '),
  tools: [lookupTool, classifyTool, recoverTool],
})
