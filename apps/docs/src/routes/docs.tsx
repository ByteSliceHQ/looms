import { Outlet, createFileRoute, Link } from '@tanstack/react-router'

import { docsNav } from '../nav'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="mx-auto grid max-w-[68rem] grid-cols-1 gap-8 px-5 py-8 pb-16 md:grid-cols-[12rem_minmax(0,44rem)] md:gap-16 md:px-8 md:py-12 md:pb-24">
      <nav className="max-md:border-line-subtle sticky top-8 flex max-h-[calc(100vh-4rem)] flex-col gap-2 self-start overflow-y-auto pt-1 max-md:static max-md:max-h-none max-md:flex-row max-md:flex-wrap max-md:gap-x-5 max-md:overflow-y-visible max-md:border-b max-md:pb-4">
        {docsNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/docs' }}
            className="text-muted hover:text-foreground data-[status=active]:text-foreground text-[0.88rem] no-underline transition-colors data-[status=active]:font-medium"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="prose max-w-none">
        <Outlet />
      </div>
    </div>
  )
}
