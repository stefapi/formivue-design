# @formivue-design/formivue-transformer

**TreeNode ⇄ formivue JSON Schema** transformer — the export/import
bridge between the designer's design tree
([`@formivue-design/core`](../core)) and the schemas consumed by
[`@formivue/vue`](../../manager/vue) (`manager/`).

- `transformToSchema(tree, options)` — designer tree →
  `{ schema, form }` (formivue `ISchema`: `x-component`, props,
  `x-reactions`…); the node markers become the schema's components.
- `transformToTreeNode(schema, form, options)` — formivue schema → designer
  `TreeNode` (import, full round-trip).
- **Options** — `formivue-designFieldName` (default `'Field'`) and
  `formivue-designFormName` (default `'Form'`) control the naming of the
  markers in the exported JSON.

## Example

```ts
import {
  transformToSchema,
  transformToTreeNode,
} from '@formivue-design/formivue-transformer'

const { schema, form } = transformToSchema(designer.operation.tree)
// … then, on import:
const tree = transformToTreeNode(schema, form)
```

Used by the playground of
[`@formivue-design/formivue-vue`](../formivue-vue) (JSON export/import). Version,
repository and license: see [`package-meta.json`](../../package-meta.json).

## Separate UI, schema and data documents

Document import and compilation use restricted rendering by default.
`parseFormDocuments`, `compileFormDocuments`, `createFormDocument` and legacy
`transformToTreeNode` reject executable rendering settings such as JavaScript
expressions and reactions. Use declarative `bindings` for data-driven props.
For content explicitly trusted by the application, pass `{ trusted: true }`
to each relevant import and compilation call. Keep this choice outside the
imported JSON.

`transformToFormDocuments(tree)` migrates the designer tree to three separate
documents. For a saved `{ form, schema }` export, use `splitFormSchema(export)`.
The old import and export APIs are also available. A custom expression used as a
data source needs an explicit binding when migrating. The JSON tab in the
designer imports, validates, previews and downloads the three documents.

- `ui.json` contains a versioned component tree. Editors use `bind`, a JSON
  Pointer in their current object or row. Display props use
  `bindings: { rows: { path: '/sales' } }`. Prop paths start at the document root
  unless `scope: 'parent'` is set. Custom prop bindings declare their expected
  JSON types in `types`.
- `data.schema.json` contains a JSON Schema 2020-12 object schema. Table columns
  and chart mappings refer to properties declared in the row schema.
- `data.json` contains the values and may have properties that are used only by
  a display component.

```ts
const session = createFormDocument(
  parseFormDocuments({ ui: uiJson, dataSchema: schemaJson, data: dataJson }),
)

// Render under FormProvider with { form: session.form, retain: true }.
// Pass session.schema and session.scope to SchemaField, and session.formProps
// to the enclosing form layout.
session.replaceData(snapshot, 5)
session.applyPatch({
  baseRevision: 5,
  revision: 6,
  operations: [{ op: 'replace', path: '/sales/0/amount', value: 1350 }],
})

const files = stringifyFormDocuments(session.exportDocuments())
session.dispose()
```

### Component contracts

Standard components work with the default registry. Add extensions explicitly
when migrating or compiling documents that use additional components.

```ts
import {
  createDocumentContractRegistry,
  createFormDocument,
  transformToFormDocuments,
} from '@formivue-design/formivue-transformer'
import { advancedDocumentContracts } from '@formivue-design/data-schema-advanced'
import { chartDocumentContracts } from '@formivue-design/data-schema-charts'

const contracts = createDocumentContractRegistry([
  advancedDocumentContracts,
  chartDocumentContracts,
])
const documents = transformToFormDocuments(tree, undefined, { contracts })
const session = createFormDocument(documents, { contracts })
```

An extension registers components by name and supplies their data shape and
property bindings. It can declare table columns and a row validator, or
transform component props while migrating and compiling.
`compileFormDocuments` returns resolved dependencies and diagnostics. The
dependency path uses `null` for an array item. A custom component without a
registered contract generates a warning. Typed bindings can still be checked
and a renderer registry can reject unrecognized component names. Duplicate
contracts and unresolved bindings produce errors.

### Bind chart filters to form fields

Declare the row source and the filter bindings in `ui.json`. Both paths
refer to properties described by `data.schema.json`. More than one chart
can read the same filter fields.

```json
{
  "bindings": { "rows": { "path": "/sales" } },
  "props": {
    "filters": [
      {
        "column": "ordered",
        "operation": "dateRange",
        "valueBinding": { "path": "/selection/period" }
      },
      {
        "column": "status",
        "operation": "matches",
        "valueBinding": { "path": "/selection/status" }
      }
    ]
  }
}
```

`dateRange` expects a date column and a field that accepts a pair of dates.
`matches` accepts a scalar or a list of choices compatible with its column.
A filter may also declare a fixed `value`. Supported legacy field expressions
are converted to `valueBinding` when reading a document. The compiler validates
the row source, mapped columns and filter fields, and generates runtime bindings.
Filters limit the chart and its data table while preserving the source rows.
Renaming a column or a filter field in a variant updates its references in
`ui.json`.

The chart runtime and the chart extension use the same JSON mapping catalogue
and row validators for chart-specific rules, including cyclic Sankey flows.
The advanced extension validates DataTable columns and explicitly configured
row keys, as well as questionnaire and stepper branch values.

