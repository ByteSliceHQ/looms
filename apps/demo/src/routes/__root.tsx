import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from '@tanstack/react-router'
import { LoomsLiveStoreProvider } from '@looms/livestore/react'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Looms Demo' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <LoomsLiveStoreProvider>
        <main>
          <h1>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Looms Demo
            </Link>
          </h1>
          <p className="sub">
            Event-sourced thread kernel with pluggable modules. Start a run, then inspect the
            debugger or chat.{' '}
            <Link to="/chat">Chat</Link>
          </p>
          <Outlet />
        </main>
      </LoomsLiveStoreProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
