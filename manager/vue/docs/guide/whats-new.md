# Formivue v3

## Platform and packaging

- Vue bindings target Vue 3.5. The engine also supports headless use.
- Packages expose ESM and TypeScript declarations through their public exports.
- The workspace uses Node 24, pnpm 10.15.1 and TypeScript 6.
- Public packages in the Changesets fixed group share one version.

## Rendering and editing

Use `@formivue-design/formivue-runtime` for the standard schema registry and
its Tailwind sources. The visual designer assembles canvas metadata and
settings from `formivue-vue` with the same runtime bindings. See
[Render a designer export](./json-schema.md#render-a-designer-export).

For a data model project, the designer manages `ui.json`, `data.schema.json`
and `data.json` together with variants, drafts and project archives. The
transformer provides restricted import and compilation entry points.
[Import documents](./json-schema.md#import-documents) describes the policy
for declarative bindings and trusted JavaScript.

## Engine and validation

- `FormPath` traverses own properties in concrete and destructured paths.
  See the [utilities guide](./utilities.md).
- `compileDataValidator` and `createDataDocument` support Draft 2020-12
  validation, JSON Patch and document revisions.
- `zodValidator` from `@formivue/validator/zod` adapts Zod rules to a field.
  See [validation](./validation.md) and
  [ecosystem bridges](./ecosystem-bridges.md).
