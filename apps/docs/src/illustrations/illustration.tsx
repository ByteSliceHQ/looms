import { useId } from 'react'

import { illustrations } from './scenes'
import type { IllustrationName } from './scenes'

export const artPalettes = {
  light: {
    face: '#ffffff',
    side: '#f4f5f7',
    front: '#fafbfc',
    edge: '#929ba9',
    detail: '#a3adbb',
    accent: '#627b9b',
    grid: '#edf0f4',
  },
  dark: {
    face: '#12141a',
    side: '#151820',
    front: '#101218',
    edge: '#626b7b',
    detail: '#485263',
    accent: '#a3bad5',
    grid: '#1d222c',
  },
} as const

function declarations(theme: 'light' | 'dark') {
  return Object.entries(artPalettes[theme])
    .map(([key, value]) => `--art-${key}: ${value};`)
    .join(' ')
}

const illustrationStyles = `
.looms-art { ${declarations('light')} }
@media (prefers-color-scheme: dark) {
  .looms-art:not([data-theme="light"]) { ${declarations('dark')} }
}
html.dark .looms-art:not([data-theme="light"]), .looms-art[data-theme="dark"] { ${declarations('dark')} }
html.light .looms-art:not([data-theme="dark"]), .looms-art[data-theme="light"] { ${declarations('light')} }
`

export function Illustration({
  name,
  theme,
  className = '',
  decorative = false,
}: {
  name: IllustrationName
  theme?: 'light' | 'dark'
  className?: string
  decorative?: boolean
}) {
  const id = useId()
  const item = illustrations[name]
  const Scene = item.component

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -40 640 500"
      width="640"
      height="500"
      className={`looms-art ${className}`}
      data-theme={theme}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : `${id}-title ${id}-desc`}
      fill="none"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title id={`${id}-title`}>{item.label}</title>
      <desc id={`${id}-desc`}>
        {item.alt} {item.description}
      </desc>
      <style>{illustrationStyles}</style>
      <Scene />
    </svg>
  )
}

export function ConceptFigure({ name }: { name: IllustrationName }) {
  const item = illustrations[name]

  return (
    <figure className="not-prose my-10 mb-12">
      <div className="flex justify-center [&_svg]:block [&_svg]:h-auto [&_svg]:w-[min(100%,32rem)]">
        <Illustration name={name} />
      </div>
      <figcaption className="text-body m-0 grid gap-2 px-5 pt-0 pb-6 text-[0.85rem] leading-[1.6]">
        <strong className="text-foreground text-base font-medium">{item.title}</strong>
        <span>{item.description}</span>
      </figcaption>
    </figure>
  )
}
