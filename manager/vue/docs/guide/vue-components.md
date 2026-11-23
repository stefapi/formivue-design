# @formivue/vue — components & hooks

`@formivue/vue` is the Vue 3 binding layer: it binds `@formivue/core` models to
components. It is **headless** — it ships no UI library of its own (wire
reka-ui / Tailwind as shown in `examples/vite-usage`).

```bash
$ npm install --save @formivue/core @formivue/vue
```

## `<FormProvider>` / `<FormConsumer>`

`FormProvider` distributes the form instance through Vue injection;
`FormConsumer` exposes it back as a render-prop slot.

::: v-pre

```vue
<script setup>
import { FormProvider } from '@formivue/vue'
import { createForm } from '@formivue/core'
const form = createRawForm() // or createForm, see below
</script>
<template>
  <FormProvider :form="form">
    <FormConsumer #default="{ form }">{{ form.values }}</FormConsumer>
  </FormProvider>
</template>
```

:::

> `@formivue/vue` re-exports `createForm` as **`createRawForm`**, with the form
> instance `markRaw`-ed for Vue so it is never made deeply reactive. Prefer it
> in components.

## Field components

| Component       | Model         | Purpose                                     |
| --------------- | ------------- | ------------------------------------------- |
| `<Field>`       | `Field`       | A scalar value field                        |
| `<ArrayField>`  | `ArrayField`  | Array rows: `push/remove/moveUp/...`        |
| `<ObjectField>` | `ObjectField` | Nested object: `addProperty/removeProperty` |
| `<VoidField>`   | `VoidField`   | Layout-only node (no value)                 |

```vue
<Field
  name="email"
  title="Email"
  required
  :validator="zodValidator(schema.shape.email)"
  :decorator="[FormItem]"
  :component="[FInput, { type: 'email' }]"
/>
```

- **`decorator`** — component(s) wrapping the control (label, errors,
  description — e.g. `FormItem`).
- **`component`** — the control itself + props, fed from field state
  (`value`, `disabled`, `readOnly`, `dataSource`…).
- **`reactions`** — reactive functions re-run when read state changes.
- **`pattern`** — `'editable' | 'readOnly' | 'disabled' | 'readPretty'`.

`ArrayField` exposes its model through a scoped slot:

```vue
<ArrayField name="echeances" v-slot="{ field }">
  <li v-for="(_, i) in field.value" :key="i">
    <Field :name="`${i}.montant`" :component="[FInput]" />
    <button @click="field.moveUp(i)">↑</button>
  </li>
</ArrayField>
```

## `<SchemaField>` — `createSchemaField`

JSON-Schema rendering (see the [JSON Schema guide](./json-schema.md)):

```ts
import { createSchemaField } from '@formivue/vue'

const { SchemaField } = createSchemaField({
  components: { FormItem, FInput, FSelect },
  scope: { euro },
})
```

`<SchemaField :schema="schema" :scope="extraScope" />` also accepts
`components`, `name`, `basePath`, `onlyRenderProperties`, `onlyRenderSelf`,
`mapProperties`, `filterProperties`. The factory additionally returns typed
markup shortcuts (`SchemaStringField`, `SchemaObjectField`, …) for
writing forms as JSX-free markup trees.

## `<RecursionField>` / `<ExpressionScope>`

- `RecursionField` renders any schema node subtree
  (`schema`, `name`, `basePath`, `onlyRenderProperties`, `onlyRenderSelf`,
  `mapProperties`, `filterProperties`) — the building block of custom
  schema-driven layouts.
- `ExpressionScope` injects extra values reachable by double-curly expressions.

## Hooks

| Hook                      | Returns                    | Description                                                |
| ------------------------- | -------------------------- | ---------------------------------------------------------- |
| `useForm()`               | `Ref<Form>`                | Form from `FormProvider`                                   |
| `useField<T>()`           | `Ref<T>`                   | Current field (inside `decorator`/`component`)             |
| `useFieldSchema()`        | `Ref<Schema>`              | Current schema node                                        |
| `useParentForm()`         | `Ref<Form \| ObjectField>` | Nearest object-form ancestor                               |
| `useFormEffects(effects)` | `void`                     | Register effects from a component, auto-removed on unmount |

```ts
import { useField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'

const CustomInput = observer(
  defineComponent({
    setup() {
      const fieldRef = useField<Field>()
      return () => h('input', { value: fieldRef.value.value })
    },
  }),
)
```

## Shared helpers: `connect`, `mapProps`, `mapReadPretty`

Bind a plain control component to the field contract:

```ts
import { connect, mapProps, mapReadPretty } from '@formivue/vue'

export const Input = connect(
  FInput,
  mapProps('value', 'disabled', 'readOnly'), // field state → props
  mapReadPretty(ReadPrettyInput), // swap when pattern is readPretty
)
```

`mapProps(...keys | ((props, field) => props))` copies state into props with
special handling of `value`; `mapReadPretty` renders an alternate component
when `field.pattern === 'readPretty'`.

See the [reactive vs Vue guide](./reactive-vs-vue.md) for the
`@formivue/reactive-vue` bridge (`observer`, `useObserver`) — the only
sanctioned glue between formivue models and Vue rendering.
