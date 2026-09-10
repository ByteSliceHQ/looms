import { ClientOnly, createFileRoute } from '@tanstack/react-router'

import { Shell } from '../components/ide/shell'
import { parseSearch, type DemoSearch } from '../lib/search'

export type { DemoSearch }

export const Route = createFileRoute('/')({
  validateSearch: parseSearch,
  component: Home,
})

function Home() {
  return (
    <ClientOnly fallback={<p className="text-muted-foreground p-3 text-sm">Loading…</p>}>
      <Shell />
    </ClientOnly>
  )
}
