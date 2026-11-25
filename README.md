# Formivue

[![CI status](https://github.com/stefapi/formivue-design/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/stefapi/formivue-design/actions/workflows/ci.yml)
[MIT license](./LICENSE)

Formivue is a toolkit for building forms with Vue 3.5. It includes a headless
form engine, a standard JSON Schema renderer and a drag-and-drop designer.

[Quick start](#quick-start) · [Demos](#demos) · [Documentation](#documentation) · [Contributing](#contributing)

## What you can build

- **Vue forms** with reactive field state, validation and repeatable rows.
- **Schema-driven forms** with the standard controls or your own component registry.
- **Visual form designs** with editable data models, variants, advanced layouts and charts.

## Quick start

Use Node.js 24 and pnpm 10.15.1 to run the designer from a checkout.

```bash
git clone https://github.com/stefapi/formivue-design.git
cd formivue-design
pnpm install --frozen-lockfile
pnpm build
pnpm start:playground
```

Open [localhost:3004](http://127.0.0.1:3004/) and drag a field onto the canvas.
Open **Data model** to edit its schema and test values.

## Demos

Run the commands from the repository root after installing dependencies.

| Demo                | Command                 | Local URL                                                                                                       |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| Designer            | `pnpm start:playground` | [Standard](http://127.0.0.1:3004/) · [Advanced](http://127.0.0.1:3004/?mode=advanced)                           |
| Data model projects | `pnpm start:playground` | [Variants](http://127.0.0.1:3004/?demo=variants) · [Live documents](http://127.0.0.1:3004/?mode=live-documents) |
| Chart gallery       | `pnpm start:charts`     | [localhost:3005](http://127.0.0.1:3005/)                                                                        |
| Engine playground   | `pnpm demo:playground`  | [localhost:5174](http://127.0.0.1:5174/)                                                                        |

See the [development guide](./DEVELOPMENT.md#demos--playgrounds) for the other
examples and the local documentation site.

## Render a form

Use `@formivue/core` and `@formivue/vue` for the form state and Vue bindings.
`@formivue-design/formivue-runtime` provides the standard `Materials` registry
and runs independently of the designer.

```vue
<script setup lang="ts">
import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-runtime'

const form = createForm()
const { FormLayout } = Materials
const { SchemaField } = createSchemaField({ components: Materials })

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
} as const
</script>

<template>
  <FormProvider :form="form">
    <FormLayout>
      <SchemaField :schema="schema" />
    </FormLayout>
  </FormProvider>
</template>
```

See the [runtime README](./design/formivue-runtime/README.md) for installation
and Tailwind setup. For files supplied by users or external sources, use the
[restricted document import APIs](./design/formivue-transformer/README.md#separate-ui-schema-and-data-documents).

## Documentation

| Resource                                                                                                          | Covers                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [Vue guides](./manager/vue/docs/guide/index.md)                                                                   | Form state, fields, effects, validation and schema rendering  |
| [Designer playground](./examples/designer-playground/README.md)                                                   | Canvas editing, variants, reconciliation and project archives |
| [Data model API](./design/data-model/README.md)                                                                   | Project sessions, drafts and preview integration              |
| [Advanced components](./design/shadcn-advanced-runtime/README.md) and [charts](./design/charts-runtime/README.md) | Extending the runtime registry                                |
| [Architecture](./ARCHITECTURE.md)                                                                                 | Package boundaries and the designer-to-runtime contract       |
| [Development guide](./DEVELOPMENT.md)                                                                             | Builds, tests, demos and releases                             |

## Contributing

Open an [issue](https://github.com/stefapi/formivue-design/issues) to report a
bug or propose a feature. Follow the
[contribution guide](./.github/CONTRIBUTING.md) and run the same checks as CI
before opening a pull request.

```bash
pnpm harness
```

## License

[MIT](./LICENSE)
