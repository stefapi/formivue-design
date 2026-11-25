# @formivue-design/formivue-runtime

Standard Vue bindings for rendering Formivue schemas. `Materials` includes
fields, form layouts, repeatable rows, and read-only presentation.
Array controls use the browser's language and provide English, French and
Spanish labels.

```bash
pnpm add @formivue-design/formivue-runtime @formivue/core @formivue/vue vue
```

Import the runtime stylesheet after Tailwind CSS. It registers the sources
for the runtime bindings and UI controls. The application supplies the
[theme tokens](../vue-ui/README.md).

```css
@import 'tailwindcss';
@import '@formivue-design/formivue-runtime/styles.css';
```

```ts
import { h } from 'vue'
import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-runtime'

const form = createForm()
const { SchemaField } = createSchemaField({ components: Materials })

const schema = {
  type: 'object' as const,
  properties: {
    name: {
      type: 'string' as const,
      title: 'Name',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}

export function renderForm() {
  return h(FormProvider, { form }, () =>
    h(Materials.FormLayout, {}, () => h(SchemaField, { schema })),
  )
}
```

Use the same release of the Formivue packages throughout the application.
With strict declaration checking and a fully isolated Vue 3.5 installation,
add the optional `@babel/types` peer to resolve declarations used by Vue's
compiler.

The [engine demo](../../examples/vite-usage/README.md) uses this package to
render a designer export. Add the
[advanced](../shadcn-advanced-runtime/README.md) or
[chart](../charts-runtime/README.md) registry when the schema uses those
components.
