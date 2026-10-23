---
'@swirls/looms': minor
---

feat(runtime): authorize browser event streams with a signed run grant

`grantAuth` checks a short-lived HMAC grant from the `grant` query parameter or a `v1.` WebSocket subprotocol. The grant allows one principal to read one run, which is the credential a browser can send on EventSource or WebSocket. The Durable Object socket echoes a subprotocol grant on the upgrade, and `grantSubprotocol` gives other hosts the value to echo.
