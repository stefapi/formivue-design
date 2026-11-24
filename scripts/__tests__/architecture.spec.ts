// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

type Manifest = {
  name: string
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const root = new URL('../../', import.meta.url)
const layers = ['manager', 'design', 'examples'] as const
const workspaces = layers.flatMap((layer) => {
  const directory = new URL(`${layer}/`, root)
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const folder = `${layer}/${entry.name}`
    const filename = new URL(`${entry.name}/package.json`, directory)
    if (!entry.isDirectory() || !existsSync(filename)) return []
    const manifest: Manifest = JSON.parse(readFileSync(filename, 'utf8'))
    const runtime = Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies,
    })
    return [
      {
        name: manifest.name,
        folder,
        layer,
        runtime,
        declared: new Set([
          ...runtime,
          ...Object.keys(manifest.devDependencies ?? {}),
        ]),
      },
    ]
  })
})
const byName = new Map(
  workspaces.map((workspace) => [workspace.name, workspace]),
)
const libraries = workspaces.filter(({ layer }) => layer !== 'examples')

describe('workspace architecture', () => {
  test('the standard transformer is independent of charts and advanced contracts', () => {
    const dependencies = new Set<string>()
    const visit = (name: string) => {
      if (dependencies.has(name)) return
      dependencies.add(name)
      for (const dependency of byName.get(name)?.declared ?? []) {
        if (byName.has(dependency)) visit(dependency)
      }
    }
    visit('@formivue-design/formivue-transformer')
    expect(
      [...dependencies].filter((name) =>
        /^@formivue-design\/(charts-|shadcn-advanced-|data-schema-)/u.test(
          name,
        ),
      ),
    ).toEqual([])
  })

  test('manager, designer and examples respect the dependency direction', () => {
    const violations: string[] = []
    for (const library of libraries) {
      for (const name of library.declared) {
        const dependency = byName.get(name)
        if (!dependency) continue
        const forbidden =
          dependency.layer === 'examples' ||
          (library.layer === 'manager' && dependency.layer !== 'manager') ||
          library.folder === 'design/vue-ui'
        if (forbidden)
          violations.push(`${library.folder} → ${dependency.folder}`)
      }
    }
    expect(violations, 'Forbidden workspace dependencies').toEqual([])
  })

  test('published workspace dependencies are acyclic', () => {
    const visited = new Set<string>()
    const cycles: string[] = []

    const visit = (name: string, chain: string[]) => {
      const start = chain.indexOf(name)
      if (start !== -1) {
        cycles.push([...chain.slice(start), name].join(' → '))
        return
      }
      if (visited.has(name)) return
      const workspace = byName.get(name)
      if (!workspace || workspace.layer === 'examples') return
      for (const dependency of workspace.runtime) {
        visit(dependency, [...chain, name])
      }
      visited.add(name)
    }

    for (const library of libraries) visit(library.name, [])
    expect(cycles, 'Cycles in published workspace dependencies').toEqual([])
  })
})
