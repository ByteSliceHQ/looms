---
'@swirls/looms': patch
---

The debugger draws no platform scrollbars. Its panes no longer scroll themselves (react-resizable-panels set `overflow: auto`), the signal form's preview scrolls in a ScrollArea, ScrollArea's thumb takes the theme's border color as shadcn/ui's does, and a list that still scrolls natively (a command or menu list) draws a thin bar in that color.
