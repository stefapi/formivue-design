# @formivue/reactive-vue

**Vue 3** adapter of the reactive core
[`@formivue/reactive`](../reactive) (packages of the
[`manager/`](../../manager), copy of the formivue v3 fork).

- **`observer(component)`** — `defineComponent` component wrapper: makes
  the component reactive to the `@formivue/reactive` observables used in
  its rendering (a single invalidation per batch) — the Vue equivalent of
  the React-era `observer`.
- **`useObserver(options?)`** — reactive rendering hook (tracking around
  the composable's body, stopped on unmount).

## Example

```ts
import { observer } from '@formivue/reactive-vue'
import { observable } from '@formivue/reactive'

const state = observable({ count: 0 })
const Counter = observer(() =>
  h('button', { onClick: () => state.count++ }, state.count),
)
```

Used by the entire rendering layer of the Vue form designer
(`@formivue-design/vue*`) and the [`@formivue/vue`](../vue) bindings.
Version, repository and license: see
[`package-meta.json`](../../package-meta.json).
