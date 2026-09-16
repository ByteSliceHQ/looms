import katex from 'katex'

export interface MathBlockProps {
  math: string
  className?: string
}

/**
 * Renders a block-level LaTeX equation with KaTeX display mode.
 */
export function MathBlock({ math, className = '' }: MathBlockProps) {
  const html = katex.renderToString(math, {
    displayMode: true,
    throwOnError: false,
  })

  return (
    <div
      className={`equation not-prose my-7 overflow-x-auto text-center ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export interface MathInlineProps {
  math: string
  className?: string
}

/**
 * Renders an inline LaTeX expression with proper baseline alignment
 * via KaTeX without introducing block wrappers into inline text.
 */
export function MathInline({ math, className = '' }: MathInlineProps) {
  const html = katex.renderToString(math, {
    displayMode: false,
    throwOnError: false,
  })

  return (
    <span
      className={`text-foreground inline-block px-0.5 align-baseline ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
