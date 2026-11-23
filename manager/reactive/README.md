# @formivue/reactive

**Reactive** core of the form manager ([`manager/`](../../manager), copy of
the formivue v3 fork) — a [MobX](https://github.com/mobxjs/mobx)-style reactivity
library, with no UI dependency.

- **`observable`** — makes an object/array/map deeply observable;
  `define` — fine-grained definition
  (`observable.deep/ref/box/shallow/computed`); `markRaw`/`raw` — tracking
  opt-out.
- **`action`/`batch`** — tracked, batched mutations (a single invalidation
  per batch); `untracked` — reads outside tracking.
- **`autorun`** — reactive tracked execution; `reaction` — reacts to
  dependencies; `observe` — low-level observation of an observable.
- **`tracker`** — manual tracking (used by the form designer: a single
  tracking instance for host **and** iframe sandbox).

## Example

```ts
import { observable, autorun, batch } from '@formivue/reactive'

const state = observable({ count: 0 })
autorun(() => console.log(state.count)) // 0
batch(() => {
  state.count = 1
  state.count = 2
}) // a single notification: 2
```

Vue adapter: [`@formivue/reactive-vue`](../reactive-vue). Version,
repository and license: see [`package-meta.json`](../../package-meta.json).
