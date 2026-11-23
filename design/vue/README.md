# @formivue-design/vue

The designer's **Vue 3.5** rendering layer — port of `@formivue-design/react` (public names
kept: hooks → composables, components → `defineComponent`).

- Engine: `@formivue-design/core` consumed **as-is** (framework-agnostic).
- Reactivity: `observer` from `@formivue/reactive-vue` (fork), `autorun`/`reaction` from
  `@formivue/reactive`.
- UI: chromes on `@formivue-design/vue-ui` (headless reka-ui + Tailwind 4, V2/V6) — the
  utility classes live in the sources, the consumer scans them via
  `@source "@formivue-design/vue"` (see the `@formivue-design/vue-ui` README).

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
