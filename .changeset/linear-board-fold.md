---
'@swirls/looms': patch
---

Swarm debugger: replaying a long board no longer stalls the page. `applyEvents` copies each collection at most once per page instead of once per event, so folding 20,000 board events in pages of 1,000 takes about 13 ms instead of about 4.7 s. It returns the same state when a page adds nothing. `boardThreads` is linear too, and the Threads pane shows the newest 200 threads of each channel, with a button to show older ones.
