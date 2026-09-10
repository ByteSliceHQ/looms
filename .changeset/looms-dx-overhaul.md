---
'@looms/core': minor
'@looms/agent': minor
'@looms/workflow': minor
'@looms/runtime': minor
'@looms/livestore': minor
'@looms/s2': minor
'@looms/client': minor
'@looms/cli': minor
---

Looms DX overhaul:

- Add Standard Schema `input` typing and runtime validation for `defineAgent`, `defineWorkflow`, and `defineTool`.
- Provide Promise-based `createLooms()` facade with lazy init, typed start overloads, and universal `fetch(req) -> Response | null`.
- Add Looms-native LiveStore `SyncBackend` directly against EventStore and `/api/livestore` (eliminating the dual-log S2 bridge).
- Add `s2Lite()` / `startS2Lite()` auto-starting dev process manager.
- Typed client generics for `createLoomsClient<typeof definitions>()`.
- Single server setup for dev and prod in demo app with no `effect` dependency.
