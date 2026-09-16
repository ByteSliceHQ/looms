import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/concepts')({
  component: ConceptsLayout,
})

function ConceptsLayout() {
  return <Outlet />
}
