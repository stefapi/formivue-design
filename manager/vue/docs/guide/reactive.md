# @formivue/reactive — the reactive core

`@formivue/core`'s state graph (Form → Fields, drafts, pattern lifecycles) is
built on `@formivue/reactive`, a framework-agnostic reactivity system —
which is why core runs headless, in Node, workers or any renderer.

```ts
import {
  observable, batch, action, untracked,
  autorun, reaction, observe, define, model,
} from '@formivue/reactive'

const state = observable({ count: 0 })

// annotations
observable.box(value) / observable.ref(value)
observable.deep(target)   / observable.shallow(target)
observable.computed(() => ...)

autorun(() => console.log(state.count))   // collects dependencies, re-runs on change
reaction(() => state.count, (v, old) => {}) // run-on-change
batch(() => { state.count = 1; state.count = 2 })  // ONE notification — synchronous
observe(target, (operation) => {})
define(target, { count: observable.deep })   // typed annotations
model(target)                                 // deep observable + observable.model
untracked(() => ...)                          // no dependency collection
action(fn) / action.bound                     // boundary variants: batch.bound, batch.scope
```

Externals: `isObservable`, `isAnnotation`, `isSupportObservable`,
`markRaw`, `markObservable`, `raw`, `toJS`, `contains`, `hasCollected`.
A `Tracker` class gives manual dependency tracking (`track()`/`dispose()`).

Read the full rationale (why two reactivity systems and how **not** to mix
them) in the [reactive vs Vue guide](./reactive-vs-vue.md).

## `@formivue/reactive-vue` — the only sanctioned bridge

Two exports: `observer(component)` and `useObserver(options?)`.

```ts
import { observer } from '@formivue/reactive-vue'

// wraps a component's setup/render: reads of formivue models
// inside render collect @formivue/reactive deps and re-run the render on change
const FormStatePanel = observer(
  defineComponent({
    setup: () => () => h('pre', JSON.stringify(form.values)),
  }),
)
```

`useObserver()` may also be called directly inside a `setup()` — it binds a
`Tracker` to the instance's `$forceUpdate` (with an optional
`scheduler: (updater) => void`), and disposes on `onBeforeUnmount`.
