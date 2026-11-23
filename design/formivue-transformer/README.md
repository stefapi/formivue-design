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
