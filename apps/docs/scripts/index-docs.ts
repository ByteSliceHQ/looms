import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dir, '../src')

function plain(source: string) {
  return source
    .replace(/<a\b[^>]*className="heading-anchor"[^>]*>.*?<\/a>/gs, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\{' '\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const pages = []

for (const file of (await readdir(join(root, 'routes'))).toSorted()) {
  if (!file.startsWith('docs.') || !file.endsWith('.tsx')) {
    continue
  }

  const source = await Bun.file(join(root, 'routes', file)).text()
  const path = source.match(/createFileRoute\('([^']+)'\)/)?.[1]?.replace(/\/$/, '')
  const title = source.match(/<h1>(.*?)<\/h1>/s)?.[1]

  if (!path || !title) {
    continue
  }

  const prose = source.replace(/<CodeBlock\b[^>]*(?:\/>|>[\s\S]*?<\/CodeBlock>)/g, '')

  const sections = [...prose.matchAll(/<h([23])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/gs)].map(
    (match) => ({ id: match[2], title: plain(match[3]), level: Number(match[1]) }),
  )

  const description = plain(source.match(/<p>(.*?)<\/p>/s)?.[1] ?? title)

  pages.push({
    path,
    title: plain(title),
    description,
    sections,
    text: plain(source.slice(source.indexOf('<h1>'))),
  })
}

await Bun.write(join(root, 'docs-manifest.json'), JSON.stringify(pages, null, 2) + '\n')
