/**
 * Host-side event-name alignment check against `@looms/core`.
 *
 * Client / React code should import from `./event-names` (or package
 * re-exports) to avoid pulling the host graph.
 */

import type { EventType } from '@looms/core'
import { LOOMS_EVENT_NAMES, type LoomsEventName } from './event-names'

export { LOOMS_EVENT_NAMES, type LoomsEventName }

/** Compile-time guard: event names stay aligned with `@looms/core` EventType. */
const _assertEventNames: readonly EventType[] = LOOMS_EVENT_NAMES
void _assertEventNames
