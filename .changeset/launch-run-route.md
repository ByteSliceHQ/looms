---
'@swirls/looms': minor
---

Add commit-only start APIs parallel to the existing wake-waiting ones:

|                            | Waits for first wake | Returns after commit |
| -------------------------- | -------------------- | -------------------- |
| Definition object          | `start`              | `launch`             |
| `{ kind, definitionName }` | `startRun`           | `launchRun`          |
| HTTP                       | `POST /runs`         | `POST /runs/launch`  |

`launch` / `launchRun` / `POST /runs/launch` leave the first wake to the host's scheduler (the Durable Object alarm on Cloudflare). The runtime method stays `launchRun`; actor `cell.launch` is unchanged (cross-run launcher, returns void).
