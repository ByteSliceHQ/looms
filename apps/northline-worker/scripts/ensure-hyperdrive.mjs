import fs from 'node:fs'

const file = process.argv[2]
const id = process.argv[3]

if (!file || !id) {
  console.error('usage: ensure-hyperdrive.mjs <wrangler.jsonc> <hyperdrive-id>')
  process.exit(1)
}

const lines = fs.readFileSync(file, 'utf8').split('\n')
const live = lines.filter((line) => !line.trimStart().startsWith('//')).join('\n')

if (live.includes('"NORTHLINE_DB"')) {
  process.exit(0)
}

let end = lines.length - 1

while (end >= 0 && lines[end].trim() === '') {
  end -= 1
}

if (end < 0 || lines[end].trim() !== '}') {
  console.error('wrangler.jsonc does not end with a closing brace')
  process.exit(1)
}

let property = end - 1

while (
  property >= 0 &&
  (lines[property].trim() === '' || lines[property].trimStart().startsWith('//'))
) {
  property -= 1
}

if (property < 0) {
  console.error('wrangler.jsonc has no binding before the closing brace')
  process.exit(1)
}

if (!lines[property].trimEnd().endsWith(',')) {
  lines[property] = `${lines[property].trimEnd()},`
}

const entry = [
  '  "hyperdrive": [',
  '    {',
  '      "binding": "NORTHLINE_DB",',
  `      "id": ${JSON.stringify(id)}`,
  '    }',
  '  ]',
]

lines.splice(end, 0, ...entry)
fs.writeFileSync(file, `${lines.join('\n').replace(/\n*$/, '')}\n`)
