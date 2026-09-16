import pages from './docs-manifest.json'

export function pageHead(path: string) {
  const page = pages.find((item) => item.path === path)
  const title = `${page?.title ?? 'Documentation'} · Looms`
  const description = page?.description ?? 'Build with Looms.'

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `https://looms.sh${path}` },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: `https://looms.sh${path}` }],
  }
}
