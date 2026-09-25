import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { debuggerAppRoot, debuggerUi } from './index'

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'looms-debugger-'))
  await mkdir(join(root, 'assets'))

  await writeFile(
    join(root, 'index.html'),
    '<!doctype html><head><title>Looms</title></head><body></body>',
  )

  await writeFile(join(root, 'assets', 'app.js'), 'console.log("app")')

  return root
}

function get(path: string): [Request, { basePath: string; path: string }] {
  return [new Request(`http://looms.test/debugger${path}`), { basePath: '/debugger', path }]
}

describe('debuggerUi', () => {
  test('resolves the bundled app next to the server module', () => {
    expect(debuggerAppRoot('file:///opt/looms/dist/debugger/server/index.js')).toBe(
      '/opt/looms/dist/debugger/app/',
    )
  })

  test('injects the mount path and falls back to the SPA shell', async () => {
    const ui = debuggerUi({ root: await fixture() })

    const page = await ui.fetch(...get('/runs'))
    const html = await page?.text()

    expect(ui.basePath).toBe('/debugger')
    expect(page?.status).toBe(200)
    expect(page?.headers.get('content-type')).toContain('text/html')
    expect(page?.headers.get('cache-control')).toBe('no-cache')
    expect(html).toContain('<base href="/debugger/">')
  })

  test('serves built assets with a long-lived cache', async () => {
    const ui = debuggerUi({ root: await fixture() })

    const asset = await ui.fetch(...get('/assets/app.js'))

    expect(asset?.status).toBe(200)
    expect(asset?.headers.get('content-type')).toContain('text/javascript')
    expect(asset?.headers.get('cache-control')).toContain('immutable')
    expect(await asset?.text()).toContain('console.log')
  })

  test('returns 404 for a missing asset instead of the SPA shell', async () => {
    const ui = debuggerUi({ root: await fixture() })

    const missing = await ui.fetch(...get('/assets/stale.js'))

    expect(missing?.status).toBe(404)
  })

  test('rejects paths that escape the bundle directory', async () => {
    const root = await fixture()
    const outside = join(root, '..', `secret-${Date.now()}`)
    await writeFile(outside, 'secret')
    await symlink(outside, join(root, 'assets', 'escape'))
    const ui = debuggerUi({ root })

    const escaped = await ui.fetch(...get('/assets/escape'))
    const dotted = await ui.fetch(...get('/%2e%2e/secret'))

    expect(escaped?.status).toBe(400)
    expect(dotted?.status).toBe(400)
    expect(await escaped?.text()).not.toContain('secret')
  })
})
