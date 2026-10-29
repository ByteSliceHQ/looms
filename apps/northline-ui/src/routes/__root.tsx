import { Outlet, createRootRoute } from '@tanstack/react-router'

import { LoomsProvider } from '@swirls/looms/react'

import { Shell } from '../components/shell'

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: Missing,
  errorComponent: Failed,
})

function Root() {
  return (
    <LoomsProvider endpoint="" transport="websocket">
      <Shell>
        <Outlet />
      </Shell>
    </LoomsProvider>
  )
}

function Missing() {
  return <h1 className="page-title">That page is not on the desk.</h1>
}

function Failed({ error }: { error: Error }) {
  return <p className="banner">{error.message}</p>
}
