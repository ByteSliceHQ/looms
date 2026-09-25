import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

function documentBasePath(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }

  const href = document.querySelector('base')?.getAttribute('href')

  if (!href) {
    return undefined
  }

  const cleaned = href.replace(/\/+$/, '')

  return cleaned.startsWith('/') && cleaned.length > 1 ? cleaned : undefined
}

export function getRouter() {
  const basepath = documentBasePath()

  return createRouter({
    routeTree,
    basepath,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
