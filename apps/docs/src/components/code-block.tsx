import { Predicate } from 'effect'
import { useState, type ReactNode } from 'react'

import { highlightCode } from './code-highlight'

export interface CodeBlockProps {
  code?: string
  children?: ReactNode
  lang?: string
  className?: string
}

export function CodeBlock({ code, children, lang = 'tsx', className = '' }: CodeBlockProps) {
  const [copyState, setCopyState] = useState('Copy')
  const rawCode = Predicate.isString(code) ? code : Predicate.isString(children) ? children : ''
  const html = highlightCode(rawCode, lang)

  return (
    <div className={`code-block not-prose mt-6 mb-8 ${className}`.trim()}>
      <div className="code-toolbar">
        <span>{lang}</span>
        <button
          type="button"
          aria-label="Copy code"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(rawCode)
              setCopyState('Copied')
            } catch {
              setCopyState('Select code to copy')
            }
          }}
        >
          {copyState}
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <span className="sr-only" role="status">
        {copyState === 'Copy' ? '' : copyState}
      </span>
    </div>
  )
}
