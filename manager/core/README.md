# @formivue/core

**Headless** form engine — observable models for forms (`Form`) and fields
(`Field`/`ArrayField`/`VoidField`…) plus lifecycle effects, with no UI
dependency. Package of the [`manager/`](../../manager) (form manager, copy
of the formivue v3 fork bundled into the repo).

- **`createForm`** — factory for an observable form instance
  (`@formivue/reactive`): values, field errors, visible/disabled/editable
  states, requestIdle…
- **Field models** — `Field`, `ArrayField`, `ObjectField`, `VoidField`
  classes (`value`, `errors`, `dirty`, `valid`, `modified`…), attached via
  `form.createField({ name, basePath })`; `Graph`/`Query` for querying the
  field tree.
- **Effects** — `onFormValuesChange`, `onFieldInit`, `onFieldValueChange`…;
  the full ecosystem: [`@formivue/reactive`](../reactive) (tracking),
  [`@formivue/validator`](../validator) (validation),
  [`@formivue/json-schema`](../json-schema) (schemas),
  [`@formivue/vue`](../vue) bindings.

## Example

```ts
import { createForm, onFormValuesChange } from '@formivue/core'

const form = createForm({ effects: () => onFormValuesChange(console.log) })
form.createField({ name: 'username' })
form.setValues({ username: 'stef' })
```

Docs: [`manager/vue/docs`](../vue/docs) (`pnpm demo:docs`). Version,
repository and license: see [`package-meta.json`](../../package-meta.json).
