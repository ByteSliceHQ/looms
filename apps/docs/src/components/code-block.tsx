import { type ReactNode } from 'react'
import { highlightCode } from './code-highlight'

export interface CodeBlockProps {
  code?: string
  children?: ReactNode
  lang?: string
  className?: string
}

export function CodeBlock({ code, children, lang = 'tsx', className = '' }: CodeBlockProps) {
  const rawCode = typeof code === 'string' ? code : typeof children === 'string' ? children : ''
  const html = highlightCode(rawCode, lang)

  return (
    <div
      className={`code-block ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
