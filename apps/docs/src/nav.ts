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
  {
    label: 'Start here',
    children: [
      { to: '/docs', label: 'Introduction' },
      { to: '/docs/quickstart', label: 'Quickstart' },
      { to: '/docs/when-to-use', label: 'When to use Looms' },
      { to: '/docs/integration', label: 'Add to your app' },
    ],
  },
  {
    label: 'Build',
    children: [
      { to: '/docs/agents', label: 'Agents & models' },
      { to: '/docs/approvals', label: 'Human approvals' },
      { to: '/docs/evaluator', label: 'Evaluations' },
      { to: '/docs/examples', label: 'Examples' },
      { to: '/docs/modules', label: 'Custom modules' },
      { to: '/docs/projectors', label: 'Live UI & indexes' },
      { to: '/docs/testing', label: 'Testing' },
    ],
  },
  {
    label: 'Ship & operate',
    children: [
      { to: '/docs/hosting-and-storage', label: 'Deployment & storage' },
      { to: '/docs/security', label: 'Authentication & tenancy' },
      { to: '/docs/reliability', label: 'Reliability & recovery' },
      { to: '/docs/versioning', label: 'Changing deployed code' },
      { to: '/docs/operations', label: 'Operations' },
      { to: '/docs/troubleshooting', label: 'Troubleshooting' },
    ],
  },
  {
    label: 'Understand',
    children: [
      { to: '/docs/concepts', label: 'Concepts' },
      { to: '/docs/concepts/runs-and-threads', label: 'Runs & custom threads' },
      { to: '/docs/concepts/events-and-effects', label: 'Events & effects' },
      { to: '/docs/concepts/waits-and-replay', label: 'Waits & replay' },
      { to: '/docs/concepts/type-safety', label: 'Type safety' },
      { to: '/docs/math', label: 'Execution model' },
      { to: '/docs/prior-art', label: 'Prior art' },
    ],
  },
  { to: '/docs/api', label: 'API reference' },
] as const satisfies readonly DocsNavItem[]
