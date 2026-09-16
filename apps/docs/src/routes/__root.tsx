import { Outlet, createRootRoute, HeadContent, Scripts, Link } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { DocsSearch } from '../components/docs-search'
import { ErrorPage, NotFoundPage } from '../components/site-error'
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
  notFoundComponent: NotFoundPage,
  errorComponent: RootError,
})

function SiteHeader() {
  return (
    <header className="border-line-subtle mx-auto flex max-w-[68rem] items-center gap-4 border-b px-5 py-5 md:gap-8 md:px-8">
      <Link
        to="/"
        className="text-foreground text-[1.1rem] font-semibold tracking-tight no-underline"
      >
        Looms
      </Link>
      <nav className="flex gap-4 md:gap-5">
        <Link to="/docs" className="text-muted hover:text-foreground text-sm no-underline">
          Docs
        </Link>
        <a
          href="https://github.com/ByteSliceHQ/looms"
          className="text-muted hover:text-foreground text-sm no-underline"
        >
          GitHub
        </a>
      </nav>
      <DocsSearch />
      <ThemeToggle />
    </header>
  )
}

function RootComponent() {
  return (
    <RootDocument>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <Outlet />
    </RootDocument>
  )
}

function RootError(props: ErrorComponentProps) {
  return (
    <RootDocument>
      <SiteHeader />
      <ErrorPage {...props} />
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
