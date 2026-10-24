---
'@swirls/looms': minor
---

Durable Objects accept a hibernating WebSocket on `GET /runs/:id/events`. The socket replays the retained log, then receives later events without a subscription held in memory. SSE sends the same `hello` and `resync` frames. A cursor below the retained head is told to resume from `head` instead of silently skipping trimmed events. `subscribeEvents` and the React store take `transport: "websocket" | "sse" | "auto"`; the default remains SSE, and a numeric reconnect delay still works.
