import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from '@tanstack/react-router'
import { ThemeToggle } from '../components/theme-toggle'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Looms' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <p className="mx-auto max-w-[42rem] px-5 py-14 text-muted md:px-8 md:pt-24 md:pb-20">
      Not found.
    </p>
  ),
})

function RootComponent() {
  return (
    <RootDocument>
      <header className="mx-auto flex max-w-[68rem] items-center gap-8 border-b border-line-subtle px-8 py-5">
        <Link
          to="/"
          className="text-[1.1rem] font-semibold tracking-tight text-foreground no-underline"
        >
          Looms
        </Link>
        <nav className="flex gap-5">
          <Link
            to="/docs"
            className="text-sm text-muted no-underline hover:text-foreground"
          >
            Docs
          </Link>
        </nav>
        <ThemeToggle />
      </header>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}else{document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
