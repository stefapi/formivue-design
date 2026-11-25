# @formivue-design/vue

Vue 3.5 components and composables for the visual editor. The designer wraps
the engine from `@formivue-design/core` with canvas, workspace, resource and
settings panels.

- Engine: `@formivue-design/core` consumed **as-is** (framework-agnostic).
- Reactivity: `observer` from `@formivue/reactive-vue` (fork), `autorun`/`reaction` from
  `@formivue/reactive`.
- UI: register `@source '../node_modules/@formivue-design/vue/dist';` in
  the Tailwind entry and supply the [`vue-ui` theme](../vue-ui/README.md).
  Applications using the standard canvas materials can import
  `@formivue-design/formivue-vue/styles.css` for the material and runtime sources.

## Recipe

```ts
import {
  Designer,
  StudioPanel,
  Workbench,
  ViewPanel,
} from '@formivue-design/vue'
import { createDesigner } from '@formivue-design/core'

const engine = createDesigner()
```

```html
<Designer :engine="engine">…</Designer>
```

See the [designer playground](../../examples/designer-playground/README.md)
for the panel wiring and preview registry.
