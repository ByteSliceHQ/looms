import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

const BANNED_METHODS = new Set(['try', 'tryPromise'])

function isEffectMember(node: ESTree.CallExpression): string | undefined {
  const callee = node.callee
  if (callee.type !== 'MemberExpression' || callee.computed) return undefined
  if (callee.object.type !== 'Identifier' || callee.object.name !== 'Effect') return undefined
  if (callee.property.type !== 'Identifier') return undefined
  if (!BANNED_METHODS.has(callee.property.name)) return undefined
  return callee.property.name
}

function isFunctionArgument(node: ESTree.Node | undefined): boolean {
  if (!node) return false
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression' ||
    node.type === 'FunctionDeclaration'
  )
}

/** Require the { try, catch } form so Effect does not swallow the original cause. */
export const noBareTryPromiseRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow the single-function Effect.try / Effect.tryPromise overloads; they hide the original error.',
    },
    messages: {
      bareTry:
        'Use Effect.{{name}}({ try, catch }) so the original error is preserved. The single-function form becomes "An error occurred in Effect.{{name}}".',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const name = isEffectMember(node)
        if (!name) return
        if (!isFunctionArgument(node.arguments[0])) return
        context.report({
          node: node.arguments[0],
          messageId: 'bareTry',
          data: { name },
        })
      },
    }
  },
})
