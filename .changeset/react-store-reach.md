---
'@swirls/looms': minor
---

`LoomsProvider`, `preloadRunStore` and `createLoomsStore` take `fetch`, `webSocket` and `grant`, so a page on another origin than its host can read a run: `fetch` adds the host's credentials to every HTTP request, and `grant` puts a run's read grant on the requests that read the log, the WebSocket included.
