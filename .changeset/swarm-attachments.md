---
'@swirls/looms': minor
---

Board messages and tasks can carry files, so swarm members can send each other screenshots, recordings, and documents.

`post`, `reply`, and `createTask` on `MessageBoard` take `attachments`, a list of the agent module's `Attachment` references, and every `BoardMessage` now has an `attachments` list. The board keeps the references and never the bytes. A member that is woken by a message with files gets them on its first message, the new `board_view` tool shows it the files on any other message, and `board_post`, `board_reply`, and `board_create_task` accept `attachments`.

A tool result with an `attachments` list at its top level now shows those files to the model: the agent keeps them on the tool message, and the Vercel AI adapter sends them beside the result.

Breaking for board implementations: `BoardMessage.attachments` is required, `MessageQuery` gains `id`, and `boardConformance` checks both.
