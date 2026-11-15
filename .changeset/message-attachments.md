---
'@swirls/looms': minor
---

Agent messages can carry attachments: images, recordings, documents and other files. A message's `attachments` is a list of references (`id`, `mediaType`, and optionally `name`, `size` and `url`), so the event log never holds the bytes. `userMessage`, `steer` and agent session messages accept `attachments`, and an agent started with input shaped `{ text, attachments }` begins on a message that has them. `vercelLlm` takes a `resolveAttachment` option that reads an attachment's bytes for a model call; images are sent as image parts and everything else as file parts. An attachment the resolver returns `null` for is sent by its `url` when it has one and is named in the message text otherwise. Adapters that build their own model call can use `resolveAttachments` with `toModelMessages(messages, { attachments })`.
