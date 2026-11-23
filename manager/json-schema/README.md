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

Consumed by the transformer
([`@formivue-design/formivue-transformer`](../../design/formivue-transformer))
and the [`@formivue/vue`](../vue) bindings. Version, repository and license:
see [`package-meta.json`](../../package-meta.json).
