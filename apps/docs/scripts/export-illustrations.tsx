import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { renderToStaticMarkup } from 'react-dom/server'

import { artPalettes, Illustration } from '../src/illustrations/illustration'
import { illustrationNames, illustrations } from '../src/illustrations/scenes'

const output = new URL('../public/illustrations/', import.meta.url)
await mkdir(output, { recursive: true })

for (const name of illustrationNames) {
  for (const theme of ['light', 'dark'] as const) {
    // Resolve colors to attributes so editors need no CSS variable support.
    let svg = renderToStaticMarkup(<Illustration name={name} theme={theme} />).replace(
      /<style>[\s\S]*?<\/style>/,
      '',
    )

    for (const [token, color] of Object.entries(artPalettes[theme])) {
      svg = svg.replaceAll(`var(--art-${token})`, color)
    }

    await writeFile(new URL(`${name}-${theme}.svg`, output), `${svg}\n`)
  }
}

console.log(`Exported ${Object.keys(illustrations).length * 2} SVGs to ${fileURLToPath(output)}`)
