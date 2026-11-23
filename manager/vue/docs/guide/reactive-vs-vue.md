# @formivue/reactive vs Vue reactivity — when to use what

> A recurring question about this fork: **why two reactivity systems, and how do you avoid mixing them?**

## Simple rule

| Need                                                | Use                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Local UI state, derived props, component refs       | **Vue**: `ref`, `computed`, `watch`, `watchEffect`                                                       |
| The form/field/heart graph of `@formivue/core`      | **@formivue/reactive** (`observable`, `observable.deep`, `batch`, `autorun`)                             |
| Wiring a Vue component to a formivue reactive model | **@formivue/reactive-vue**: `observer()`, `useObserver()`, `useReactive()` — **the only allowed bridge** |

## Why formivue does not use Vue reactivity in its core

`@formivue/core` must exist **without Vue**: it is a headless form engine, consumable on the Node side (server-side validation, migration scripts), in workers, and tomorrow by other renderers (custom SSR, canvas…). Its graph (Form → Field → Graph → Heart, drafts, lifecycles by patterns) relies on `@formivue/reactive`, framework-agnostic, whose dependency-collection granularity and synchronous batching (`batch`, `boundaries`) are tailored for deep graph updates — not just for DOM rendering.

## The bridge: @formivue/reactive-vue

`observer(component)` wraps a Vue component's `setup`: every formivue model read (form.values, field.display…) **during render** collects its `@formivue/reactive` dependencies, and re-schedules the component's render when they change. The component remains a standard Vue component (props, emits, slots, lifecycle hooks) — it is the render that becomes reactive to formivue models.

```ts
import { observer } from '@formivue/reactive-vue'
import { observable } from '@formivue/reactive'

const model = observable({ count: 0 })

const Counter = observer(
  defineComponent({
    setup() {
      // reading model.count here (render) creates the dependency
      return () =>
        h('button', { onClick: () => model.count++ }, String(model.count))
    },
  }),
)
```

## Never mix them manually

```ts
// ❌ Anti-pattern
const myModel = reactive({ count: 0 }) // Vue reactivity
autorun(() => render(myModel.count)) // formivue tracker

// ✅ Correct: one system per layer
const ui = ref(0) // Vue for the UI
const formState = observable({ drafts: {} }) // formivue for the form
const MyComponent = observer(
  defineComponent({
    setup() {
      return () => h('div', String(ui.value) + JSON.stringify(formState.drafts))
    },
  }),
)
```

Both systems are **excellent** but independent: `@formivue/reactive` does not know that Vue's `ref` exists (and vice versa). A formivue `autorun` on a Vue `ref` will collect nothing; a Vue `watch` on a formivue `observable` will see nothing (the object remains a formivue Proxy). Hence:

1. **Vue** → everything that is rendering/props/local state of the component;
2. **formivue/reactive** → everything that is form state (via `@formivue/core`);
3. **reactive-vue (`observer`)** → the only glue point between the two.

## Edge cases

- **Vue `shallowRef`/`shallowReactive`**: if you wrap a formivue observable in a `shallowRef`, the render will track the model's **reference**, not its internal granularity — use `observer` rather than `shallowRef(form)`.
- **`toRaw`/`markRaw`**: on the formivue side, the equivalents are `raw()` and `markRaw()` from `@formivue/reactive` (careful: `markRaw`/`markObservable` do not affect arrow functions without a `prototype` — fixed in v3).
- **Batch**: formivue's `batch(fn)` is synchronous and independent of Vue's `nextTick`. Within the same event handler, prefer formivue `batch` for form mutations, and let the Vue scheduler do its job for the rest.
