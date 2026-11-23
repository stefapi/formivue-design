# Formivue

[MIT](./LICENSE) · Node ≥24 · pnpm 10 · Vue 3.5 · TypeScript 6 · Tailwind 4

**Formivue** is a complete ecosystem for building forms with
**Vue 3.5**: a **headless form engine** (`@formivue/*`) and a
**drag-and-drop form designer** (`@formivue-design/*`), all in
**strict TypeScript**, on a **reka-ui + Tailwind 4** UI stack, with no
mandatory component library.

The same engine powers every usage:

- **code-driven forms** — `<Field>` components, hooks, fine-grained
  reactivity;
- **JSON-Schema-driven forms** — a storable, versionable,
  server-generatable schema, with `x-reactions` for declarative logic;
- **visual designer** — draw, drag and drop, edit properties,
  export/import JSON, then replay that JSON in the engine at runtime.

```bash
git clone https://github.com/stefapi/formivue-design.git && cd formivue-design
pnpm install
pnpm -r build
pnpm start:playground   # http://127.0.0.1:3004
```

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Packages](#packages)
- [Dependencies](#dependencies)
- [Usage](#usage)
  - [Without JSON — markup components](#1-without-json--markup-components)
  - [With JSON Schema](#2-with-json-schema)
  - [The designer](#3-the-designer)
  - [Feeding / reading values](#4-feeding--reading-values)
  - [Tailwind 4 theme](#5-tailwind-4-theme)
- [Playgrounds & demos](#playgrounds--demos)
- [Scripts](#scripts)
- [Tests & quality](#tests--quality)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🚀 **Headless engine** — the engine draws nothing: each project plugs its
  own components through a registry; a component only needs the
  `value` + `onChange(value)` contract to bind to a field
- 🧩 **Full JSON Schema** — `title`, `description`, `default`, `type`,
  `enum`, `required`, `properties`, `items`, `patternProperties`… plus the
  `x-component`, `x-decorator`, `x-validator`, `x-reactions`,
  `x-pattern`, `x-value` extensions
- ⚡ **Dual-framework reactivity** — an observable core (`observable`,
  `autorun`, `action`, `batch`) and a bridge to Vue reactivity
  (`observer`); states (`value`, `errors`, `validating`, `visible`,
  `disabled`…) are observables
- 🔗 **Declarative, data-driven logic** — `x-reactions` with
  `dependencies`, `when`, `fulfill.state`/`fulfill.schema` and `{{ }}`
  expressions compiled against a scope
- 🎨 **Drag-and-drop designer** — materials palette, component tree,
  properties panel (`SettingsForm`), history, mobile/desktop simulators,
  JSON export
- 🖇️ **Designer ⇄ runtime loop** — the designer produces a JSON Schema,
  the engine replays it identically (`TreeNode ⇄ JSON Schema`)
- 🏅 **Accessibility** — `axe-core` = 0 violation on the repo's code
  (Vitest gate + browser proof)
- 📦 **Pure ESM** — tsdown, `exports` fields, `.d.mts`,
  `sideEffects: false`

## Requirements

| Tool    | Version                  |
| ------- | ------------------------ |
| Node    | `>=24 <25`               |
| pnpm    | `10` (`corepack enable`) |
| Browser | any evergreen browser    |

## Installation

The repo is a **self-contained monorepo** (pnpm workspaces): the engine
(`manager/`) and the designer (`design/`) live together and resolve each
other as `workspace:*` through the overrides in `pnpm-workspace.yaml` — a single
lockfile, no sibling checkout to clone.

```bash
corepack enable
git clone https://github.com/stefapi/formivue-design.git && cd formivue-design
pnpm install          # resolves @formivue/* to manager/
pnpm -r build         # ESM build of the 18 packages + Vite builds of the apps
```

### As dependencies

The packages are published separately: install only what you need.

```bash
# form engine
npm install @formivue/core @formivue/vue

# JSON Schema driver
npm install @formivue/json-schema

# full designer
npm install @formivue-design/core @formivue-design/vue \
  @formivue-design/vue-ui @formivue-design/vue-settings-form \
  @formivue-design/formivue-vue
```

## Packages

### `manager/` — the form engine (`@formivue/*`)

| Package                  | Role                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| `@formivue/reactive`     | reactive core — `observable`, `autorun`, `action`, `batch`                |
| `@formivue/reactive-vue` | Vue 3 bindings for the reactive core (`observer`)                         |
| `@formivue/core`         | headless engine — `createForm`, `Form`/`Field`, `Query`, effects, cycle   |
| `@formivue/path`         | path language (`get`/`set`/`match` on nested values)                      |
| `@formivue/shared`       | shared toolbox (merge, clone, checkers)                                   |
| `@formivue/validator`    | validation — rules, formats, locales, `zod` bridge                        |
| `@formivue/json-schema`  | JSON Schema driver — schema → field props, `x-reactions`, expressions     |
| `@formivue/grid`         | reactive layout grid (columns/rows from the live container size)          |
| `@formivue/vue`          | Vue 3 bindings — `FormProvider`, `Field`, `SchemaField`, `connect`, hooks |

### `design/` — the designer (`@formivue-design/*`)

| Package                                 | Role                                                              |
| --------------------------------------- | ----------------------------------------------------------------- |
| `@formivue-design/shared`               | shared utilities                                                  |
| `@formivue-design/core`                 | designer engine — `TreeNode`, drivers, `TransformHelper`          |
| `@formivue-design/vue-ui`               | headless design system — reka-ui + shadcn-vue + Tailwind 4        |
| `@formivue-design/vue`                  | designer Vue widgets and panels                                   |
| `@formivue-design/vue-sandbox`          | schema rendering in a sandboxed iframe                            |
| `@formivue-design/vue-settings-form`    | properties panel (`SettingsForm`, `setNpmCDNRegistry`)            |
| `@formivue-design/formivue-vue`         | formivue materials for the canvas (widgets + Behaviors/Resources) |
| `@formivue-design/formivue-setters`     | property setters (`DataSourceSetter`, `ReactionsSetter`…)         |
| `@formivue-design/formivue-transformer` | `TreeNode ⇄ JSON Schema` bridge for formivue                      |

## Dependencies

- **[Vue 3.5](https://github.com/vuejs/core)** — UI runtime, SFC, typed slots
- **[reka-ui](https://github.com/unovue/reka-ui)** — unstyled headless primitives
  (dialog, menu, select, tooltip…) — the foundation of
  `@formivue-design/vue-ui`
- **[Tailwind CSS 4](https://github.com/tailwindlabs/tailwindcss)** — utility-class styling;
  the consumer provides the CSS entry point and theme tokens
- **class-variance-authority / clsx / tailwind-merge** — variants and
  class merging inside `vue-ui`
- **[@internationalized/date](https://github.com/adobe/react-spectrum)** —
  date formatting and manipulation for `DatePicker`/`TimePicker`
- **[@lucide/vue](https://www.npmjs.com/package/@lucide/vue)** — icons
- **TypeScript ~6**, **tsdown** — ESM build + `.d.mts`
- **[Vitest](https://github.com/vitest-dev/vitest)** + `@vue/test-utils`, jsdom, axe-core —
  unit and integration tests, a11y gate

## Usage

The examples below use a small local component kit (`FInput`, `FSelect`,
`FormItem`…): that is the engine's principle — **it ships no UI**, each
project provides its own (yours, `@formivue-design/vue-ui`, or any
reka-ui/Tailwind library).

### 1. Without JSON — markup components

A component only needs the `value` + `onChange` contract to bind:

```vue
<!-- MyInput.vue -->
<script setup lang="ts">
const props = defineProps<{
  value?: string
  onChange?: (value: string) => void
}>()

function onInput(e: Event) {
  props.onChange?.((e.target as HTMLInputElement).value)
}
</script>

<template>
  <input :value="props.value ?? ''" @input="onInput" />
</template>
```

```vue
<!-- MyForm.vue -->
<script setup lang="ts">
import { createForm } from '@formivue/core'
import { FormProvider, Field } from '@formivue/vue'
import MyInput from './MyInput.vue'

const form = createForm()
</script>

<template>
  <FormProvider :form="form">
    <Field
      name="email"
      title="Email"
      required
      :validator="[{ format: 'email', message: 'Invalid email' }]"
      :component="[MyInput, { placeholder: 'you@example.com' }]"
    />
  </FormProvider>
</template>
```

Events are wired automatically: `ReactiveField` wraps `change`/`focus`/
`blur` with `field.onInput`/`onFocus`/`onBlur` and re-injects `value`,
`disabled`, `readOnly` on every render. `ArrayField`/`ObjectField`
expose their model through scoped slots:

```vue
<ArrayField name="installments" v-slot="{ field }">
  <li v-for="(_, i) in field.value" :key="i">
    <Field :name="`${i}.amount`" :component="[MyInput]" />
    <button @click="field.moveUp(i)">↑</button>
  </li>
</ArrayField>
```

### 2. With JSON Schema

The same form, described as data — storable, versionable,
server-generatable:

```ts
import { createForm } from '@formivue/core'
import { createSchemaField } from '@formivue/vue'
import { FormItem, FInput, FSwitch } from './ui' // your registry

const { SchemaField } = createSchemaField({
  components: { FormItem, FInput, FSwitch },
})

const form = createForm({
  initialValues: { income: 2600, rent: 950 },
})

const schema = {
  type: 'object',
  properties: {
    income: {
      type: 'number',
      title: 'Net monthly income',
      required: true,
      default: 2600,
      'x-decorator': 'FormItem',
      'x-component': 'FInput',
      'x-component-props': { type: 'number', suffix: '€' },
    },
    rent: {
      type: 'number',
      title: 'Rent including charges',
      required: true,
      default: 950,
      'x-decorator': 'FormItem',
      'x-component': 'FInput',
      'x-component-props': { type: 'number', suffix: '€' },
    },
    rate: {
      type: 'number',
      title: 'Effort rate',
      'x-pattern': 'readPretty',
      'x-decorator': 'FormItem',
      'x-component': 'FInput',
      'x-component-props': { suffix: '%' },
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
  },
}
```

```vue
<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
  </FormProvider>
</template>
```

`x-reactions` carries the declarative logic (`dependencies`, `when`,
`fulfill.state`/`fulfill.schema`), `{{ }}` expressions are compiled
against a scope (`ExpressionScope`), and the `Schema` class exposes
`fromJSON`/`toJSON` for the full round-trip.

### 3. The designer

The designer assembles both worlds: the materials of
`@formivue-design/formivue-vue` declare both their **widgets** (consumed
by `SchemaField`) and their **Behaviors/Resources** (consumed by the
canvas):

```ts
import {
  Designer,
  StudioPanel,
  ToolbarPanel,
  WorkspacePanel,
  SettingsPanel,
  ViewportPanel,
  ViewPanel,
  ResourceWidget,
  HistoryWidget,
  OutlineTreeWidget,
} from '@formivue-design/vue'
import { createDesigner, GlobalRegistry } from '@formivue-design/core'
import { SettingsForm } from '@formivue-design/vue-settings-form'
import {
  Form,
  Field,
  Input,
  Select,
  FormItem,
} from '@formivue-design/formivue-vue'
```

```ts
GlobalRegistry.registerDesignerLocales({
  'fr-FR': { sources: { Inputs: 'Entrées', Layouts: 'Disposition' } },
})

const engine = createDesigner({})
```

```vue
<template>
  <Designer :engine="engine">
    <StudioPanel>
      <SettingsForm :components="{ Input, Select, FormItem }" />
      <!-- palette, tree, canvas, history… -->
    </StudioPanel>
  </Designer>
</template>
```

The canvas JSON export (`@formivue-design/formivue-transformer`) produces
the JSON Schema replayed by `SchemaField` at runtime. The full
implementation lives in
[`examples/designer-playground/src/app.ts`](examples/designer-playground/src/app.ts).

The playground opens in Standard mode. Choose Advanced in the toolbar or open
`http://127.0.0.1:3004/?mode=advanced` to load the extended palette and preview
registry. Each mode saves its form separately in the browser.

Use [`@formivue-design/shadcn-advanced-runtime`](design/shadcn-advanced-runtime/README.md)
to render exported advanced schemas. The optional
[`@formivue-design/shadcn-advanced-designer`](design/shadcn-advanced-designer/README.md)
package supplies the palette and property editors. The
[headless `@formivue/flow` package](manager/flow/README.md) also runs with the
form engine alone.

Charts use their own named components in
[`@formivue-design/charts-runtime`](design/charts-runtime/README.md). The
matching canvas components, palette and mapping editors are in
[`@formivue-design/charts-designer`](design/charts-designer/README.md).

### 4. Feeding / reading values

```ts
// feed
form.setValues(jsonData, 'merge') // 'merge' | 'deepMerge' | 'overwrite'
form.setValuesIn('a.0.b', 42)
form.setFieldState('rent', (state) => (state.value = 950))

// read (reactive — observable)
form.values // full state
form.getValuesIn('rent')
form.query('rent').value()

// submit — resolves the validators then hands back the values
form.submit().then((values) => sendToServer(values))

// continuous bridge to a Vue ref (snapshot)
import { autorun } from '@formivue/reactive'
const snapshot = ref({})
autorun(() => {
  snapshot.value = JSON.parse(JSON.stringify(form.values)) // tracked read
})
```

### 5. Tailwind 4 theme

The packages embed **Tailwind 4 utility classes** with no per-package CSS:
the **consumer** provides the Tailwind entry — CSS variables
(`shadcn-vue` recipe, `new-york-v4` registry) and `@source` on the dist of
the consumed packages:

```css
@import 'tailwindcss';

@source '../node_modules/@formivue-design/vue-ui/dist';
@source '../node_modules/@formivue-design/vue/dist';
/* … same for every consumed @formivue-design/* package */

:root {
  --background: oklch(1 0 0);
  /* … shadcn tokens — the only theme contract the headless stack requires */
}

@theme inline {
  --color-background: var(--background);
  /* … */
}
```

Full reference:
[`examples/designer-playground/src/styles.css`](examples/designer-playground/src/styles.css)
(dark mode by overriding the variables).

## Playgrounds & demos

| Command                              | Content                                | URL                   |
| ------------------------------------ | -------------------------------------- | --------------------- |
| `pnpm start:playground`              | **full designer** (reference scenario) | http://127.0.0.1:3004 |
| `pnpm start:basic`                   | minimal designer                       | http://127.0.0.1:3000 |
| `pnpm start:multi-workspace`         | multi-workspace designer               | http://127.0.0.1:3001 |
| `pnpm start:sandbox`                 | iframe sandbox                         | http://127.0.0.1:3002 |
| `pnpm start:sandbox-multi-workspace` | multi-workspace sandbox                | http://127.0.0.1:3003 |
| `pnpm demo:playground`               | **engine** playground (Vite)           | http://127.0.0.1:5174 |
| `pnpm demo:docs`                     | documentation site (vitepress)         | http://127.0.0.1:5175 |
| `pnpm demo:all`                      | both demos at once                     | 5174 + 5175           |

## Scripts

| Script                                | Role                                                              |
| ------------------------------------- | ----------------------------------------------------------------- |
| `pnpm -r build`                       | ESM build of the 18 packages + Vite builds of the apps            |
| `pnpm harness`                        | Full verification locally and in CI                               |
| `pnpm test` / `pnpm test:watch`       | Vitest (engine + designer + load + wiring suites, a11y gate)      |
| `pnpm lint`                           | ESLint flat + `meta:check` gate                                   |
| `pnpm format` / `pnpm format:check`   | Prettier                                                          |
| `pnpm typecheck`                      | `tsc --noEmit` (manager, design, apps) + `vue-tsc` (Vite example) |
| `pnpm check:formivue`                 | engine wiring smoke (`workspace:*` resolutions + ESM)             |
| `pnpm meta:sync` / `pnpm meta:check`  | single version & metadata (`package-meta.json`)                   |
| `pnpm changeset`                      | add a changeset (`fixed` group of the 18 packages)                |
| `pnpm changeset:version` / `:publish` | version then publish                                              |

## Tests & quality

- **Vitest** — engine suites (`manager/*`), designer suites
  (`design/*`), load tests, wiring tests and the a11y gate
- **a11y** — `axe-core` = 0 violation on the repo's code: a Vitest gate on
  every designer app + a browser proof
- **typecheck** — `tsc --noEmit` on every package + `vue-tsc` on the Vite
  example
- **single version** — every package shares the version and metadata
  declared in [`package-meta.json`](./package-meta.json), propagated by
  `pnpm meta:sync` and checked by the `pnpm meta:check` gate (chained into
  `pnpm lint`)

## Documentation

The engine's reference documentation is the vitepress site
[`manager/vue/docs`](./manager/vue/docs) (`pnpm demo:docs`):

- [Introduction](./manager/vue/docs/guide/index.md)
- [Core engine](./manager/vue/docs/guide/core.md) — `createForm`, Form/Field API, `Query`
- [Effects & lifecycle hooks](./manager/vue/docs/guide/effects.md)
- [Vue components & hooks](./manager/vue/docs/guide/vue-components.md) — `FormProvider`, `Field`, `SchemaField`, `connect`/`mapProps`
- [JSON Schema](./manager/vue/docs/guide/json-schema.md) — `x-reactions`, expressions, `Schema` API
- [Validation](./manager/vue/docs/guide/validation.md) — rules, formats, locales, `zod` bridge
- [Reactivity](./manager/vue/docs/guide/reactive.md) — observable core + Vue bridge
- [Utilities](./manager/vue/docs/guide/utilities.md) — `@formivue/shared`, `@formivue/path`, `@formivue/grid`

## Contributing

Full development guide (build, tests, demos, version bump, publishing):
[`DEVELOPMENT.md`](./DEVELOPMENT.md).

```bash
pnpm install               # install the workspace
pnpm -r build              # build the packages (required by the apps)
pnpm test                  # Vitest suites
pnpm lint && pnpm format   # ESLint + Prettier
```

- Git hooks (`simple-git-hooks` + `lint-staged`) run ESLint and Prettier on
  changed files at pre-commit.
- Versions are managed by **changesets** (`fixed` group of the 18
  packages): add a changeset via `pnpm changeset`, version with
  `pnpm changeset:version`, publish with `pnpm changeset:publish`.
- The project is MIT licensed — contributions are welcome (fork, branch,
  changeset, pull request).

## License

[MIT](./LICENSE) — © Stefapi
