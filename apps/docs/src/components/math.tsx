import katex from 'katex'
import { createMathPlugin } from '@streamdown/math'
import { Streamdown } from 'streamdown'

export const mathPlugin = createMathPlugin({
  singleDollarTextMath: true,
})

export interface MathBlockProps {
  math: string
  className?: string
}

/**
 * Renders a block-level LaTeX equation inside a styled equation container
 * using Vercel's Streamdown library with the @streamdown/math plugin.
 */
export function MathBlock({ math, className = '' }: MathBlockProps) {
  return (
    <div className={`equation ${className}`.trim()}>
      <Streamdown
        mode="static"
        plugins={{ math: mathPlugin }}
        parseIncompleteMarkdown={false}
      >
        {`$$\n${math}\n$$`}
      </Streamdown>
    </div>
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
      className={`math-inline ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export interface StreamdownMathProps {
  children: string
  className?: string
}

/**
 * Renders streaming or static markdown containing both inline ($...$)
 * and block ($$...$$) mathematical expressions using Streamdown + @streamdown/math.
 */
export function StreamdownMath({ children, className = '' }: StreamdownMathProps) {
  return (
    <Streamdown
      mode="static"
      plugins={{ math: mathPlugin }}
      parseIncompleteMarkdown={false}
      className={className}
    >
      {children}
    </Streamdown>
  )
}
