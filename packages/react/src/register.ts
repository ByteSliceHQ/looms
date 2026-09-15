import type { EventEnvelope, EventsOf } from '@looms/core'

/** Looser event bound so catalog-inferred payloads (including Schema.Type) are accepted. */
export type AnyEventEnvelope = EventEnvelope<string, any>

/**
 * Application-level type registry for Looms React/client stores.
 *
 * Augment this interface in your app to bind the event catalog used by
 * `useRunEvents`, `createLoomsStore`, and related hooks:
 *
 * ```ts
 * declare module '@looms/livestore' {
 *   interface LoomsRegister {
 *     modules: typeof demoModules
 *   }
 * }
 * ```
 *
 * You may register either:
 * - `events`: an explicit event union
 * - `modules`: a module array / creator function (via `EventsOf`)
 * - `catalog`: an event catalog or catalog array (via `EventsOf`)
 */
export interface LoomsRegister {
  // Empty interface for application augmentation
}

export type RegisteredEvent = LoomsRegister extends { events: infer E }
  ? E & AnyEventEnvelope
  : LoomsRegister extends { modules: infer M }
    ? EventsOf<M> & AnyEventEnvelope
    : LoomsRegister extends { catalog: infer C }
      ? EventsOf<C> & AnyEventEnvelope
      : EventEnvelope
