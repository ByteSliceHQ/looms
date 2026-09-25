---
'@swirls/looms': minor
---

Serve a debugger UI from `createLooms` with `debuggerUi()` from `@swirls/looms/debugger/server`. Modules ship their own debugger views from `@swirls/looms/agent/debugger`, `@swirls/looms/workflow/debugger`, and `@swirls/looms/approval/debugger`. `GET /definitions` lists the definitions and projections that UI can start and inspect, and `GET /runs?include=summary` returns each run's status and definition.

Breaking changes:

- Tool helpers and tool definitions no longer accept `inputSchema`. Pass `input` and the JSON Schema is derived from it.
- `@swirls/looms/debugger` no longer exports `EventFamily`, `DEFAULT_FAMILIES`, `familyClass`, `familyFromPrefix`, `summarizeDomainEvent`, `summarizeEvent`, `searchText`, or `createDefaultCatalog`. Build a catalog with `createEventCatalog(plugins)` or use `defaultEventCatalog`.
- `EventStreamCatalog.familyClass` is now `familyColor`, which returns a CSS color, and `searchText` is required.
