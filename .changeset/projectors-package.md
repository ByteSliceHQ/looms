---
'@swirls/looms': patch
---

Replace `@swirls/looms/projectors/postgres` with a generic `@swirls/looms/projectors` package. Implement `Projector` or use `memory()`, `postgres({ url })`, and `sqlite({ path })`. `createLooms({ projectors })` inits, wraps append, and disposes. S2 helpers now take an explicit env bag; `serveHttp` no longer reads `PORT`.
