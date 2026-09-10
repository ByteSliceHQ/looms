import { createHighlighter } from 'shiki'
import poimandres from 'shiki/themes/poimandres.mjs'

export const loomsLight = {
  name: 'looms-light',
  type: 'light' as const,
  colors: {
    'editor.background': 'transparent',
    'editor.foreground': '#1b1e28',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#767c9d', fontStyle: 'italic' },
    },
    {
      scope: [
        'keyword.control.module',
        'keyword.control.import',
        'keyword.control.export',
        'keyword.control.default',
        'meta.import',
        'meta.export',
      ],
      settings: { foreground: '#0d9488' }, // Poimandres Mint
    },
    {
      scope: [
        'keyword.control.flow',
        'keyword.control.conditional',
        'keyword.control.loop',
        'keyword.operator.new',
        'keyword.control.new',
      ],
      settings: { foreground: '#0ea5a4' }, // Mint / Cyan
    },
    {
      scope: ['keyword', 'keyword.control', 'keyword.operator', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#3b6998' }, // Poimandres Desaturated Slate Blue
    },
    {
      scope: ['string', 'punctuation.definition.string', 'string.template'],
      settings: { foreground: '#0f766e' }, // Mint / Deep Sea
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'entity.name.function.method',
        'variable.function',
        'meta.function-call entity.name.function',
      ],
      settings: { foreground: '#0284c7' }, // Poimandres Sky Blue
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.inherited-class',
      ],
      settings: { foreground: '#4f46e5' }, // Poimandres Indigo / Purple tone
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.language.null',
        'constant.language.boolean',
        'constant.language.undefined',
        'support.class.error',
        'keyword.control.trycatch',
      ],
      settings: { foreground: '#be185d' }, // Poimandres Berry Pink (#d0679d)
    },
    {
      scope: [
        'variable.other.property',
        'variable.other.object.property',
        'meta.object-literal.key',
        'support.variable.property',
      ],
      settings: { foreground: '#0f172a' },
    },
    {
      scope: [
        'punctuation',
        'meta.brace',
        'punctuation.definition.parameters',
        'punctuation.definition.block',
        'punctuation.terminator',
        'punctuation.separator',
      ],
      settings: { foreground: '#828bb8' },
    },
    {
      scope: ['variable', 'variable.other.readwrite'],
      settings: { foreground: '#1e293b' },
    },
  ],
}

export const loomsDark = {
  ...poimandres,
  name: 'looms-dark',
  colors: {
    ...poimandres.colors,
    'editor.background': 'transparent',
    'editor.foreground': '#e4f0fb',
  },
}

export const highlighter = await createHighlighter({
  langs: ['tsx', 'json', 'bash', 'yaml'],
  themes: [loomsLight, loomsDark],
})

function normalizeLang(lang: string): string {
  switch (lang.toLowerCase()) {
    case 'ts':
    case 'tsx':
    case 'typescript':
    case 'js':
    case 'jsx':
    case 'javascript':
      return 'tsx'
    case 'bash':
    case 'sh':
    case 'shell':
    case 'zsh':
      return 'bash'
    case 'json':
      return 'json'
    case 'yaml':
    case 'yml':
      return 'yaml'
    default:
      return 'tsx'
  }
}

export function highlightCode(code: string, lang = 'tsx') {
  const html = highlighter.codeToHtml(code.trim(), {
    lang: normalizeLang(lang),
    themes: {
      light: 'looms-light',
      dark: 'looms-dark',
    },
  })
  // Remove the extraneous newlines between line spans that cause double-spaced vertical gaps in <pre>
  return html.replace(/<\/span>\n(?=<span class="line">)/g, '</span>')
}
