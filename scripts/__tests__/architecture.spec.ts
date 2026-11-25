// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

type Manifest = {
  name: string
  private?: boolean
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
        private: manifest.private === true,
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

function dependencyCycles(graph: ReadonlyMap<string, readonly string[]>) {
  const visited = new Set<string>()
  const active = new Set<string>()
  const cycles: string[] = []

  function visit(name: string, chain: string[]) {
    if (active.has(name)) {
      cycles.push([...chain.slice(chain.indexOf(name)), name].join(' → '))
      return
    }
    if (visited.has(name) || !graph.has(name)) return
    active.add(name)
    for (const dependency of graph.get(name))
      visit(dependency, [...chain, name])
    active.delete(name)
    visited.add(name)
  }

  for (const name of graph.keys()) visit(name, [])
  return cycles
}

function runtimeSpecifier(statement: ts.Statement) {
  const typed = (elements: readonly { isTypeOnly: boolean }[]) =>
    elements.length > 0 && elements.every((element) => element.isTypeOnly)

  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause
    const bindings = clause?.namedBindings
    if (
      clause?.isTypeOnly ||
      (!clause?.name &&
        bindings &&
        ts.isNamedImports(bindings) &&
        typed(bindings.elements))
    )
      return
    return statement.moduleSpecifier
  }
  if (
    ts.isExportDeclaration(statement) &&
    !statement.isTypeOnly &&
    !(
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause) &&
      typed(statement.exportClause.elements)
    )
  )
    return statement.moduleSpecifier
}

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
    const cycles = dependencyCycles(
      new Map(libraries.map(({ name, runtime }) => [name, runtime])),
    )
    expect(cycles, 'Cycles in published workspace dependencies').toEqual([])
  })

  test('all published libraries are in the fixed release group', () => {
    const { fixed }: { fixed: string[][] } = JSON.parse(
      readFileSync(new URL('.changeset/config.json', root), 'utf8'),
    )
    const published = libraries
      .filter((library) => !library.private)
      .map(({ name }) => name)
      .sort()
    expect(fixed.map((group) => [...group].sort())).toEqual([published])
  })

  test('JSON Schema document modules have no runtime import cycles', () => {
    const directory = new URL('manager/json-schema/src/', root)
    const files = readdirSync(directory).filter((name) =>
      /^document-.+\.ts$/u.test(name),
    )
    const sources = new Set(files)
    const graph = new Map(
      files.map((file) => {
        const source = ts.createSourceFile(
          file,
          readFileSync(new URL(file, directory), 'utf8'),
          ts.ScriptTarget.Latest,
        )
        const dependencies = source.statements.flatMap((statement) => {
          const specifier = runtimeSpecifier(statement)
          if (
            !specifier ||
            !ts.isStringLiteral(specifier) ||
            !specifier.text.startsWith('.')
          )
            return []
          const target = specifier.text.replace(/^\.\//u, '') + '.ts'
          return sources.has(target) ? [target] : []
        })
        return [file, dependencies]
      }),
    )
    expect(dependencyCycles(graph)).toEqual([])
  })
})
