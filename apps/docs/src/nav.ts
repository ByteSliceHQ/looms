export type DocsNavLink = {
  to: string
  label: string
}

export type DocsNavGroup = {
  label: string
  children: readonly DocsNavLink[]
}

export type DocsNavItem = DocsNavLink | DocsNavGroup

export function isDocsNavGroup(item: DocsNavItem): item is DocsNavGroup {
  return 'children' in item
}

/** Top-level links for landing footer and compact lists (groups collapse to first child). */
export function docsNavTopLinks(items: readonly DocsNavItem[] = docsNav): DocsNavLink[] {
  return items.map((item) => {
    if (isDocsNavGroup(item)) {
      return { to: item.children[0]!.to, label: item.label }
    }

    return item
  })
}

export const docsNav = [
  { to: '/docs', label: 'Introduction' },
  {
    label: 'Concepts',
    children: [
      { to: '/docs/concepts', label: 'Overview' },
      { to: '/docs/concepts/runs-and-threads', label: 'Runs & threads' },
      { to: '/docs/concepts/events-and-effects', label: 'Events & effects' },
      { to: '/docs/concepts/waits-and-replay', label: 'Waits & replay' },
      { to: '/docs/modules', label: 'Modules' },
      { to: '/docs/projectors', label: 'Projections' },
      { to: '/docs/concepts/type-safety', label: 'Type safety' },
      { to: '/docs/hosting-and-storage', label: 'Hosting & storage' },
      { to: '/docs/prior-art', label: 'Prior art' },
    ],
  },
  { to: '/docs/quickstart', label: 'Quickstart' },
  { to: '/docs/examples', label: 'Examples' },
  { to: '/docs/api', label: 'API / SDK' },
  { to: '/docs/math', label: 'Math' },
] as const satisfies readonly DocsNavItem[]
