---
'@swirls/looms': patch
---

Wake idle agents on a non-interrupt steer. Queued steers still wait for open tool calls to finish, so in-flight work is not abandoned.
