// @vitest-environment node
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { expect, test } from 'vitest'

test('the public data model declarations type-check with their dependencies', () => {
  const declarations = ['index.d.mts', 'ui.d.mts'].map((name) =>
    fileURLToPath(new URL(`../../dist/${name}`, import.meta.url)),
  )
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.NodeNext,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    types: [],
  }
  const host = ts.createCompilerHost(options)
  const program = ts.createProgram(declarations, options, host)
  expect(ts.formatDiagnostics(ts.getPreEmitDiagnostics(program), host)).toBe('')
})
