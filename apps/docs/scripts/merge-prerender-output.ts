// oxlint-disable-next-line effecttsgo/node-builtin-import -- This build script needs filesystem access.
import { cp, rm } from 'node:fs/promises'

const prerenderedPublicDir = new URL('../.prerender/public/', import.meta.url)
const workerPublicDir = new URL('../.output/public/', import.meta.url)

await cp(prerenderedPublicDir, workerPublicDir, {
  recursive: true,
  force: true,
})

await rm(new URL('../.prerender/', import.meta.url), {
  recursive: true,
  force: true,
})
