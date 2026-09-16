import { Outlet, createFileRoute, Link, useRouterState } from '@tanstack/react-router'

import { docsNav, isDocsNavGroup, type DocsNavGroup, type DocsNavLink } from '../nav'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function linkIsActive(pathname: string, to: string, exact: boolean): boolean {
  if (exact) {
    return pathname === to || pathname === `${to}/`
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}

function DocsNavLinkItem({
  item,
  pathname,
  exact = false,
  nested = false,
}: {
  item: DocsNavLink
  pathname: string
  exact?: boolean
  nested?: boolean
}) {
  const active = linkIsActive(pathname, item.to, exact)

  return (
    <Link
      to={item.to}
      activeOptions={{ exact }}
      className={
        nested
          ? 'text-muted hover:text-foreground data-[status=active]:text-foreground text-[0.82rem] no-underline transition-colors data-[status=active]:font-medium'
          : 'text-muted hover:text-foreground data-[status=active]:text-foreground text-[0.88rem] no-underline transition-colors data-[status=active]:font-medium'
      }
      aria-current={active ? 'page' : undefined}
    >
      {item.label}
    </Link>
  )
}

function DocsNavGroupItem({ group, pathname }: { group: DocsNavGroup; pathname: string }) {
  const childActive = group.children.some((child) =>
    linkIsActive(pathname, child.to, child.to === '/docs/concepts'),
  )

  return (
    <div className="flex w-full flex-col gap-1.5 max-md:basis-full">
      <span
        className={
          childActive
            ? 'text-foreground text-[0.88rem] font-medium'
            : 'text-muted text-[0.88rem] font-medium'
        }
      >
        {group.label}
      </span>
      <div className="border-line-subtle flex flex-row flex-wrap gap-x-4 gap-y-1 md:flex-col md:gap-1.5 md:border-l md:pl-3">
        {group.children.map((child) => (
          <DocsNavLinkItem
            key={child.to}
            item={child}
            pathname={pathname}
            exact={child.to === '/docs/concepts'}
            nested
          />
        ))}
      </div>
    </div>
  )
}

function DocsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="mx-auto grid max-w-[68rem] grid-cols-1 gap-8 px-5 py-8 pb-16 md:grid-cols-[13rem_minmax(0,44rem)] md:gap-16 md:px-8 md:py-12 md:pb-24">
      <nav className="max-md:border-line-subtle sticky top-8 flex max-h-[calc(100vh-4rem)] flex-col gap-2.5 self-start overflow-y-auto pt-1 max-md:static max-md:max-h-none max-md:flex-row max-md:flex-wrap max-md:items-baseline max-md:gap-x-5 max-md:gap-y-2 max-md:overflow-y-visible max-md:border-b max-md:pb-4">
        {docsNav.map((item) => {
          if (isDocsNavGroup(item)) {
            return <DocsNavGroupItem key={item.label} group={item} pathname={pathname} />
          }

          return (
            <DocsNavLinkItem
              key={item.to}
              item={item}
              pathname={pathname}
              exact={item.to === '/docs'}
            />
          )
        })}
      </nav>
      <div className="prose max-w-none">
        <Outlet />
      </div>
    </div>
  )
}
