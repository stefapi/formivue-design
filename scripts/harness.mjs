import { spawnSync } from 'node:child_process'

const pnpm = process.env.npm_execpath
if (!pnpm) {
  console.error('Run this script with pnpm harness.')
  process.exit(1)
}

const steps = [
  ['lint'],
  ['format:check'],
  ['build'],
  ['knip'],
  ['typecheck'],
  ['test'],
  ['--filter', '@formivue/vue', 'build:docs'],
]

for (const [index, args] of steps.entries()) {
  const command = `pnpm ${args.join(' ')}`
  console.log(`\n[${index + 1}/${steps.length}] ${command}`)
  const result = spawnSync(process.execPath, [pnpm, ...args], {
    cwd: new URL('..', import.meta.url),
    stdio: 'inherit',
  })
  if (result.error || result.status !== 0) {
    const reason = result.error?.message ?? result.signal ?? result.status
    console.error(`Harness stopped at ${command} (${reason})`)
    process.exit(result.status ?? 1)
  }
}

console.log('\nAll harness checks passed.')
