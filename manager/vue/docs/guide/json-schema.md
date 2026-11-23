# JSON Schema — `@formivue/json-schema`

The same form engine, described as data: the form becomes a storable,
versionable, server-generatable JSON document. `SchemaField` (from
`createSchemaField`, see [Vue components](./vue-components.md)) renders it.

## Schema basics

```ts
const schema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      title: 'Email',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'FInput',
      'x-component-props': { type: 'email' },
    },
  },
}
```

Standard JSON Schema keys are honored: `title`, `description`, `default`,
`type`, `enum`, `required`, `properties`, `items`, `patternProperties`,
`additionalProperties`, `maxItems`, `minLength`, … plus the `x-` extensions:

| Key                                                                                      | Purpose                                   |
| ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| `x-component` / `x-component-props`                                                      | Control + props                           |
| `x-decorator` / `x-decorator-props`                                                      | Wrapper + props                           |
| `x-pattern` / `x-display`                                                                | `'editable'…` / `'none'…`                 |
| `x-validator`                                                                            | Rules (string/object/function/array)      |
| `x-reactions`                                                                            | Reactive expressions (below)              |
| `x-value` / `x-index`                                                                    | Initial value / render order              |
| `x-content` / `x-data`                                                                   | Children / arbitrary data                 |
| `x-visible` / `x-hidden` / `x-disabled` / `x-editable` / `x-read-only` / `x-read-pretty` | State shortcuts                           |
| `x-compile-omitted`                                                                      | Keys excluded from expression compilation |

## Render a designer export

The designer exports a `{ form, schema }` object. Register the shared
`Materials` collection in `@formivue/vue` so your application interprets
the same component properties as the designer preview. Pass the root
`form` properties to `Materials.FormLayout`.

```vue
<script setup lang="ts">
import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-vue'
import rawExport from './form.json'

const form = createForm()
const { FormLayout } = Materials
const { SchemaField } = createSchemaField({ components: Materials })
const layout = rawExport.form as InstanceType<typeof FormLayout>['$props']
</script>

<template>
  <FormProvider :form="form">
    <FormLayout v-bind="layout">
      <SchemaField :schema="rawExport.schema" />
    </FormLayout>
  </FormProvider>
</template>
```

Include the layouts and controls in your Tailwind 4 styles by scanning
the installed `@formivue-design/formivue-vue/dist` and
`@formivue-design/vue-ui/dist` packages. Run `pnpm demo:playground`
and open **Designer form** for a runnable workspace example.

| Component                                 | Settings carried by the schema                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FormLayout`, `Space`, `Card`, `FormGrid` | The root `form.layout` and nested `x-component-props.layout` control label orientation. Component `style` carries CSS such as display, width, margin, padding and flex gap. Grid spacing uses `rowGap` and `columnGap`.                                                                                     |
| `FormTab`                                 | Set `x-component-props.activeKey` to the default tab. The first available tab opens when the key is absent or unavailable.                                                                                                                                                                                  |
| `FormCollapse`                            | Set `x-component-props.defaultOpenKeys` to an array of panel keys. An empty array opens none. Set `accordion: true` for one open panel at a time.                                                                                                                                                           |
| `Cascader`, `TreeSelect`                  | Options in `enum` can have nested `children` at any level.                                                                                                                                                                                                                                                  |
| `Slider`                                  | Use the field's numeric `default` and the component's `min`, `max` and `step`. Set `showValue: false` to hide the numeric readout.                                                                                                                                                                          |
| `Text`                                    | Set `content` and choose `format: 'text'` for plain text with line breaks, or `format: 'html'` for filtered formatting markup. Plain text is the default.                                                                                                                                                   |
| `ArrayCards`, `ArrayTable`                | The field's `default` is an array of records and `items` describes each item. The `Addition` control accepts `title`, `defaultValue` and `method: 'push' \| 'unshift'`. Keep the configured row controls and column properties in the export. The table's sort handle supports dragging and the arrow keys. |

Tab and accordion keys are the names in the container's `properties`,
or the explicit `x-component-props.key` on the tab or panel.
The designer's reaction settings also stay in the export as `x-reactions`.

## Expressions

Any string containing a double-curly expression (`&#123;&#123; ... &#125;&#125;`) is compiled against the scope (components
registry + `scope` from `createSchemaField` / `ExpressionScope`):

::: v-pre

```json
"fulfill": {
  "state": {
    "value": "{{ $deps[0] > 0 ? Math.round(($deps[1] / $deps[0]) * 1000) / 10 : 0 }}"
  }
}
```

:::

The expression engine can be replaced wholesale with
`Schema.registerCompiler(fn)`; `Schema.compile(expression, scope)` /
`Schema.shallowCompile` are the lower-level entry points.

## `x-reactions`

Dependencies between fields, expressed as data. Accepts an object, an array,
or a function. Each reaction supports:

- **`dependencies`** — field paths; values become `$deps` in expressions.
- **`target`** — the field to act on (defaults to the owner field).
- **`when`** — double-curly expression (or boolean) guarding the reaction.
- **`effects`** — `SchemaEffectTypes[]` (trigger filtering).
- **`fulfill`** — `{ state?, schema?, message?, runner? }`: state patches,
  full schema replacement, a message to set, or a runner function.

::: v-pre

```ts
const schema = {
  properties: {
    rate: {
      type: 'number',
      'x-pattern': 'readPretty',
      'x-reactions': {
        dependencies: ['income', 'rent'],
        fulfill: {
          state: {
            value:
              '{{ $deps[0] > 0 ? Math.round(($deps[1] / $deps[0]) * 100) : 0 }}',
          },
        },
      },
    },
    guarantorNeeded: {
      type: 'boolean',
      'x-reactions': {
        dependencies: ['rate'],
        fulfill: { state: { visible: '{{ $deps[0] > 33 }}' } },
      },
    },
  },
}
```

:::

## `Schema` class API

Static: `Schema.getOrderProperties`, `Schema.compile`,
`Schema.shallowCompile`, `Schema.isSchemaInstance`, `Schema.registerCompiler`,
`Schema.registerPatches`, `Schema.registerVoidComponents`,
`Schema.registerTypeDefaultComponents`, `Schema.registerPolyfills`,
`Schema.enablePolyfills`, `Schema.silent`.

Instance: `addProperty` / `removeProperty` / `setProperties`,
`addPatternProperty` / `removePatternProperty` / `setPatternProperties`,
`setAdditionalProperties`, `setItems` / `setAdditionalItems`,
`findDefinitions(ref)`, `mapProperties`, `mapPatternProperties`,
`reduceProperties`, `reducePatternProperties`, `compile(scope?)`,
`fromJSON`, `toJSON`, **`toFieldProps()`** (the bridge turning a schema node
into `@formivue/core` field props).
