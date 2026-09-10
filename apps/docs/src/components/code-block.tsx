import { Predicate } from 'effect'
import { type ReactNode } from 'react'

import { highlightCode } from './code-highlight'

export interface CodeBlockProps {
  code?: string
  children?: ReactNode
  lang?: string
  className?: string
}

export function CodeBlock({ code, children, lang = 'tsx', className = '' }: CodeBlockProps) {
  const rawCode = Predicate.isString(code) ? code : Predicate.isString(children) ? children : ''
  const html = highlightCode(rawCode, lang)

  return (
    <div
      className={`code-block not-prose mt-6 mb-8 ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
