# <img src="./branding/formivue-mark.svg" alt="" width="32" height="32" /> Formivue

[![CI status](https://github.com/stefapi/formivue-design/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/stefapi/formivue-design/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**A drag-and-drop form designer and schema-driven form engine for Vue 3.5.**

[Quick start](#quick-start) · [Demos](#demos) · [Render a form](#render-a-form) · [Documentation](#documentation) · [Contributing](#contributing)

## Purpose

Formivue lets you design a form visually, export it as JSON and render it in a
Vue application. You can also build forms directly with the headless engine.

- **Design forms** on a canvas with a component palette, field settings,
  layouts and repeatable rows.
- **Edit data models** with JSON Schema validation, test data and variants.
- **Render forms** with reactive field state, validation and the standard Vue
  controls or your own component registry. Add advanced controls and charts as needed.

## Quick start

To build from source and open the designer, use Node.js 24 and pnpm 10.15.1.

```bash
git clone https://github.com/stefapi/formivue-design.git
cd formivue-design
pnpm install --frozen-lockfile
pnpm build
pnpm start:playground
```

Open the [designer playground](http://127.0.0.1:3004/), then drag a field onto
the canvas. In **Data model**, choose **Generate from canvas** to derive a data
schema, edit the test values and apply the draft to the preview.

## Demos

Run these commands from the repository root after building the workspace.

| Demo                             | Command                 | Open locally                                                                                                    |
| -------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| Designer canvas and preview      | `pnpm start:playground` | [Standard](http://127.0.0.1:3004/) · [Advanced](http://127.0.0.1:3004/?mode=advanced)                           |
| Data models and live updates     | `pnpm start:playground` | [Variants](http://127.0.0.1:3004/?demo=variants) · [Live documents](http://127.0.0.1:3004/?mode=live-documents) |
| Charts and filters               | `pnpm start:charts`     | [Chart gallery](http://127.0.0.1:3005/)                                                                         |
| Form engine and schema rendering | `pnpm demo:playground`  | [Engine playground](http://127.0.0.1:5174/)                                                                     |

See the [development guide](./DEVELOPMENT.md#demos--playgrounds) for the other
examples and the local documentation site.

## Render a form

Use `@formivue/core` for form state, `@formivue/vue` for Vue bindings and
`@formivue-design/formivue-runtime` for the standard `Materials` registry.
The runtime runs independently of the designer. Use matching Formivue package
versions and see the [runtime setup guide](./design/formivue-runtime/README.md)
for installation, Tailwind and theme tokens.

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

## Documentation

| Resource                                                                                                          | Covers                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [Vue guides](./manager/vue/docs/guide/index.md)                                                                   | Form state, fields, effects, validation and schema rendering  |
| [Designer playground](./examples/designer-playground/README.md)                                                   | Canvas editing, variants, reconciliation and project archives |
| [Data model API](./design/data-model/README.md)                                                                   | Project sessions, drafts and preview integration              |
| [Advanced components](./design/shadcn-advanced-runtime/README.md) and [charts](./design/charts-runtime/README.md) | Extending the runtime registry                                |
| [Architecture](./ARCHITECTURE.md)                                                                                 | Package boundaries and the designer-to-runtime contract       |
| [Development guide](./DEVELOPMENT.md)                                                                             | Builds, tests, demos and publishing                           |
| [Changelog](./CHANGELOG.md)                                                                                       | Changes by release                                            |

## Contributing

Report bugs and propose features in [GitHub Issues](https://github.com/stefapi/formivue-design/issues).
Before opening a pull request, read the [contribution guide](./.github/CONTRIBUTING.md)
and run the same checks as CI from the repository root.

```bash
pnpm harness
```

## FAQ

**Which files should I export?**

Use `ui.json`, `data.schema.json` and `data.json` to transfer a form variant.
Use `formivue.project.json` to reopen the full designer project with its canvas,
variants and drafts. See the [designer playground guide](./examples/designer-playground/README.md#data-model-workflow).

**How do I render a form supplied by a user or an external source?**

Use the [restricted document import APIs](./design/formivue-transformer/README.md#separate-ui-schema-and-data-documents).
Enable JavaScript reactions and expressions only for documents you trust.

## License

Formivue is distributed under the [MIT License](./LICENSE).
