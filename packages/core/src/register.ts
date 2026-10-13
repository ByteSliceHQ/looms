import type { EventsOf } from './compose'
import type { EventEnvelope } from './envelope'

/** Looser event bound so catalog-inferred payloads (including Schema.Type) are accepted. */
export type AnyEventEnvelope = EventEnvelope<string, any>

/**
 * Application-level type registry for Looms.
 *
 * Augment this interface once to bind your event union. `defineProjection` reducers and the
 * `@swirls/looms/react` hooks and stores use it as their default event type:
 *
 * ```ts
 * declare module '@swirls/looms/react' {
 *   interface LoomsRegister {
 *     modules: typeof demoModules
 *   }
 * }
 * ```
 *
 * Augmenting `@swirls/looms/core` works the same way. You may register either:
 * - `events`: an explicit event union
 * - `modules`: a module array / creator function (via `EventsOf`)
 * - `catalog`: an event catalog or catalog array (via `EventsOf`)
 */
export interface LoomsRegister {
  // Empty interface for application augmentation
}

export type RegisteredEvent = LoomsRegister extends { events: infer E }
  ? Extract<E, AnyEventEnvelope>
  : LoomsRegister extends { modules: infer M }
    ? Extract<EventsOf<M>, AnyEventEnvelope>
    : LoomsRegister extends { catalog: infer C }
      ? Extract<EventsOf<C>, AnyEventEnvelope>
      : EventEnvelope
