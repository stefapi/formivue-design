import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { compileDataValidator } from '@formivue/json-schema'

const checkout = process.argv[2]
if (!checkout) {
  console.error('Pass the path to a checkout of JSON-Schema-Test-Suite.')
  process.exit(1)
}
const folder = join(checkout, 'validation', 'tests')

function supports2020(compatibility = '0') {
  let supported = true
  for (const token of compatibility.split(',')) {
    const version = Number(token.replace(/^[<=]+/u, ''))
    supported = token.startsWith('<=')
      ? 2020 <= version
      : token.startsWith('=')
        ? 2020 === version
        : 2020 >= version
    if (2020 <= version) break
  }
  return supported
}

let total = 0
let failed = 0
for (const filename of readdirSync(folder)) {
  // Format assertion is an optional vocabulary. Run the default 2020-12
  // dialect's annotation profile here.
  if (!filename.endsWith('.json') || filename.startsWith('format-')) continue
  const suite = JSON.parse(readFileSync(join(folder, filename), 'utf8'))
  for (const group of suite.tests) {
    if (!supports2020(group.compatibility)) continue
    total += group.tests.length
    try {
      const validate = compileDataValidator(group.schema, {
        resources: group.externalSchemas,
        format: 'annotate',
      })
      for (const example of group.tests) {
        try {
          if ((validate(example.data).length === 0) === example.valid) continue
          failed++
          console.error(filename, group.description, example.description)
        } catch (cause) {
          failed++
          console.error(
            filename,
            group.description,
            example.description,
            cause.message,
          )
        }
      }
    } catch (cause) {
      failed += group.tests.length
      console.error(filename, group.description, cause.message)
    }
  }
}
console.info(
  `Draft 2020-12: ${total - failed}/${total} validation examples passed.`,
)
if (!total || failed) process.exitCode = 1
