---
'@swirls/looms': patch
---

Keep agent tool results next to their tool calls when a message arrives mid-call. A non-interrupt steer sent while a tool call was open was stored between the call and its result, and the next LLM turn failed with "Tool result is missing for tool call". Results are now inserted directly after the call, so the steer follows them.
