import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // The published API can have callers outside this workspace.
  exclude: ['exports', 'types', 'duplicates', 'unlisted', 'binaries'],
  workspaces: {
    '.': {
      entry: ['scripts/*.{mjs,ts}', 'scripts/__tests__/*.spec.ts'],
    },
    'examples/*': {
      entry: ['src/{main,sandbox}.ts'],
    },
    'examples/designer-playground': {
      // Tailwind scans this package's dist through @source in src/styles.css.
      ignoreDependencies: ['@formivue-design/data-schema-editor'],
    },
    'design/formivue-setters': {
      // The Vitest mocks resolve the loader from the setters test files.
      ignoreDependencies: ['@monaco-editor/loader'],
    },
    'manager/vue': {
      // tsdown resolves this package when bundling Vue's type declarations.
      ignoreDependencies: ['@vue/runtime-core'],
    },
  },
  ignore: [
    '**/benchmark.ts',
    // This composable is used in the ecosystem-bridges guide.
    'examples/vite-usage/src/useFormValues.ts',
  ],
}

export default config
