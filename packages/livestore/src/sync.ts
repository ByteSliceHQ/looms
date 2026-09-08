/**
 * Helpers for wiring sync against a Looms host `/api/livestore` endpoint.
 *
 * Prefer `@looms/livestore/react` (`actorStoreOptions` / `useActorStore`), which
 * already points `makeSyncBackend` at the Looms proxy.
 */

export interface LoomsSyncEndpointOptions {
  /** Looms host origin, e.g. http://127.0.0.1:8787 */
  host: string
}

/** Build the LiveStore sync endpoint URL for a Looms host. */
export function loomsSyncEndpoint(options: LoomsSyncEndpointOptions): string {
  return `${options.host.replace(/\/$/, '')}/api/livestore`
}
