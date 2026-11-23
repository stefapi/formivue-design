# @formivue/vue

**Vue 3** bindings of the [`@formivue/core`] form engine — schema-driven
components, with no design/designer layer.

- **`FormProvider`/`useForm`/`useField`** — injection of the observable
  `form`/`field` ([`@formivue/reactive-vue`](../reactive-vue)) into the Vue
  tree.
- **`createSchemaField(components)`** — factory for schema-driven
  rendering: `SchemaField` + the typed factories (`SchemaStringField`,
  `SchemaObjectField`, `SchemaArrayField`…) — recursive rendering of the
  schema ([`@formivue/json-schema`](../json-schema)), `x-component`,
  `x-decorator`, `x-reactions`…; `RecursionField` is exported separately.
- **`connect`/`mapProps`/`mapReadPretty`** — high-level assembly of
  third-party components (`value`/`onChange` contract, `readPretty`
  rendering).
- **Components** — `Field`, `ArrayField`, `ObjectField`, `VoidField`,
  `ExpressionScope`, `FormConsumer`… (+ re-export of
  `@formivue/json-schema`).

## Example

```ts
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { Input } from './ui'

const SchemaField = createSchemaField({ components: { Input } })
const form = createForm()
```

Complete docs: [`docs`](./docs) (`pnpm demo:docs` — vitepress site, EN/FR
guide). Vite examples: [`examples/vite-usage`](../../examples/vite-usage).
The **designer** materials that pair with these bindings:
[`@formivue-design/formivue-vue`](../../design/formivue-vue). Version,
repository and license: see [`package-meta.json`](../../package-meta.json).