### Generate a model and prepare variants

`generateFormDataSchema(ui, { contracts })` derives a JSON Schema from a
version 1 UI document. It combines the expectations of the fields and
display bindings, including columns used only by a table or chart. The same
registry is used for generation, migration, and compilation.

```ts
const project = createFormDocumentProject(JSON.parse(uiJson), { contracts })
const withVariant = createFormDocumentVariant(project, 'Sales API')
const { project: renamed, impact } = renameFormDocumentProperty(
  withVariant,
  'Sales API',
  { path: ['sales', null, 'amount'], key: 'sales_amount' },
  { contracts },
)
const exported = stringifyFormDocuments(
  exportFormDocumentVariant(renamed, 'Sales API', { contracts }),
)
const imported = createFormDocumentProject(parseFormDocuments(exported), {
  contracts,
})
```

Pass a migrated canvas export or an imported three-document bundle to
`createFormDocumentProject` to use its existing schema and data. Pass an
existing variant name as the third argument of `createFormDocumentVariant`
to duplicate its schema, values and renames.

Use `null` to rename a property in every item of a repeated array.
`renameFormDocumentProperty` returns the affected component IDs and path
change after validating the candidate schema, bindings and values. Variants
share a canonical UI and materialize their bindings when exported.
Collisions and dependencies that cannot be rewritten report diagnostics
before a new project is returned. `reconcileFormDocumentProject` checks a
new canvas export against all saved variants and reports changes to
bound fields by component ID.

### Move a property between objects

```ts
const { project: moved, impact } = moveFormDocumentProperty(
  project,
  'Sales API',
  { path: ['sales', null, 'amount'], to: ['sales', null, 'metrics', 'amount'] },
  { contracts },
)
```

The operation moves the property schema and the value in every affected
record. It preserves applicable `required` rules and rewrites supported
structured bindings. The impact reports the new objects and the affected
components and dependencies. The playground shows this report before
confirming the move in the variant draft.

Rows contracts accept `bindings.rows.columnPaths`, a map from logical column
names to row-relative JSON Pointers. For example,
`"columnPaths": { "amount": "/metrics/amount" }` lets a chart or DataTable
keep its existing column configuration. Runtime consumers receive projected
rows. The editable array, its row identity and the exported values retain
their original nested structure.

A move stays in the same root record or in each item of the same array.
Collisions, shared definitions on the affected path, editable array key moves
into nested objects and rules that cannot be migrated produce diagnostics
before the project is updated.

### Reconcile canvas changes in the playground

Generate from the canvas to compare the current bindings by stable component
ID. For a field renamed in the same canvas object, each variant can retain
its key or use the canvas key inside its current object. The review replays
previous moves before applying the choice.

- An addition can use the canvas key, use a free key ending in `_canvas`,
  or be deferred in a variant. Reusing an existing key validates its schema
  and values against the new control.
- A removal can keep its current control in a variant or detach the control.
  Its schema, values, and surviving data bindings are preserved.
- A type change can keep the current control or adopt the canvas control.
  When the new type reuses an occupied key, the previous schema and values
  are archived together under a free key ending in `_previous` in the same
  object. Existing keys are preserved, including when the change affects
  every item of an array.

The review validates the base and all saved variants before adopting the
canvas. A collision or a schema rule that cannot be migrated leaves the
project and its drafts intact. A draft is migrated using the same decisions
and its own schema, values and path changes. The last applied preview stays
available until the draft is applied. The three JSON files contain the
effective UI, constraints and values, including detached and archived
properties, and can be imported again for editing or rendering.

In the playground, **Export project** in **Data model** downloads a single
`formivue.project.json` with the current canvas, base model, all variants,
selected variant, all drafts and last applied preview. Draft documents are
stored as text so unfinished JSON can be edited after import. Confirmed
reconciliation decisions travel with variant and draft path changes,
UI overrides, and preserved data properties.

An open reconciliation review travels with its proposed canvas and
unconfirmed choices. Import reopens it for confirmation. A review made
against an older version of the project or canvas requires regeneration
before its choices can be applied.

Use **Import project** to validate the archive and review the replacement
before opening it. The archive is meant for resuming work in the designer.
The three individual JSON documents remain the format for rendering or
sharing one variant.

### Project constraints onto the form

The document compiler projects numeric ranges, integer input, increments,
choices and collection limits onto compatible controls. The data document
validates the original JSON Schema and reports errors by field path, including
patterns and Unicode string lengths. Existing values keep their original
types. A schema default on an array item can initialize a newly added row.

The playground exposes the visual editor on the `data.schema.json` document
tab. It edits the same draft as the JSON source view and uses the same
validation when applying or downloading the three documents.

The application supplies the transport. A patch applies to the last accepted
remote revision and publishes only if its entire result is valid. Display
bindings read the latest valid data. Editors keep their draft and track
overlapping changes in `session.conflicts`. Configure a `rowKey` on editable
arrays to match records across remote insertions, deletions and moves.
`resolveConflicts(true)` keeps the draft. `resolveConflicts(false)` resets the
draft to the latest remote snapshot. `session.form.validate()` and
`session.form.submit()` check the complete draft.
