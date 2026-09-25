---
'@swirls/looms': minor
---

Serve a debugger UI from `createLooms` with `debuggerUi()` from `@swirls/looms/debugger/server`. Modules ship their own debugger views from `@swirls/looms/agent/debugger`, `@swirls/looms/workflow/debugger`, and `@swirls/looms/approval/debugger`. `GET /definitions` lists the definitions and projections that UI can start and inspect.
