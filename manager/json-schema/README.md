# @formivue/json-schema

**JSON schema ⇄ field model** conversion for the form manager
([`manager/`](../../manager), copy of the formivue v3 fork).

- **`Schema`** — observable JSON schema model: parses the JSON into a tree
  of sub-schemas, resolves the formivue extensions (`x-component`,
  `x-component-props`, `x-reactions`, `x-data`, `x-visible`…) and the
  `JSONSchema` fragments (`$ref`, `$defs`, `definitions`).
- **Reactions** — `SchemaReaction`: declarative protocol for dependencies
  between fields (`$deps`, `target`, `fulfill.state`/`fulfill.run`) — the
  engine behind the linked/reactions of schema-driven forms.
- **`ISchema`** — complete typing of formivue schemas.
- **Data documents** — `compileDataValidator` validates Draft 2020-12 data
  and reports issues by JSON Pointer. `createDataDocument` connects a schema
  to form values and applies revisions, snapshots and JSON Patch updates.

## Example

```ts
import { Schema } from '@formivue/json-schema'

const schema = new Schema({
  type: 'object',
  properties: {
    username: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
})
```

Keep executable reactions and expressions in trusted schemas. For imported
UI documents, use the restricted entry points in the transformer
([`@formivue-design/formivue-transformer`](../../design/formivue-transformer))
before rendering with [`@formivue/vue`](../vue). See the
[JSON Schema guide](../vue/docs/guide/json-schema.md) for rendering and
document imports.
