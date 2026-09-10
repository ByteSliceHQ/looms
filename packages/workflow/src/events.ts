import { payload, defineEventCatalog, type JsonValue } from '@looms/core'

export const workflowCatalog = defineEventCatalog('workflow', {
  'node.started': payload<{ nodeId: string }>(),
  'node.finished': payload<{ nodeId: string; result: JsonValue | null; error: string | null }>(),
  'node.skipped': payload<{ nodeId: string; reason: string }>(),
  'spawn.requested': payload<{
    nodeId: string
    childThreadId: string
    kind: string
    definitionName: string
    input: JsonValue
  }>(),
  'sleep.requested': payload<{ nodeId: string; waitId: string; wakeAt: number }>(),
  'effects.requested': payload<{ nodeId: string; effects: JsonValue[] }>(),
})
