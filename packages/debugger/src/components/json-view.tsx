import type { JsonValue } from '@looms/core'

import { JsonTree } from './json-tree'

export function JsonView({ value, className }: { value: JsonValue; className?: string }) {
  return <JsonTree value={value} className={className} />
}
