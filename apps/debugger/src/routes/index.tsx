import { createFileRoute } from '@tanstack/react-router'

import { DebuggerShell } from '@looms/debugger'

import { debuggerPlugins } from '../plugins'
import { parseSearch } from '../search'

export const Route = createFileRoute('/')({
  validateSearch: parseSearch,
  component: DebuggerRoute,
})

function DebuggerRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <DebuggerShell
      plugins={debuggerPlugins}
      selection={search}
      onSelectionChange={(selection) => {
        void navigate({ to: '/', search: selection })
      }}
    />
  )
}
