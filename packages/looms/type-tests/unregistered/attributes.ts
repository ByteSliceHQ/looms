import { createLooms, defineRunAttributes, type RunAttributes } from '@swirls/looms'
import { createLoomsClient } from '@swirls/looms/client'
import type { PostgresReplica } from '@swirls/looms/replica'
import { loomsReplicaTables } from '@swirls/looms/replica/drizzle'

import type { Equal, Expect } from '../expect'

const attributes = defineRunAttributes({
  tenantId: { required: true, index: true },
  project: { fieldName: 'project_key' },
})

const definition = { kind: 'workflow', name: 'billing', version: 'v1' }

export function startsWithDeclaredAttributes() {
  const looms = createLooms({ modules: [], attributes })

  return [
    looms.start(definition, null, { attributes: { tenantId: 'acme' } }),
    looms.start(definition, null, { attributes: { tenantId: 'acme', project: 'billing' } }),
    // @ts-expect-error `tenantId` is required
    looms.start(definition, null),
    // @ts-expect-error `tenantId` is required
    looms.start(definition, null, { attributes: { project: 'billing' } }),
    // @ts-expect-error `region` is not declared
    looms.start(definition, null, { attributes: { tenantId: 'acme', region: 'eu' } }),
    looms.startRun({ kind: 'workflow', definitionName: 'billing', attributes: { tenantId: 'a' } }),
    // @ts-expect-error `tenantId` is required
    looms.startRun({ kind: 'workflow', definitionName: 'billing' }),
  ]
}

export function startsWithAnyAttributesWhenNoneAreDeclared() {
  const looms = createLooms({ modules: [] })

  return [
    looms.start(definition, null),
    looms.start(definition, null, { attributes: { anything: 'goes' } }),
  ]
}

export function clientStartsWithDeclaredAttributes() {
  const client = createLoomsClient({ attributes })

  return [
    client.startRun({ kind: 'workflow', definitionName: 'billing', attributes: { tenantId: 'a' } }),
    // @ts-expect-error `tenantId` is required
    client.startRun({ kind: 'workflow', definitionName: 'billing' }),
  ]
}

declare const replica: PostgresReplica<typeof attributes>

export function purgesOnDeclaredAttributes() {
  return [
    replica.purge({ finishedBefore: 0, where: { tenantId: 'acme', project: 'billing' } }),
    // @ts-expect-error `region` is not declared
    replica.purge({ finishedBefore: 0, where: { region: 'eu' } }),
  ]
}

const tables = loomsReplicaTables({ additionalFields: attributes })

export type DrizzleColumnsUseAttributeKeys = Expect<
  Equal<(typeof tables.loomsRunIndex.$inferSelect)['tenantId'], string | null>
>

export type UndeclaredAttributesAreOpen = Expect<
  Equal<
    NonNullable<Parameters<ReturnType<typeof createLooms>['startRun']>[0]['attributes']>,
    RunAttributes
  >
>
