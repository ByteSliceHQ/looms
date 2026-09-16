---
'@swirls/looms': patch
---

Looms DX overhaul:

- Add Standard Schema `input` typing and runtime validation for `defineAgent`, `defineWorkflow`, and `defineTool`.
- Provide Promise-based `createLooms()` facade with lazy init, typed start overloads, and universal `fetch(req) -> Response | null`.
- Add Looms-native event streaming directly against EventStore and `/api/events` (eliminating the dual-log S2 bridge).
- Add `s2Lite()` / `startS2Lite()` auto-starting dev process manager.
- Typed client generics for `createLoomsClient<typeof definitions>()`.
- Single server setup for dev and prod in demo app with no `effect` dependency.
