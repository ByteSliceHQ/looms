import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { looms } from './looms.server'

export default createServerEntry({
  fetch: async (req) => (await looms.fetch(req)) ?? handler.fetch(req),
})
